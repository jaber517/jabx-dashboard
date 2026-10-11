import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isAuthorizedStudioNotification,
  parseStudioNotification
} from "../lib/studio-notify";

test("studio notification auth accepts only the configured bearer secret", () => {
  assert.equal(
    isAuthorizedStudioNotification("Bearer notify-secret", "notify-secret"),
    true
  );
  assert.equal(
    isAuthorizedStudioNotification("Bearer wrong-secret", "notify-secret"),
    false
  );
  assert.equal(
    isAuthorizedStudioNotification("Basic notify-secret", "notify-secret"),
    false
  );
  assert.equal(isAuthorizedStudioNotification(null, "notify-secret"), false);
  assert.equal(isAuthorizedStudioNotification("Bearer notify-secret", undefined), false);
});

test("parseStudioNotification accepts the required fields and ignores extras", () => {
  assert.deepEqual(
    parseStudioNotification({
      company: "Jabx Studio",
      package: "Sprint",
      sector: "Technology",
      email: "private@example.test"
    }),
    {
      company: "Jabx Studio",
      package: "Sprint",
      sector: "Technology"
    }
  );
});

test("parseStudioNotification validates company length and string fields", () => {
  assert.ok(
    parseStudioNotification({ company: "Ja", package: "Sprint", sector: "Technology" })
  );
  assert.ok(
    parseStudioNotification({
      company: "J".repeat(150),
      package: "Sprint",
      sector: "Technology"
    })
  );
  assert.equal(
    parseStudioNotification({ company: "J", package: "Sprint", sector: "Technology" }),
    null
  );
  assert.equal(
    parseStudioNotification({ company: "J".repeat(151), package: "Sprint", sector: "Technology" }),
    null
  );
  assert.equal(
    parseStudioNotification({ company: "Jabx", package: null, sector: "Technology" }),
    null
  );
  assert.equal(
    parseStudioNotification({ company: "Jabx", package: "Sprint", sector: 42 }),
    null
  );
  assert.equal(parseStudioNotification(null), null);
});
