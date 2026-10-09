import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import {
  createTeamStepUpCookieValue,
  readTeamStepUpCookieValue,
  TEAM_STEP_UP_SECONDS
} from "../lib/team-step-up-cookie";

let previousSecret: string | undefined;

before(() => {
  previousSecret = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = "unit-test-auth-secret";
});

after(() => {
  if (previousSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = previousSecret;
});

test("step-up cookie is signed, session-bound and valid for exactly 120 seconds", async () => {
  const checkedAt = 1_791_560_000;
  const cookie = await createTeamStepUpCookieValue("session-a", checkedAt);

  assert.equal(await readTeamStepUpCookieValue(cookie, "session-a", checkedAt), checkedAt);
  assert.equal(await readTeamStepUpCookieValue(cookie, "session-a", checkedAt + TEAM_STEP_UP_SECONDS), checkedAt);
  assert.equal(await readTeamStepUpCookieValue(cookie, "session-a", checkedAt + TEAM_STEP_UP_SECONDS + 1), null);
  assert.equal(await readTeamStepUpCookieValue(cookie, "session-b", checkedAt), null);
  assert.equal(await readTeamStepUpCookieValue(`${cookie}tampered`, "session-a", checkedAt), null);
});
