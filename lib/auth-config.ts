// Edge-safe auth helpers (Web Crypto only) shared by middleware and server code.

export const SESSION_COOKIE = "jabx_session";

// The passcode comes only from the DASHBOARD_PASSWORD env var. There is
// deliberately no built-in fallback: this repo is public, so any value derived
// from committed code could be used to forge a session. If the variable is
// missing, nobody can sign in and no session is ever valid.

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
  return expected !== null && (await sha256Hex(`${input}:jabx-pass-v1`)) === expected;
}

export async function expectedSessionToken(): Promise<string | null> {
  const hash = await passcodeHash();
  return hash === null ? null : sha256Hex(`${hash}:jabx-session-v1`);
}
