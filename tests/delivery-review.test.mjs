import { test } from "node:test";
import { strict as assert } from "node:assert";
import { rejectionRequest, shouldReviewDelivery } from "../src/lib/deliveryReview.ts";

const flow = (stage, status = "Waiting", enabled = true) => ({ stage, status, enabled });

test("only authorized reviewers see the current approval stage by default", () => {
  assert.equal(shouldReviewDelivery("حل شده", true, flow("approval"), true), true);
  assert.equal(shouldReviewDelivery("در حال انجام", true, flow("approval"), true), true);
  assert.equal(shouldReviewDelivery("حل شده", false, flow("approval"), true), false);
  assert.equal(shouldReviewDelivery("بسته شده", true, flow("approval"), true), false);
  assert.equal(shouldReviewDelivery("حل شده", true, flow("work"), true), false);
  assert.equal(shouldReviewDelivery("حل شده", true, flow("delay"), true), false);
  assert.equal(shouldReviewDelivery("حل شده", true, undefined, false), false);
});

test("rejection follows the workflow route and preserves version; legacy returns to work", () => {
  assert.deepEqual(rejectionRequest("123", true, "  اصلاح شود  ", 90, "v1"), {
    url: "tasks/123/workflow/reject", body: { reason: "اصلاح شود", version: "v1" },
  });
  assert.deepEqual(rejectionRequest("123", false, " اصلاح ", 95, "v2"), {
    url: "tasks/123/progress", body: { progress: 89, status: "در حال انجام", action: "برگشت خروجی: اصلاح", blocked: false, blocker: "", version: "v2" },
  });
  assert.throws(() => rejectionRequest("123", true, "   ", 90, "v1"));
});

test("legacy and bypassed tasks use the solved status without treating completed workflows as pending", () => {
  assert.equal(shouldReviewDelivery("حل شده", true, null, true), true);
  assert.equal(shouldReviewDelivery("حل شده", true, flow("work", "Bypassed"), true), true);
  assert.equal(shouldReviewDelivery("حل شده", true, flow("work", "Waiting", false), true), true);
  assert.equal(shouldReviewDelivery("در حال انجام", true, null, true), false);
  assert.equal(shouldReviewDelivery("حل شده", true, flow("approval", "Completed"), true), false);
});
