import assert from "node:assert/strict";
import { test } from "node:test";
import {
  bridgeBodySha256,
  bridgeSignature,
  bridgeStepUpSignature,
  teamBridgeRequest,
  type TeamBridgeConfig
} from "../lib/team-bridge";

const SECRET = "dGhpcy1pcy1hLXRlc3Qtb25seS1icmlkZ2Uta2V5ITE";

const VECTORS = [
  {
    method: "GET",
    path: "/api/snapshot",
    body: "",
    ts: 1791560000,
    nonce: "AAECAwQFBgcICQoLDA0ODw",
    bodySha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    signature: "ffd6c415e4031f1dde38768c845e5cbeaabd95cabc4856b794c8293c8ecf033b",
    stepUpSignature: "e0f1c6013210220fc769983425ec3fac3cdac73eac1a046c8ef5565f97315fd6"
  },
  {
    method: "POST",
    path: "/api/proposals/p-1/start",
    body: "{\"request_id\":\"00000000-0000-4000-8000-000000000001\"}",
    ts: 1791560060,
    nonce: "EBESExQVFhcYGRobHB0eHw",
    bodySha256: "c967bbb59dee10305e571d08c12b3dd42c6f5c463a19b13847f77ec7dd6b1581",
    signature: "5daaf3c13633b5c905527d6b79cd495903855f1a6d151092bbad7e76d43e5a2d",
    stepUpSignature: "b362c87cb147096880237e457756c50dbf3487b7f147ff8057aa2728d9fbf73f"
  },
  {
    method: "GET",
    path: "/api/runs?project_id=jabx&task_id=t-1",
    body: "",
    ts: 1791560120,
    nonce: "ICEiIyQlJicoKSorLC0uLw",
    bodySha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    signature: "8214eb8aa43446f22d079ae4c758587ea8ffedf0b98cb588d1d7a7a98bc976a2",
    stepUpSignature: "4a0985e11f578f44d42627f784ae71dc5a8b10959cb858e9d11bad5e06f8b01a"
  }
] as const;

test("bridge signing matches every v1 contract vector", () => {
  for (const vector of VECTORS) {
    assert.equal(bridgeBodySha256(vector.body), vector.bodySha256);
    assert.equal(
      bridgeSignature({
        secret: SECRET,
        method: vector.method,
        path: vector.path,
        body: vector.body,
        ts: vector.ts,
        nonce: vector.nonce
      }),
      vector.signature
    );
    assert.equal(bridgeStepUpSignature(SECRET, vector.ts, vector.nonce), vector.stepUpSignature);
  }
});

function config(baseUrl: string): TeamBridgeConfig {
  return { baseUrl, accessClientId: "test-id", accessClientSecret: "test-token", bridgeSecret: SECRET };
}

test("closed port maps to offline", async () => {
  const result = await teamBridgeRequest({ method: "GET", path: "/api/health", config: config("http://127.0.0.1:65534") });
  assert.deepEqual(result, { ok: false, offline: true, reason: "network error" });
});

test("Cloudflare 530 maps to offline", async () => {
  const result = await teamBridgeRequest({
    method: "GET",
    path: "/api/health",
    config: config("https://team.test"),
    fetchImpl: async () => new Response('{"error":"origin_down"}', { status: 530, headers: { "content-type": "application/json" } })
  });
  assert.deepEqual(result, { ok: false, offline: true, reason: "upstream returned 530" });
});

test("request timeout maps to offline", async () => {
  const hangingFetch: typeof fetch = async (_input, init) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
  });
  const result = await teamBridgeRequest({
    method: "GET",
    path: "/api/health",
    config: config("https://team.test"),
    timeoutMs: 30,
    fetchImpl: hangingFetch
  });
  assert.deepEqual(result, { ok: false, offline: true, reason: "timeout" });
});

test("Cloudflare HTML errors map to offline", async () => {
  const result = await teamBridgeRequest({
    method: "GET",
    path: "/api/health",
    config: config("https://team.test"),
    fetchImpl: async () => new Response("<!doctype html><title>Cloudflare Access</title>", {
      status: 403,
      headers: { "content-type": "text/html" }
    })
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.reason, /Cloudflare/);
});

test("JSON 4xx responses pass through", async () => {
  const result = await teamBridgeRequest({
    method: "POST",
    path: "/api/runs/r-1/cancel",
    config: config("https://team.test"),
    fetchImpl: async () => new Response('{"error":"step_up_required"}', { status: 403, headers: { "content-type": "application/json" } })
  });
  assert.deepEqual(result, { ok: true, status: 403, json: { error: "step_up_required" } });
});
