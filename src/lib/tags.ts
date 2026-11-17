import { api } from "../store";
export interface Tag { id: string; name: string; color: string; createdBy?: number | null; canManage?: boolean }
export interface TagData { tags: Tag[]; taskTags: { taskId: string; tagId: string }[] }
export const tagApi = api.injectEndpoints({ endpoints: (b) => ({
  tags: b.query<TagData, void>({ query: () => "tasks/tags", providesTags: ["Tags"] }),
  createTag: b.mutation<Tag, {name: string; color: string}>({ query: (body) => ({url: "tasks/tags", method: "POST", body}), invalidatesTags: ["Tags"] }),
  updateTag: b.mutation<Tag, {id: string; name: string; color: string}>({ query: ({id, ...body}) => ({url: `tasks/tags/${id}`, method: "PUT", body}), invalidatesTags: ["Tags"] }),
  deleteTag: b.mutation<void, string>({ query: (id) => ({url: `tasks/tags/${id}`, method: "DELETE"}), invalidatesTags: ["Tags"] }),
  setTaskTags: b.mutation<unknown, {id: string; tagIds: string[]}>({ query: ({id, tagIds}) => ({url: `tasks/${id}/tags`, method: "PUT", body: {tagIds}}), invalidatesTags: ["Tags"] }),
}) });
export const { useTagsQuery, useCreateTagMutation, useUpdateTagMutation, useDeleteTagMutation, useSetTaskTagsMutation } = tagApi;
const indexes = new WeakMap<TagData["taskTags"], Map<string, Set<string>>>();
export function taskTagIndex(relations: TagData["taskTags"]) {
  let index = indexes.get(relations);
  if (!index) {
    index = new Map();
    for (const relation of relations) {
      if (!index.has(relation.taskId)) index.set(relation.taskId, new Set());
      index.get(relation.taskId)!.add(relation.tagId);
    }
    indexes.set(relations, index);
  }
  return index;
}
export const matchesTags = (taskId: string, selected: string[], relations: TagData["taskTags"]) => selected.length === 0 || selected.every(id => taskTagIndex(relations).get(taskId)?.has(id));
