import type { MyWorkPage } from "./types";
import type { Tag, TagData } from "./tags";

type WorkItem = MyWorkPage["items"][number];

export function normalizeWorkSearch(value: string) {
  return value.normalize("NFKC").trim().replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/\s+/g, " ").toLocaleLowerCase();
}

export function workItemTaskId(item: WorkItem): string | null {
  if (!["project-task", "standalone-task", "approval", "extension"].includes(item.kind)) return null;
  return /^\/tasks\/([^/?#]+)(?:[?#].*)?$/.exec(item.href)?.[1] ?? null;
}

export function indexWorkTags(items: WorkItem[], data?: TagData) {
  const itemTaskIds = new Set(items.map(workItemTaskId).filter((id): id is string => id !== null));
  const byId = new Map((data?.tags || []).map(tag => [tag.id, tag]));
  const byTask = new Map<string, Tag[]>();
  const used = new Set<string>();
  for (const relation of data?.taskTags || []) {
    const tag = byId.get(relation.tagId);
    if (!tag || !itemTaskIds.has(relation.taskId)) continue;
    if (!byTask.has(relation.taskId)) byTask.set(relation.taskId, []);
    byTask.get(relation.taskId)!.push(tag);
    used.add(tag.id);
  }
  return { byTask, suggestions: (data?.tags || []).filter(tag => used.has(tag.id)) };
}

export function workItemMatches(item: WorkItem, search: string, selectedTagId: string | null, byTask: Map<string, Tag[]>) {
  const taskId = workItemTaskId(item);
  const tags = taskId ? byTask.get(taskId) || [] : [];
  if (selectedTagId && !tags.some(tag => tag.id === selectedTagId)) return false;
  const query = normalizeWorkSearch(search);
  return !query || normalizeWorkSearch([item.title, item.code, item.projectName, item.company, ...tags.map(tag => tag.name)].join(" ")).includes(query);
}
