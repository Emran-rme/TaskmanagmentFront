type NoticeTarget = { taskId?: string | null; payloadJson?: string | null };
const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function notificationTarget(notice: NoticeTarget): string | null {
  if (notice.taskId && guid.test(notice.taskId)) return `/tasks/${notice.taskId}`;
  try {
    const payload = JSON.parse(notice.payloadJson || "{}");
    const task = payload.TaskId ?? payload.taskId;
    const project = payload.ProjectId ?? payload.projectId;
    if (typeof task === "string" && guid.test(task)) return `/tasks/${task}`;
    if (typeof project === "string" && guid.test(project)) return `/projects/${project}`;
  } catch { /* Older notices do not always contain structured data. */ }
  return null;
}
