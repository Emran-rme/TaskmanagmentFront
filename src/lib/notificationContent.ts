type NoticeContent = { message?: string | null; payloadJson?: string | null };

export function notificationContent(notice: NoticeContent, fallbackTitle = ""): { title: string; body: string } {
  let title = "";
  try {
    const payload = JSON.parse(notice.payloadJson || "{}");
    const value = payload?.Title ?? payload?.title;
    if (typeof value === "string") title = value.trim();
  } catch { /* Some older notifications do not contain JSON. */ }
  const limit = (value: string, max: number) => value.length > max ? value.slice(0, max).trimEnd() + "…" : value;
  return {
    title: title || fallbackTitle.trim() ? limit(title || fallbackTitle.trim(), 150) : "همراه",
    body: notice.message?.trim() ? limit(notice.message.trim(), 350) : "اعلان جدید دارید.",
  };
}
