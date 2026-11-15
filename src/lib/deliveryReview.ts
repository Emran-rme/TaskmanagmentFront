import type { TaskFlow } from "./workflows";

// A workflow's current stage takes precedence over the task's display status.
export function shouldReviewDelivery(
  status: string,
  reviewer: boolean,
  flow: TaskFlow | null | undefined,
  flowLoaded: boolean,
): boolean {
  if (!flowLoaded || !reviewer || status === "بسته شده") return false;
  if (flow?.enabled && flow.status === "Waiting") return flow.stage === "approval";
  if (flow?.enabled && flow.status !== "Bypassed") return false;
  return status === "حل شده";
}

export function rejectionRequest(id: string, managed: boolean, reason: string, progress: number, version: string) {
  const trimmed = reason.trim();
  if (!trimmed) throw new Error("علت عدم تأیید الزامی است.");
  return managed
    ? { url: `tasks/${id}/workflow/reject`, body: { reason: trimmed, version } }
    : { url: `tasks/${id}/progress`, body: {
        progress: Math.min(progress, 89), status: "در حال انجام",
        action: `برگشت خروجی: ${trimmed}`, blocked: false, blocker: "", version,
      } };
}
