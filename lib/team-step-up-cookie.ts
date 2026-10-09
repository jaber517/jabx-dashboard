import "server-only";

import { sign, unsign } from "@/lib/auth-config";

export const TEAM_STEP_UP_COOKIE = "jabx_step_up";
export const TEAM_STEP_UP_SECONDS = 120;

export async function createTeamStepUpCookieValue(sessionId: string, checkedAt: number): Promise<string> {
  const value = await sign(`v1:${checkedAt}:${sessionId}`);
  if (!value) throw new Error("Sign-in is not configured.");
  return value;
}

/** Returns the passkey-check time in Unix seconds when the token is valid. */
export async function readTeamStepUpCookieValue(
  value: string | undefined,
  sessionId: string,
  now = Math.floor(Date.now() / 1000)
): Promise<number | null> {
  const payload = await unsign(value);
  const [version, rawCheckedAt, boundSessionId, extra] = payload?.split(":") ?? [];
  const checkedAt = Number(rawCheckedAt);
  if (
    version !== "v1" ||
    extra !== undefined ||
    !Number.isInteger(checkedAt) ||
    checkedAt > now + 5 ||
    now - checkedAt > TEAM_STEP_UP_SECONDS ||
    boundSessionId !== sessionId
  ) {
    return null;
  }
  return checkedAt;
}
