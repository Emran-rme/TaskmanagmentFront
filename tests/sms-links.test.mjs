import test from "node:test";
import assert from "node:assert/strict";
import { safeReturnTo, authDestination } from "../src/lib/returnTo.ts";
import { insertSmsParameter } from "../src/lib/smsParameterInsertion.ts";
const task = "/tasks/12345678-1234-1234-1234-123456789abc";
const project = "/projects/12345678-1234-1234-1234-123456789abc";
test("SMS destinations survive login and company selection", () => {
 for (const target of [task, project]) {
  const login = authDestination("/login", target);
  const afterLogin = safeReturnTo(new URLSearchParams(login.split("?")[1]).get("returnTo"));
  const context = authDestination("/select-context", afterLogin);
  assert.equal(safeReturnTo(new URLSearchParams(context.split("?")[1]).get("returnTo")), target);
 }
});
test("external and malformed destinations never redirect out", () => {
 for (const input of [null, "https://evil.test", "//evil.test", "/\\evil.test", "/login", "/tasks/not-an-id", task + "?returnTo=https://evil.test", "%2f%2fevil.test"]) assert.equal(safeReturnTo(input), "/");
});
test("parameter buttons insert at cursor and replace selection", () => {
 assert.deepEqual(insertSmsParameter("hello world", "{url}", 6, 11), { value: "hello {url}", caret: 11 });
 assert.deepEqual(insertSmsParameter("", "{projectUrl}", 0, 0), { value: "{projectUrl}", caret: 12 });
 assert.equal(insertSmsParameter("a".repeat(1500), "{url}", 1495, 1500).value.length, 1500);
 assert.throws(() => insertSmsParameter("a".repeat(1500), "{url}", 1500, 1500));
});
