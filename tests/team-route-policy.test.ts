import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveTeamRoute } from "../lib/team-route-policy";

const ALLOWED: Array<["GET" | "POST", string[], string?]> = [
  ["GET", ["snapshot"]],
  ["GET", ["attention"]],
  ["GET", ["threads"]],
  ["GET", ["threads", "thread-1"], "?after=message_1"],
  ["GET", ["proposals", "proposal.1"]],
  ["GET", ["proposals", "proposal.1", "eligibility"]],
  ["GET", ["runs"], "?project_id=jabx&task_id=t-1"],
  ["GET", ["runs", "run_1"]],
  ["GET", ["runner"]],
  ["GET", ["health"]],
  ["POST", ["threads", "open"]],
  ["POST", ["threads", "thread-1", "messages"]],
  ["POST", ["proposals", "proposal-1", "decision"]],
  ["POST", ["proposals", "proposal-1", "start"]],
  ["POST", ["runs", "run-1", "cancel"]]
];

test("the complete route contract is allowlisted", () => {
  for (const [method, segments, query = ""] of ALLOWED) {
    assert(resolveTeamRoute(method, segments, query), `${method} ${segments.join("/")} should be allowed`);
  }
});

test("anything outside the route and query allowlists is rejected", () => {
  const rejected: Array<[string, string[], string?]> = [
    ["DELETE", ["runs", "run-1"]],
    ["GET", ["status"]],
    ["GET", ["auth", "session"]],
    ["POST", ["snapshot"]],
    ["POST", ["runs", "run-1"]],
    ["GET", ["threads", "bad/id"]],
    ["GET", ["threads", ".."]],
    ["GET", ["threads", "thread-1"], "?unexpected=1"],
    ["GET", ["threads", "thread-1"], "?after=a&after=b"],
    ["GET", ["runs"], "?project_id=bad%2Fid"]
  ];
  for (const [method, segments, query = ""] of rejected) {
    assert.equal(resolveTeamRoute(method, segments, query), null, `${method} ${segments.join("/")}${query} should be rejected`);
  }
});

test("only decision, start and cancel require step-up", () => {
  for (const [method, segments, query = ""] of ALLOWED) {
    const route = resolveTeamRoute(method, segments, query);
    assert(route);
    const expected = method === "POST" && ["decision", "start", "cancel"].includes(segments.at(-1) ?? "");
    assert.equal(route.requiresStepUp, expected);
  }
});
