// Edge-safe auth helpers (Web Crypto only), shared by middleware and server code.

export const SESSION_COOKIE = "jabx_session";
export const CHALLENGE_COOKIE = "jabx_webauthn";
export const SESSION_DAYS = 30;

// The passcode comes only from the DASHBOARD_PASSWORD env var. There is
// deliberately no built-in fallback: this repo is public, so any value derived
// from committed code could be used to forge a session. If the variable is
// missing, nobody can sign in with a passcode and no cookie is ever valid.

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function passcodeHash(): Promise<string | null> {
  const envPassword = process.env.DASHBOARD_PASSWORD;
  return envPassword ? sha256Hex(`${envPassword}:jabx-pass-v1`) : null;
}

export async function verifyPasscode(input: string): Promise<boolean> {
  const expected = await passcodeHash();
  return expected !== null && timingSafeEqual(await sha256Hex(`${input}:jabx-pass-v1`), expected);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Cookies are signed with AUTH_SECRET when it is set, otherwise with a key
// derived from DASHBOARD_PASSWORD, so changing the passcode also signs out
// every device.
async function signingKey(): Promise<CryptoKey | null> {
  const secret = process.env.AUTH_SECRET || (process.env.DASHBOARD_PASSWORD ? await sha256Hex(`${process.env.DASHBOARD_PASSWORD}:jabx-cookie-key-v2`) : "");
  if (!secret) return null;
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

async function hmac(payload: string): Promise<string | null> {
  const key = await signingKey();
  if (!key) return null;
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** "<payload>.<hmac>", or null when no signing key is configured. */
export async function sign(payload: string): Promise<string | null> {
  const signature = await hmac(payload);
  return signature ? `${payload}.${signature}` : null;
}

/** The payload of a value made by sign(), or null if the signature is wrong. */
export async function unsign(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  const cut = value.lastIndexOf(".");
  if (cut <= 0) return null;
  const payload = value.slice(0, cut);
  const expected = await hmac(payload);
  return expected && timingSafeEqual(value.slice(cut + 1), expected) ? payload : null;
}

/**
 * Checks a session cookie's signature and expiry without a database, for the
 * middleware. The server then confirms the session still exists (a device
 * signed out from Settings fails there).
 */
export async function readSessionCookie(value: string | undefined): Promise<{ token: string; expiresAt: number } | null> {
  const payload = await unsign(value);
  if (!payload) return null;
  const [token, expires] = payload.split(":");
  const expiresAt = Number(expires);
  if (!token || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null;
  return { token, expiresAt };
}
