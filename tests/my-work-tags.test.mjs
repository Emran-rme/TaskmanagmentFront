import test from "node:test";
import assert from "node:assert/strict";
import { indexWorkTags, normalizeWorkSearch, workItemMatches, workItemTaskId } from "../src/lib/myWorkSearch.ts";

const item = (kind, href, title = "گزارش") => ({ key: kind + href, kind, href, title, code: "TSK-1", projectName: "پروژه", company: "شرکت", status: "جدید", priority: "عادی", due: null, actionable: true });
const task = item("project-task", "/tasks/abc");
const approval = item("approval", "/tasks/abc");
const extension = item("extension", "/tasks/abc");
const other = item("standalone-task", "/tasks/def");
const todo = item("todo", "/todos");
const tags = { tags: [{ id: "tag-1", name: "کیفیت", color: "#123456" }, { id: "tag-2", name: "محرمانه", color: "#abcdef" }], taskTags: [{ taskId: "abc", tagId: "tag-1" }, { taskId: "outside", tagId: "tag-2" }] };

test("search suggests only tags attached to work items and resolves review links", () => {
  const index = indexWorkTags([task, approval, extension, other, todo], tags);
  assert.deepEqual(index.suggestions.map(tag => tag.id), ["tag-1"]);
  assert.equal(workItemTaskId(approval), "abc");
  assert.equal(workItemTaskId(extension), "abc");
  assert.equal(workItemTaskId(todo), null);
  assert.equal(workItemTaskId(item("todo", "/tasks/abc")), null);
});

test("free search matches normalized Persian or Arabic tags and preserves normal text search", () => {
  const index = indexWorkTags([task, other, todo], tags);
  assert.equal(normalizeWorkSearch(" كِيفيت  "), normalizeWorkSearch("کِیفیت"));
  assert.equal(workItemMatches(task, "كيفيت", null, index.byTask), true);
  assert.equal(workItemMatches(task, "گزارش", null, index.byTask), true);
  assert.equal(workItemMatches(other, "کیفیت", null, index.byTask), false);
  assert.equal(workItemMatches(todo, "گزارش", null, index.byTask), true);
});

test("selected tag filters all task entries, excludes todos, and combines with text", () => {
  const index = indexWorkTags([task, approval, extension, other, todo], tags);
  for (const entry of [task, approval, extension]) assert.equal(workItemMatches(entry, "", "tag-1", index.byTask), true);
  assert.equal(workItemMatches(other, "", "tag-1", index.byTask), false);
  assert.equal(workItemMatches(todo, "", "tag-1", index.byTask), false);
  assert.equal(workItemMatches(task, "ناموجود", "tag-1", index.byTask), false);
  assert.equal(workItemMatches(todo, "", null, index.byTask), true);
});
