// Edge-safe auth helpers (Web Crypto only) shared by middleware and server code.

export const SESSION_COOKIE = "jabx_session";

// sha256("<passcode>:jabx-pass-v1"). The passcode itself is not stored in the
// repo; setting the DASHBOARD_PASSWORD env var overrides this fallback.
const FALLBACK_PASSCODE_SHA256 =
  "ac38c7d35f68ef18b158908d9fd5bc83014aac6ffb1f0cd843a397560c3b9aad";

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function passcodeHash(): Promise<string> {
  const envPassword = process.env.DASHBOARD_PASSWORD;
  return envPassword ? sha256Hex(`${envPassword}:jabx-pass-v1`) : FALLBACK_PASSCODE_SHA256;
}

export async function verifyPasscode(input: string): Promise<boolean> {
  return (await sha256Hex(`${input}:jabx-pass-v1`)) === (await passcodeHash());
}

export async function expectedSessionToken(): Promise<string> {
  return sha256Hex(`${await passcodeHash()}:jabx-session-v1`);
}
