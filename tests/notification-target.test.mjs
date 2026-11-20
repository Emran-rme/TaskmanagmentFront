import test from "node:test";
import assert from "node:assert/strict";
import { notificationTarget } from "../src/lib/notificationTarget.ts";

const task = "788b5648-1892-4db1-bd02-6c5fde99462a";
const project = "cc754d45-f201-4958-b979-8f3257ef4512";
test("task links take precedence over project links", () => {
  assert.equal(notificationTarget({ taskId: task, payloadJson: JSON.stringify({ ProjectId: project }) }), `/tasks/${task}`);
});
test("structured project and task notifications support both JSON casing conventions", () => {
  assert.equal(notificationTarget({ payloadJson: JSON.stringify({ projectId: project }) }), `/projects/${project}`);
  assert.equal(notificationTarget({ payloadJson: JSON.stringify({ TaskId: task }) }), `/tasks/${task}`);
});
test("invalid and legacy payloads do not create unsafe routes", () => {
  assert.equal(notificationTarget({ taskId: "https://evil.example" }), null);
  assert.equal(notificationTarget({ payloadJson: "not-json" }), null);
});
