import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";
import { isJsonValue, type JsonValue } from "@/lib/team-contracts";

const OFFLINE_STATUSES = new Set([502, 503, 504, 530]);
const DEFAULT_TIMEOUT_MS = 4_000;

export type TeamBridgeConfig = {
  baseUrl: string;
  accessClientId: string;
  accessClientSecret: string;
  bridgeSecret: string;
};

export type BridgeRequest = {
  method: "GET" | "POST";
  path: string;
  body?: Uint8Array;
  contentType?: string | null;
  stepUpAt?: number;
  timeoutMs?: number;
  config?: TeamBridgeConfig;
  fetchImpl?: typeof fetch;
};

export type TeamBridgeResult =
  | { ok: true; status: number; json: JsonValue }
  | { ok: false; offline: true; reason: string };

function decodeSecret(secret: string): Buffer | null {
  if (!/^[A-Za-z0-9_-]{43}$/.test(secret)) return null;
  const key = Buffer.from(secret, "base64url");
  return key.length === 32 ? key : null;
}

export function bridgeBodySha256(body: Uint8Array | string): string {
  return createHash("sha256").update(body).digest("hex");
}

export function bridgeSignature(input: {
  secret: string;
  method: string;
  path: string;
  body: Uint8Array | string;
  ts: number;
  nonce: string;
}): string {
  const key = decodeSecret(input.secret);
  if (!key) throw new Error("TEAM_BRIDGE_SECRET must be a 32-byte base64url value.");
  const canonical = [
    "v1",
    String(input.ts),
    input.nonce,
    input.method.toUpperCase(),
    input.path,
    bridgeBodySha256(input.body)
  ].join("\n");
  return createHmac("sha256", key).update(canonical).digest("hex");
}

export function bridgeStepUpSignature(secret: string, checkedAt: number, nonce: string): string {
  const key = decodeSecret(secret);
  if (!key) throw new Error("TEAM_BRIDGE_SECRET must be a 32-byte base64url value.");
  return createHmac("sha256", key).update(`v1-step-up\n${checkedAt}\n${nonce}`).digest("hex");
}

function envConfig(): TeamBridgeConfig | null {
  const baseUrl = process.env.TEAM_BRIDGE_URL;
  const accessClientId = process.env.CF_ACCESS_CLIENT_ID;
  const accessClientSecret = process.env.CF_ACCESS_CLIENT_SECRET;
  const bridgeSecret = process.env.TEAM_BRIDGE_SECRET;
  return baseUrl && accessClientId && accessClientSecret && bridgeSecret
    ? { baseUrl, accessClientId, accessClientSecret, bridgeSecret }
    : null;
}

function isCloudflareHtml(contentType: string | null, body: string): boolean {
  const trimmed = body.trimStart().toLowerCase();
  return contentType?.toLowerCase().includes("text/html") === true || trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
}

export async function teamBridgeRequest(request: BridgeRequest): Promise<TeamBridgeResult> {
  const config = request.config ?? envConfig();
  if (!config) return { ok: false, offline: true, reason: "not configured" };

  let url: URL;
  try {
    url = new URL(request.path, config.baseUrl);
    const configured = new URL(config.baseUrl);
    if (!/^https?:$/.test(configured.protocol) || url.origin !== configured.origin || !decodeSecret(config.bridgeSecret)) {
      return { ok: false, offline: true, reason: "invalid configuration" };
    }
  } catch {
    return { ok: false, offline: true, reason: "invalid configuration" };
  }

  // Sign the URL object's serialized path, which is exactly what fetch sends.
  const signedPath = `${url.pathname}${url.search}`;
  const body = request.body ?? new Uint8Array();
  const ts = Math.floor(Date.now() / 1000);
  const nonce = randomBytes(16).toString("base64url");
  const signature = bridgeSignature({ secret: config.bridgeSecret, method: request.method, path: signedPath, body, ts, nonce });
  const headers = new Headers({
    "CF-Access-Client-Id": config.accessClientId,
    "CF-Access-Client-Secret": config.accessClientSecret,
    "X-Jabx-Bridge": `v1,ts=${ts},nonce=${nonce},sig=${signature}`,
    Accept: "application/json"
  });
  if (request.contentType) headers.set("Content-Type", request.contentType);
  if (request.stepUpAt !== undefined) {
    headers.set(
      "X-Jabx-Step-Up",
      `v1,ts=${request.stepUpAt},sig=${bridgeStepUpSignature(config.bridgeSecret, request.stepUpAt, nonce)}`
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), request.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  try {
    const response = await (request.fetchImpl ?? fetch)(url, {
      method: request.method,
      headers,
      body: request.method === "POST" ? Buffer.from(body) : undefined,
      cache: "no-store",
      signal: controller.signal
    });
    const text = await response.text();
    if (OFFLINE_STATUSES.has(response.status)) {
      return { ok: false, offline: true, reason: `upstream returned ${response.status}` };
    }
    if (isCloudflareHtml(response.headers.get("content-type"), text)) {
      return { ok: false, offline: true, reason: "Cloudflare returned an HTML error page" };
    }

    let json: unknown;
    try {
      json = text === "" ? null : JSON.parse(text);
    } catch {
      return { ok: false, offline: true, reason: "upstream returned invalid JSON" };
    }
    if (!isJsonValue(json)) return { ok: false, offline: true, reason: "upstream returned invalid JSON" };
    return { ok: true, status: response.status, json };
  } catch {
    return { ok: false, offline: true, reason: controller.signal.aborted ? "timeout" : "network error" };
  } finally {
    clearTimeout(timer);
  }
}
