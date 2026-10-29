import TaskTree from "../components/TaskTree";
import TaskWorkflowPanel from "../components/TaskWorkflowPanel";
import PersonPicker from "../components/PersonPicker";
import TaskActivity, { activityDate } from "../components/TaskActivity";
import DeleteButton from "../components/DeleteButton";
import Modal from "../components/Modal";
import Tasks from "./Tasks";
import { useTaskReturnPath } from "../lib/taskNavigation";
import { useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  UserRound,
  FolderKanban,
  CalendarDays,
  Circle,
  CircleCheck,
  Clock3,
  Pencil,
  Users,
  Mail,
} from "lucide-react";
import {
  RootState,
  useDetailQuery,
  useTaskFlowQuery,
  useWorkspaceQuery,
  useMutateMutation,
  errorText,
  canEditTask,
  canCloseTask,
} from "../store";
import {
  Card,
  Field,
  input,
  button,
  secondary,
  Progress,
  Loading,
  ErrorBox,
} from "../components/ui";
import JalaliDatePicker from "../components/JalaliDatePicker";
import { jalali, iso, parse, fa } from "../lib/jalali";
import { Task, assignedIds, statuses } from "../lib/types";
export default function TaskDetail() {
  const { id = "" } = useParams();
  const { data: d, error: detailError } = useDetailQuery(id);
  const { data: taskFlow } = useTaskFlowQuery(id);
  const { data: w } = useWorkspaceQuery();
  const [mutate, { isLoading }] = useMutateMutation();
  const [tab, T] = useState("progress");
  const [error, E] = useState("");
  const [success, S] = useState("");
  const [operationsOpen, setOperationsOpen] = useState(false);
  const operationsRef = useRef<HTMLDivElement>(null);
  const { user } = useSelector((s: RootState) => s.auth);
  const navigate = useNavigate();
  const returnTo = useTaskReturnPath();
  if (detailError) return <ErrorBox message={errorText(detailError)} />;
  if (!d || !w) return <Loading />;
  const task = d.task as Task;
  const project = w.projects.find((project) => project.id === task.projectId);
  const canParticipate = canEditTask(user, task, w);
  const editable = canParticipate && task.status !== "بسته شده";
  const reviewer = canCloseTask(user, task, w);
  const managed = taskFlow?.enabled && taskFlow.status === "Waiting";
  const workStage = !managed || taskFlow.stage === "work";
  const reviewStage = managed && taskFlow.stage === "approval";
  const operationAllowed = tab === "progress" ? workStage : tab === "delivery" ? workStage || reviewStage && reviewer : true;
  async function send(url: string, body: unknown, method = "POST") {
    E("");
    S("");
    try {
      await mutate({ url, body, method }).unwrap();
      S("اطلاعات با موفقیت ثبت شد.");
      return true;
    } catch (error) {
      E(errorText(error));
      return false;
    }
  }
  const personChip = (id: number) => (
    <span className="person-chip" key={id}>
      <UserRound size={17} />
      {w.users.find((person) => person.id === id)?.name || "کاربر ثبت‌شده"}
    </span>
  );
  return (
    <>
      <Tasks />
      <Modal
        title="جزئیات وظیفه"
        className="task-detail-dialog"
        onClose={() => navigate(returnTo)}
      >
        <div className="task-detail-columns">
          <section className="task-detail-main" aria-label="جزئیات وظیفه">
            <TaskWorkflowPanel task={task} reviewer={reviewer}/>
            <div className="task-title-row">
              <h1>{task.title}</h1>
              <div className="flex">
                {editable && (
                  <Link
                    className="project-icon-action"
                    title="ویرایش وظیفه"
                    aria-label="ویرایش وظیفه"
                    to={`/tasks/${task.id}/edit`}
                  >
                    <Pencil size={16} />
                  </Link>
                )}
                <DeleteButton
                  iconOnly
                  entity="tasks"
                  id={task.id}
                  label={task.title}
                  ownerId={
                    assignedIds(task).includes(user?.id || 0)
                      ? user?.id
                      : task.assigneeId
                  }
                  onDeleted={() => navigate(returnTo)}
                />
              </div>
            </div>
            <span className="task-code" dir="ltr">
              #{task.code}
            </span>
            <div className="task-status-options" aria-label="وضعیت وظیفه">
              {statuses.map((status, index) => {
                const Icon = [Circle, Clock3, CircleCheck, CircleCheck][index];
                return (
                  <button
                    type="button"
                    key={status}
                    aria-pressed={task.status === status}
                    disabled={
                      !editable ||
                      isLoading ||
                      (managed && (status === "بسته شده" ? !reviewStage : !workStage)) ||
                      (status === "بسته شده" && !reviewer)
                    }
                    onClick={() => {
                      if (status === task.status) return;
                      if (status === "بسته شده" || managed && status === "حل شده") {
                        T("delivery");
                        setOperationsOpen(true);
                        E(
                          "خروجی نهایی را بررسی و گزینه تأیید تحویل را انتخاب کنید.",
                        );
                        requestAnimationFrame(() =>
                          operationsRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          }),
                        );
                        return;
                      }
                      void send(`tasks/${id}/progress`, {
                        progress: Math.min(99, task.progress),
                        status,
                        action: `تغییر وضعیت به ${status}`,
                        blocked: !!task.blocker,
                        blocker: task.blocker,
                        version: task.version,
                      });
                    }}
                  >
                    <Icon size={15} />
                    {status}
                  </button>
                );
              })}
            </div>
            <div className="task-progress-summary">
              <strong>پیشرفت</strong>
              <Progress value={task.progress} />
            </div>
            <div className="task-detail-field">
              <h3>تخصیص به</h3>
              <div className="task-detail-value person-chips">
                <Users size={19} />
                {assignedIds(task).map(personChip)}
              </div>
            </div>
            <div className="task-detail-field">
              <h3>تأییدکننده</h3>
              <div className="task-detail-value">
                {task.approverId ? personChip(task.approverId) : "تعیین نشده"}
              </div>
            </div>
            <div className="task-detail-field">
              <h3>منبع درخواست</h3>
              <div className="task-detail-value">
                <Mail size={17} />
                {task.source || "ثبت نشده"}
              </div>
            </div>
            <div className="task-detail-facts">
              <div>
                <h3>
                  <FolderKanban size={16} />
                  پروژه / برد
                </h3>
                <Link
                  to={task.projectId ? `/projects/${task.projectId}` : "/tasks"}
                >
                  {project?.name || "وظیفه مستقل"}
                </Link>
              </div>
              <div>
                <h3>
                  <CalendarDays size={16} />
                  تاریخ ایجاد
                </h3>
                <span>
                  {task.createdAt ? activityDate(task.createdAt) : "ثبت نشده"}
                </span>
              </div>
              <div>
                <h3>تاریخ شروع</h3>
                <span>{jalali(task.start)}</span>
              </div>
              <div>
                <h3>مهلت انجام</h3>
                <span>{jalali(task.due)}</span>
              </div>
              <div>
                <h3>شرکت / واحد</h3>
                <span>
                  {task.company} / {task.unit}
                </span>
              </div>
              <div>
                <h3>اولویت / برآورد</h3>
                <span>
                  {task.priority} · {fa(task.estimate)} ساعت
                </span>
              </div>
            </div>
            <div className="task-detail-field">
              <h3>توضیحات</h3>
              <p className="task-description">
                {task.description || "توضیحی ثبت نشده است."}
              </p>
            </div>
            {task.expectedOutput && (
              <div className="task-detail-field">
                <h3>خروجی مورد انتظار</h3>
                <p className="task-description">{task.expectedOutput}</p>
              </div>
            )}
            {task.deliveredOutput && (
              <div className="task-detail-field">
                <h3>خروجی تحویل‌شده</h3>
                <p className="task-description">
                  {task.deliveredOutput} · کیفیت {fa(task.quality)} از ۵
                </p>
              </div>
            )}
            {task.blocker && <ErrorBox message={"مانع: " + task.blocker} />}
            {error && <ErrorBox message={error} />}
            {success && (
              <p role="status" className="text-sm text-teal-600">
                {success}
              </p>
            )}
            {editable && (
              <button
                type="button"
                className={secondary}
                aria-expanded={operationsOpen}
                onClick={() => setOperationsOpen(!operationsOpen)}
              >
                ثبت پیشرفت، تحویل و تمدید
              </button>
            )}
            <div ref={operationsRef} hidden={!operationsOpen}>
              {editable && (
                <Card>
                  <div className="mb-6 flex flex-wrap gap-2">
                    {[
                      ["progress", "ثبت پیشرفت و مانع"],
                      ["extension", "درخواست تمدید"],
                      ["delivery", "تحویل و ارزیابی"],
                      ["file", "فایل پیوست"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => T(value)}
                        className={tab === value ? button : secondary}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <form
                    key={tab + task.version}
                    className="grid gap-4 md:grid-cols-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const f = new FormData(e.currentTarget),
                        v = Object.fromEntries(f);
                      if (tab === "file") {
                        const body = new FormData();
                        body.append("file", f.get("file")!);
                        await send("tasks/" + id + "/files", body);
                      } else if (tab === "progress")
                        await send("tasks/" + id + "/progress", {
                          progress: +String(v.progress),
                          status: v.status,
                          action: v.action,
                          blocked: v.blocked === "on",
                          blocker: v.blocker || "",
                          version: task.version,
                        });
                      else if (tab === "extension") {
                        const ok = await send("tasks/" + id + "/extensions", {
                          proposedDue: v.proposedDue,
                          approverId: +String(v.approverId),
                          reason: v.reason,
                        });
                        const file = f.get("file") as File;
                        if (ok && file?.size) {
                          const body = new FormData();
                          body.append("file", file);
                          await send("tasks/" + id + "/files", body);
                        }
                      } else
                        await send("tasks/" + id + "/deliver", {
                          output: v.output,
                          quality: +String(v.quality),
                          accept: reviewStage || v.accept === "on",
                          version: task.version,
                        });
                    }}
                  >
                    {tab === "progress" ? (
                      <>
                        <Field label="درصد پیشرفت (۰ تا ۹۹)">
                          <input
                            className={input}
                            type="number"
                            name="progress"
                            min="0"
                            max="99"
                            defaultValue={Math.min(99, task.progress)}
                            required
                          />
                        </Field>
                        <Field label="وضعیت">
                          <select
                            name="status"
                            className={input}
                            defaultValue={task.status}
                          >
                            {statuses
                              .filter((s) => s !== "بسته شده")
                              .map((s) => (
                                <option key={s}>{s}</option>
                              ))}
                          </select>
                        </Field>
                        <Field label="شرح اقدام انجام‌شده">
                          <textarea
                            className={input}
                            name="action"
                            rows={3}
                            required
                          />
                        </Field>
                        <Field label="شرح مانع">
                          <textarea
                            className={input}
                            name="blocker"
                            defaultValue={task.blocker}
                            rows={3}
                          />
                        </Field>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            name="blocked"
                            type="checkbox"
                            defaultChecked={!!task.blocker}
                          />
                          وظیفه دارای مانع است
                        </label>
                      </>
                    ) : tab === "extension" ? (
                      <>
                        <Field label="مهلت پیشنهادی">
                          <JalaliDatePicker
                            required
                            name="proposedDue"
                            defaultValue={iso(
                              new Date(+parse(task.due) + 86400000 * 7),
                            )}
                          />
                        </Field>
                        <PersonPicker
                          label="تأییدکننده"
                          name="approverId"
                          users={w.users.filter((u) => user?.role === "Admin"
                            ? ["Admin", "Manager"].includes(u.role) || u.id === task.approverId
                            : u.id === task.approverId)}
                          defaultValue={task.approverId}
                        />
                        <Field label="علت تمدید">
                          <textarea
                            className={input}
                            name="reason"
                            required
                            rows={3}
                          />
                        </Field>
                        <Field label="پیوست درخواست">
                          <input className={input} name="file" type="file" />
                        </Field>
                      </>
                    ) : tab === "delivery" ? (
                      <>
                        <Field label="خروجی نهایی">
                          <textarea
                            className={input}
                            name="output"
                            required
                            defaultValue={task.deliveredOutput}
                            rows={4}
                          />
                        </Field>
                        <Field label="کیفیت خروجی">
                          <select
                            className={input}
                            name="quality"
                            defaultValue={task.quality || 4}
                          >
                            {[1, 2, 3, 4, 5].map((n) => (
                              <option key={n} value={n}>
                                {fa(n)} از ۵
                              </option>
                            ))}
                          </select>
                        </Field>
                        {reviewer && (!managed || reviewStage) && (
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" name="accept" defaultChecked={!!reviewStage} disabled={!!reviewStage}/>
                            تأیید تحویل و تکمیل وظیفه
                          </label>
                        )}
                        <p className="text-xs leading-7 text-slate-400">
                          ارسال خروجی با وضعیت «حل شده» ثبت می‌شود؛ تأییدکننده
                          مشخص‌شده آن را بررسی و با وضعیت «بسته شده» نهایی
                          می‌کند.
                        </p>
                      </>
                    ) : (
                      <Field label="انتخاب فایل (حداکثر ۲۰ مگابایت)">
                        <input
                          className={input}
                          name="file"
                          type="file"
                          required
                        />
                      </Field>
                    )}
                    <div className="md:col-span-2">
                      {!operationAllowed && <p role="status">این عملیات در مرحله فعلی گردش‌کار مجاز نیست.</p>}
                      <button disabled={isLoading || !operationAllowed} className={button}>
                        ثبت اطلاعات
                      </button>
                    </div>
                  </form>
                </Card>
              )}
            </div>
            <details className="task-extra-section">
              <summary>زیروظایف</summary>
              {task.parentTaskId && (
                <Link
                  to={`/tasks/${task.parentTaskId}`}
                  className="text-xs text-brand"
                >
                  مشاهده وظیفه والد
                </Link>
              )}
              {editable && (
                <Link
                  className={secondary + " my-3"}
                  to={`/tasks/new?projectId=${task.projectId || ""}&parentTaskId=${task.id}`}
                >
                  افزودن زیروظیفه
                </Link>
              )}
              <TaskTree
                tasks={w.tasks.filter(
                  (item) => item.projectId === task.projectId,
                )}
                users={w.users}
                parentId={task.id}
              />
              {!w.tasks.some((item) => item.parentTaskId === task.id) && (
                <p className="text-sm text-slate-500">
                  هنوز زیروظیفه‌ای ثبت نشده است.
                </p>
              )}
            </details>
            {!!d.extensions.length && (
              <details className="task-extra-section">
                <summary>درخواست‌های تمدید</summary>
                {d.extensions.map(
                  (request: {
                    id: string;
                    reason: string;
                    proposedDue: string;
                    approverId: number;
                    status: string;
                    decisionNote: string;
                  }) => (
                    <article className="activity-bubble" key={request.id}>
                      <p>
                        {request.reason} · {jalali(request.proposedDue)}
                      </p>
                      <p>
                        {
                          (
                            {
                              pending: "در انتظار بررسی",
                              approved: "تأیید شده",
                              rejected: "رد شده",
                            } as Record<string, string>
                          )[request.status]
                        }
                      </p>
                      {request.decisionNote && <p>{request.decisionNote}</p>}
                      {request.status === "pending" &&
                        reviewer &&
                        (user?.role === "Admin" ||
                          user?.id === request.approverId) && (
                          <div className="flex gap-2">
                            <button
                              className={button}
                              disabled={isLoading}
                              onClick={() =>
                                void send(`extensions/${request.id}/decide`, {
                                  accept: true,
                                  note: "تأیید تمدید مهلت",
                                })
                              }
                            >
                              تأیید
                            </button>
                            <button
                              className={secondary}
                              disabled={isLoading}
                              onClick={() =>
                                void send(`extensions/${request.id}/decide`, {
                                  accept: false,
                                  note: "عدم تأیید تمدید",
                                })
                              }
                            >
                              رد درخواست
                            </button>
                          </div>
                        )}
                    </article>
                  ),
                )}
              </details>
            )}
          </section>
          <TaskActivity
            key={task.id}
            task={task}
            users={w.users}
            reports={d.reports || []}
            history={d.history || []}
            attachments={d.attachments || []}
            writable={canParticipate}
          />
        </div>
      </Modal>
    </>
  );
}
