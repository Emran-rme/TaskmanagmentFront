import { randomUuid } from "../lib/uuid";
import { useProjectWorkspace } from "../lib/useProjectWorkspace";
import { useRef, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import {
  useColumnsQuery,
  useMutateMutation,
  RootState,
  canEditTask,
  canManageProject,
  errorText,
} from "../store";
import { statuses, Task } from "../lib/types";
import {
  TaskCard,
  input,
  Loading,
  ErrorBox,
  button,
  secondary,
} from "../components/ui";
import Modal from "../components/Modal";
export default function Kanban() {
  const { projectId } = useParams();
  const { data: w, error: loadError } = useProjectWorkspace();
  const { data: custom = [], error: columnError } = useColumnsQuery(
    projectId || "",
    { skip: !projectId },
  );
  const [mutate, { isLoading }] = useMutateMutation();
  const [error, setError] = useState("");
  const draggedTask = useRef<string | null>(null);
  const [dropColumn, setDropColumn] = useState<string | null>(null);
  const moving = useRef(false);
  const [draft, setDraft] = useState<
    { id: string; name: string; status: string }[] | null
  >(null);
  const user = useSelector((s: RootState) => s.auth.user);
  if (loadError || columnError)
    return <ErrorBox message={errorText(loadError || columnError)} />;
  if (!w) return <Loading />;
  const project = w.projects.find((p) => p.id === projectId);
  const columns = custom.length
    ? custom
    : statuses.map((status) => ({ id: status, name: status, status }));
  const configurable =
    project && canManageProject(user, project, w);
  const columnFor = (task: Task) =>
    custom.find((c) => c.id === task.kanbanColumnId && (c.status !== "بسته شده" || task.status === "بسته شده"))?.id ||
    columns.find((c) => c.status === task.status)?.id ||
    columns[0].id;
  async function move(task: Task, columnId: string) {
    if (moving.current || columnFor(task) === columnId) return;
    if (!w || !canEditTask(user, task, w) || task.status === "بسته شده") return;
    if (columns.find(c => c.id === columnId)?.status === "بسته شده") {
      setError("بستن وظیفه فقط از مسیر تحویل و تأیید مالک/تأییدکننده انجام می‌شود.");
      return;
    }
    moving.current = true;
    try {
      setError("");
      if (custom.length) {
        await mutate({
          url: "tasks/" + task.id + "/column",
          method: "PUT",
          body: { columnId, version: task.version },
        }).unwrap();
      } else {
        if (columnId === task.status) return;
        if (columnId === "بسته شده")
          throw new Error(
            "برای تکمیل وظیفه، تحویل و ارزیابی را در جزئیات ثبت کنید.",
          );
        await mutate({
          url: "tasks/" + task.id + "/progress",
          body: {
            progress: Math.min(task.progress, 99),
            status: columnId,
            action: "انتقال در برد کانبان",
            blocked: !!task.blocker,
            blocker: task.blocker,
            version: task.version,
          },
        }).unwrap();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : errorText(e));
    } finally {
      moving.current = false;
    }
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <h1 className="text-xl font-bold">برد کانبان</h1>
        {configurable && (
          <button
            className={secondary}
            onClick={() =>
              setDraft(
                columns.map((c) => ({
                  ...c,
                  id: custom.length ? c.id : randomUuid(),
                })),
              )
            }
          >
            تنظیم لیست‌های پروژه
          </button>
        )}
      </div>
      {error && <ErrorBox message={error} />}
      {draft && (
        <Modal title="تنظیم لیست‌های پروژه" onClose={() => setDraft(null)} busy={isLoading}>
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await mutate({
                  url: "projects/" + projectId + "/columns",
                  method: "PUT",
                  body: draft,
                }).unwrap();
                setDraft(null);
                setError("");
              } catch (err) {
                setError(errorText(err));
              }
            }}
          >
            <div className="flex flex-wrap gap-2">
              {[
                ["ساده", ["برای انجام", "در حال انجام", "انجام شده"]],
                [
                  "توسعه نرم‌افزار",
                  [
                    "بک‌لاگ",
                    "آماده توسعه",
                    "توسعه",
                    "بازبینی",
                    "تست",
                    "انتشار",
                  ],
                ],
              ].map(([label, names]) => (
                <button
                  type="button"
                  key={String(label)}
                  className={secondary}
                  disabled={custom.length > 0}
                  onClick={() =>
                    setDraft(
                      (names as string[]).map((name, i) => ({
                        id: randomUuid(),
                        name,
                        status: statuses[Math.min(i, statuses.length - 1)],
                      })),
                    )
                  }
                >
                  {String(label)}
                </button>
              ))}
            </div>
            {draft.map((c, i) => (
              <div key={c.id} className="grid grid-cols-2 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
                <input
                  required
                  maxLength={100}
                  aria-label="نام لیست کانبان"
                  className={input}
                  value={c.name}
                  onChange={(e) =>
                    setDraft(
                      draft.map((x, j) =>
                        j === i ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                />
                <select
                  aria-label="وضعیت پیش‌فرض لیست"
                  className={input}
                  value={c.status}
                  onChange={(e) =>
                    setDraft(
                      draft.map((x, j) =>
                        j === i ? { ...x, status: e.target.value } : x,
                      ),
                    )
                  }
                >
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className={secondary}
                  disabled={i === 0}
                  onClick={() => {
                    const next = [...draft];
                    [next[i - 1], next[i]] = [next[i], next[i - 1]];
                    setDraft(next);
                  }}
                >
                  بالاتر
                </button>
                <button
                  type="button"
                  className={secondary}
                  onClick={() => setDraft(draft.filter((_, j) => j !== i))}
                >
                  حذف لیست
                </button>
              </div>
            ))}
            <button
              type="button"
              className={secondary}
              onClick={() =>
                setDraft([
                  ...draft,
                  {
                    id: randomUuid(),
                    name: "لیست جدید",
                    status: statuses[0],
                  },
                ])
              }
            >
              افزودن لیست
            </button>{" "}
            <button className={button} disabled={isLoading}>
              ذخیره لیست‌ها
            </button>{" "}
            <button
              type="button"
              className={secondary}
              onClick={() => setDraft(null)}
            >
              بستن
            </button>
          </form>
        </Modal>
      )}
      <p className="text-xs">
        کارت‌ها را بکشید یا لیست کارت را انتخاب کنید. تکمیل رسمی وظیفه از مسیر
        تحویل و ارزیابی انجام می‌شود.
      </p>
      <div className="flex min-w-0 items-start gap-4 overflow-x-auto pb-4" aria-label="ستون‌های کانبان">
        {columns.map((column) => (
          <section
            key={column.id}
            aria-label={"ستون " + column.name}
            className={"flex min-h-80 w-72 shrink-0 flex-col rounded-2xl border bg-slate-100/70 p-3 dark:bg-slate-800" + (dropColumn === column.id ? " ring-2 ring-brand" : "")}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDropColumn(column.id);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropColumn(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const taskId = draggedTask.current || e.dataTransfer.getData("text/plain");
              draggedTask.current = null;
              setDropColumn(null);
              const task = w.tasks.find(
                (t) => t.id === taskId,
              );
              if (task && task.status !== "بسته شده" && canEditTask(user, task, w))
                void move(task, column.id);
            }}
          >
            <h2 className="mb-4 flex shrink-0 justify-between text-sm font-bold">
              {column.name}
              <span>
                {w.tasks.filter((t) => columnFor(t) === column.id).length}
              </span>
            </h2>
            <div className="min-h-56 flex-1 space-y-3 pb-3" aria-label={"کارت‌های " + column.name}>
              {!w.tasks.some((t) => columnFor(t) === column.id) && (
                <p className="pointer-events-none rounded border border-dashed p-6 text-center text-sm">کارت را اینجا رها کنید</p>
              )}
              {w.tasks
                .filter((t) => columnFor(t) === column.id)
                .map((task) => (
                  <div
                    key={task.id}
                    draggable={
                      canEditTask(user, task, w) &&
                      task.status !== "بسته شده"
                    }
                    className="cursor-grab active:cursor-grabbing"
                    onDragStart={(e) => {
                      draggedTask.current = task.id;
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", task.id);
                    }}
                    onDragEnd={() => {
                      draggedTask.current = null;
                      setDropColumn(null);
                    }}
                  >
                    <TaskCard task={task} draggable={false} />
                    {canEditTask(user, task, w) &&
                      task.status !== "بسته شده" && (
                        <select
                          aria-label={"لیست " + task.code}
                          className={input + " mt-1 text-xs"}
                          value={columnFor(task)}
                          disabled={isLoading}
                          onChange={(e) => void move(task, e.target.value)}
                        >
                          {columns.map((c) => (
                            <option key={c.id} value={c.id} disabled={c.status === "بسته شده"}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      )}
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

