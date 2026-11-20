import test from "node:test";
import assert from "node:assert/strict";
import { notificationContent } from "../src/lib/notificationContent.ts";

test("task title and notification message are displayed", () => {
  assert.deepEqual(notificationContent({ message: "ارجاع شد", payloadJson: JSON.stringify({ Title: "وظیفه نمونه" }) }), { title: "وظیفه نمونه", body: "ارجاع شد" });
});
test("legacy notice uses a fallback task title", () => {
  assert.deepEqual(notificationContent({ message: "پیام", payloadJson: "bad" }, "کار قبلی"), { title: "کار قبلی", body: "پیام" });
});
test("empty notice uses generic fallback and bounds long content", () => {
  assert.equal(notificationContent({}).body, "اعلان جدید دارید.");
  assert.ok(notificationContent({ message: "x".repeat(500) }).body.length <= 351);
});
