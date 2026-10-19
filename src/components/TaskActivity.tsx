import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  Download,
  MoreHorizontal,
  Paperclip,
  Send,
  Smile,
  UserRound,
  X,
} from "lucide-react";
import { RootState, can, errorText, useMutateMutation } from "../store";
import {
  assignedIds,
  Task,
  TaskAttachment,
  TaskHistory,
  TaskReport,
  User,
} from "../lib/types";
import { fa, jalali } from "../lib/jalali";
import { button, secondary, input, ErrorBox } from "./ui";
import PersonPicker from "./PersonPicker";
import DeleteButton from "./DeleteButton";

export const activityDate = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(/(?:Z|[+-]\d\d:\d\d)$/.test(value) ? value : value + "Z"));

function ChangeDetails({
  history,
  users,
}: {
  history: TaskHistory;
  users: User[];
}) {
  let changes: Record<string, { before: unknown; after: unknown }> = {};
  try {
    changes = JSON.parse(history.changesJson || "{}");
  } catch {
    /* Older history may not contain structured changes. */
  }
  const names: Record<string, string> = {
    Title: "عنوان",
    AssigneeId: "انجام‌دهنده اصلی",
    AssigneeIds: "انجام‌دهندگان",
    ApproverId: "تأییدکننده",
    Start: "شروع",
    Due: "مهلت",
    Source: "منبع درخواست",
    Priority: "اولویت",
    Status: "وضعیت",
    Progress: "پیشرفت",
    Quality: "کیفیت",
    Blocker: "مانع",
    Description: "توضیحات",
    ExpectedOutput: "خروجی مورد انتظار",
    DeliveredOutput: "خروجی تحویل‌شده",
  };
  const show = (field: string, value: unknown): string => {
    if (value == null) return "—";
    if (field === "AssigneeIds" && Array.isArray(value))
      return value
        .map((id) => users.find((user) => user.id === id)?.name || String(id))
        .join("، ");
    if (["AssigneeId", "ApproverId"].includes(field))
      return users.find((user) => user.id === value)?.name || String(value);
    if (["Start", "Due"].includes(field)) return jalali(String(value));
    return String(value);
  };
  return (
    <>
      {history.previousStatus && history.previousStatus !== history.status && (
        <p className="activity-meta">
          وضعیت: {history.previousStatus} ← {history.status}
        </p>
      )}
      {history.previousProgress != null &&
        history.previousProgress !== history.progress && (
          <p className="activity-meta">
            پیشرفت: {fa(history.previousProgress)}٪ ← {fa(history.progress)}٪
          </p>
        )}
      {!!Object.keys(changes).length && (
        <details className="activity-changes">
          <summary>جزئیات تغییرات</summary>
          {Object.entries(changes).map(([field, change]) => (
            <p key={field}>
              {names[field] || field}: {show(field, change.before)} ←{" "}
              {show(field, change.after)}
            </p>
          ))}
        </details>
      )}
    </>
  );
}

export default function TaskActivity({
  task,
  users,
  reports,
  history,
  attachments,
  writable,
}: {
  task: Task;
  users: User[];
  reports: TaskReport[];
  history: TaskHistory[];
  attachments: TaskAttachment[];
  writable: boolean;
}) {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const [mutate, { isLoading }] = useMutateMutation();
  const [text, setText] = useState("");
  const [mentions, setMentions] = useState<number[]>([]);
  const [file, setFile] = useState<File>();
  const [pendingReport, setPendingReport] = useState<string>();
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const feed = useRef<HTMLDivElement>(null);
  const entries = [
    ...history.map((item) => ({
      kind: "history" as const,
      item,
      at: item.createdAt,
      actor: item.actorId,
    })),
    ...reports.map((item) => ({
      kind: "report" as const,
      item,
      at: item.createdAt,
      actor: item.authorId,
    })),
    ...attachments
      .filter((item) => !item.reportId)
      .map((item) => ({
        kind: "file" as const,
        item,
        at: item.createdAt,
        actor: item.uploadedBy,
      })),
  ].sort((a, b) => b.at.localeCompare(a.at));
  const ownerId = assignedIds(task).includes(user?.id || 0)
    ? user?.id
    : task.assigneeId;
  async function download(file: TaskAttachment) {
    setError("");
    try {
      const response = await fetch("/api/files/" + file.id, {
        headers: { authorization: "Bearer " + token },
      });
      if (!response.ok) throw new Error("دریافت فایل ناموفق بود.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setError(errorText(error));
    }
  }
  function fileLink(file: TaskAttachment) {
    return (
      <button
        type="button"
        key={file.id}
        className="activity-file"
        onClick={() => void download(file)}
      >
        <Paperclip size={14} />
        <span>{file.name}</span>
        <small>{fa(Math.ceil(file.size / 1024))} KB</small>
        <Download size={13} />
      </button>
    );
  }
  return (
    <section className="task-activity" aria-label="لاگ فعالیت‌ها">
      <header className="task-panel-heading">
        <h2>لاگ فعالیت‌ها</h2>
        <span>{fa(entries.length)} فعالیت</span>
      </header>
      <div className="task-activity-feed" ref={feed} aria-live="polite">
        {entries.map((entry) => (
          <article className="activity-entry" key={entry.kind + entry.item.id}>
            <div className="activity-avatar">
              <UserRound size={20} />
            </div>
            <div className="activity-entry-body">
              <div className="activity-author">
                <strong>
                  {users.find((user) => user.id === entry.actor)?.name ||
                    (entry.actor === 0 ? "سیستم" : "کاربر ثبت‌شده")}
                </strong>
                {can(
                  user,
                  entry.kind === "report"
                    ? "reports.delete"
                    : entry.kind === "file"
                      ? "files.delete"
                      : "history.delete",
                ) && (
                  <details className="activity-menu">
                    <summary aria-label="عملیات فعالیت">
                      <MoreHorizontal size={17} />
                    </summary>
                    <DeleteButton
                      iconOnly
                      entity={
                        entry.kind === "report"
                          ? "reports"
                          : entry.kind === "file"
                            ? "files"
                            : "history"
                      }
                      id={entry.item.id}
                      label={
                        entry.kind === "report"
                          ? "نظر"
                          : entry.kind === "file"
                            ? entry.item.name
                            : entry.item.action
                      }
                      ownerId={ownerId}
                    />
                  </details>
                )}
              </div>
              <time dateTime={entry.at} className="activity-meta">
                {activityDate(entry.at)}
              </time>
              <div className="activity-bubble">
                {entry.kind === "history" ? (
                  <>
                    <p>{entry.item.action}</p>
                    <ChangeDetails history={entry.item} users={users} />
                  </>
                ) : entry.kind === "report" ? (
                  <>
                    <p>{entry.item.text}</p>
                    {attachments
                      .filter((file) => file.reportId === entry.item.id)
                      .map(fileLink)}
                  </>
                ) : (
                  fileLink(entry.item)
                )}
              </div>
            </div>
          </article>
        ))}
        {!entries.length && (
          <p className="p-5 text-sm text-slate-500">
            هنوز فعالیتی ثبت نشده است.
          </p>
        )}
      </div>
      {writable && (
        <form
          className="activity-composer"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            if (file && (file.size === 0 || file.size > 20 * 1024 * 1024)) {
              setError("حجم فایل باید بین ۱ بایت و ۲۰ مگابایت باشد.");
              return;
            }
            try {
              let reportId = pendingReport;
              if (!reportId) {
                const saved = await mutate({
                  url: `tasks/${task.id}/reports`,
                  body: { text, mentionIds: mentions },
                }).unwrap();
                reportId = saved.id;
                setPendingReport(reportId);
              }
              if (file) {
                const body = new FormData();
                body.append("file", file);
                body.append("reportId", reportId!);
                await mutate({ url: `tasks/${task.id}/files`, body }).unwrap();
              }
              setText("");
              setMentions([]);
              setFile(undefined);
              setPendingReport(undefined);
              if (fileInput.current) fileInput.current.value = "";
              feed.current?.scrollTo({ top: 0, behavior: "smooth" });
            } catch (error) {
              setError(errorText(error));
            }
          }}
        >
          {error && <ErrorBox message={error} />}
          {pendingReport && (
            <p role="status" className="text-xs text-amber-600">
              نظر ثبت شد؛ پیوست هنوز ارسال نشده است. ارسال مجدد، نظر تکراری
              نمی‌سازد.
            </p>
          )}
          <label className="text-sm font-semibold" htmlFor="activity-comment">
            نظر خود را بنویسید…
          </label>
          <textarea
            id="activity-comment"
            className={input}
            rows={3}
            maxLength={10000}
            required
            disabled={isLoading || !!pendingReport}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="اینجا نظر خود را وارد کنید…"
          />
          <details className="activity-mentions">
            <summary>
              منشن اعضا {mentions.length ? `(${fa(mentions.length)})` : ""}
            </summary>
            <PersonPicker
              key={mentions.join(",")}
              label="انتخاب عضو برای منشن"
              name="mentionSearch"
              required={false}
              users={users.filter(
                (user) => user.enabled !== false && !mentions.includes(user.id),
              )}
              onChange={(id) => {
                const person = users.find((user) => user.id === id);
                if (person) {
                  setMentions([...mentions, id]);
                  setText(text + " @" + person.name + " ");
                }
              }}
            />
          </details>
          {file && (
            <div className="activity-file">
              <Paperclip size={13} />
              {file.name}
              <button
                type="button"
                aria-label="حذف فایل انتخابی"
                disabled={isLoading}
                onClick={() => {
                  setFile(undefined);
                  if (fileInput.current) fileInput.current.value = "";
                }}
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="activity-compose-actions">
            <div className="flex gap-2">
              <button
                type="button"
                className={secondary}
                disabled={isLoading}
                onClick={() => fileInput.current?.click()}
              >
                <Paperclip size={15} />
                ضمیمه فایل
              </button>
              <button
                type="button"
                className={secondary}
                aria-label="افزودن شکلک"
                aria-expanded={emojiOpen}
                disabled={isLoading || !!pendingReport}
                onClick={() => setEmojiOpen(!emojiOpen)}
              >
                <Smile size={17} />
              </button>
            </div>
            <input
              ref={fileInput}
              type="file"
              className="sr-only"
              aria-label="پیوست نظر"
              disabled={isLoading}
              onChange={(event) => setFile(event.target.files?.[0])}
            />
            <button className={button} disabled={isLoading}>
              <Send size={14} />
              {isLoading
                ? "در حال ارسال…"
                : pendingReport
                  ? "ارسال پیوست"
                  : "ارسال"}
            </button>
          </div>
          {emojiOpen && (
            <div className="flex gap-2" aria-label="شکلک‌ها">
              {["👍", "✅", "🙏", "📌", "🙂"].map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  aria-label={"درج " + emoji}
                  onClick={() => {
                    setText(text + emoji);
                    setEmojiOpen(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
          <small className="form-context">حداکثر حجم پیوست: ۲۰ مگابایت</small>
        </form>
      )}
      {!writable && error && <ErrorBox message={error} />}
    </section>
  );
}
