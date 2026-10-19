import { useState, useEffect, useRef } from "react";
import {
  useNavigate,
  Link,
  useSearchParams,
  useParams,
} from "react-router-dom";
import { useSelector } from "react-redux";
import {
  RootState,
  can,
  manages,
  useWorkspaceQuery,
  useMutateMutation,
  errorText,
} from "../store";
import {
  Card,
  Field,
  input,
  button,
  secondary,
  Loading,
  ErrorBox,
} from "../components/ui";
import Modal from "../components/Modal";
import DefinitionPicker from "../components/DefinitionPicker";
import PersonPicker from "../components/PersonPicker";
import MultiPersonPicker from "../components/MultiPersonPicker";
import JalaliDatePicker from "../components/JalaliDatePicker";
import Tasks from "./Tasks";
import { assignedIds, defaultRequestSources, statuses } from "../lib/types";
import { iso } from "../lib/jalali";
import { useTaskReturnPath } from "../lib/taskNavigation";
export default function TaskForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [projectId, setProjectId] = useState(params.get("projectId") || "");
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [parentTaskId, setParentTaskId] = useState(
    params.get("parentTaskId") || "",
  );
  const { data: w, error: loadError } = useWorkspaceQuery();
  const [mutate, { isLoading }] = useMutateMutation();
  const [error, setError] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [error]);
  const user = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  const returnTo = useTaskReturnPath();
  if (loadError) return <ErrorBox message={errorText(loadError)} />;
  if (!w) return <Loading />;
  const editing = id ? w.tasks.find((task) => task.id === id) : undefined;
  if (id && !editing) return <ErrorBox message="وظیفه یافت نشد." />;
  const requestedProjectId = projectId || editing?.projectId;
  const project = requestedProjectId
    ? w.projects.find(
        (p) =>
          p.id === requestedProjectId && can(user, "tasks.write", p.company),
      )
    : w.projects.find(
        (p) => p.company && p.unit && can(user, "tasks.write", p.company),
      ) || w.projects.find((p) => can(user, "tasks.write", p.company));
  const close = () => navigate(returnTo);
  if (!project && requestedProjectId)
    return <ErrorBox message="پروژه یافت نشد یا مجوز ثبت وظیفه ندارید." />;
  if (!project)
    return (
      <Card title="تعریف وظیفه">
        <p className="mb-4">برای ثبت وظیفه، ابتدا یک پروژه تعریف کنید.</p>
        <Link className={button} to="/projects?new=true">
          تعریف پروژه
        </Link>
      </Card>
    );
  const assignees = w.users.filter(
    (person) =>
      person.enabled !== false &&
      person.assignable !== false &&
      w.projectMembers?.some(
        (m) => m.projectId === project.id && m.userId === person.id,
      ) &&
      person.companies?.includes(project.company) &&
      (manages(user, project.company) ||
        (editing
          ? assignedIds(editing).includes(person.id)
          : person.id === user?.id)),
  );
  const approvers = w.users.filter(
    (person) =>
      person.enabled !== false &&
      (!editing ||
        manages(user, project.company) ||
        person.id === editing.approverId) &&
      (person.companies?.includes(project.company) ||
        person.id === project.supervisorId ||
        person.id === project.managerId),
  );
  return (
    <>
      <Tasks />
      <Modal
        title={editing ? "ویرایش وظیفه" : "ایجاد وظیفه جدید"}
        className="work-form-dialog task-compose"
        onClose={close}
        busy={isLoading}
      >
        <form
          key={editing?.id || "new"}
          className="work-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            const data = new FormData(event.currentTarget);
            const file = data.get("attachment") as File;
            if (file?.size > 20 * 1024 * 1024) {
              setError("حداکثر حجم پیوست ۲۰ مگابایت است.");
              return;
            }
            const body = Object.fromEntries(data);
            delete body.attachment;
            const assigneeIds = data.getAll("assigneeIds").map(Number);
            if (!assigneeIds.length) {
              setError("حداقل یک انجام‌دهنده انتخاب کنید.");
              return;
            }
            if (String(body.due) < String(body.start)) {
              setError("مهلت انجام باید پس از تاریخ شروع یا برابر آن باشد.");
              return;
            }
            try {
              const task = await mutate({
                url: "tasks" + (editing ? "/" + editing.id : ""),
                method: editing ? "PUT" : "POST",
                body: {
                  ...body,
                  version: editing?.version,
                  assigneeId: assigneeIds[0],
                  assigneeIds,
                  approverId: Number(body.approverId),
                  estimate: Number(body.estimate),
                  parentTaskId: body.parentTaskId || null,
                },
              }).unwrap();
              if (file?.size) {
                const upload = new FormData();
                upload.append("file", file);
                await mutate({
                  url: `tasks/${task.id}/files`,
                  body: upload,
                }).unwrap();
              }
              navigate(`/tasks/${task.id}`, { state: { returnTo } });
            } catch (err) {
              setError(errorText(err));
            }
          }}
        >
          <div className="work-form-content" ref={contentRef}>
            <p className="form-intro">
              عنوان، پروژه و افراد مسئول را مشخص کنید. موارد تکمیلی در انتهای
              فرم قرار دارند.
            </p>
            {error && <ErrorBox message={error} />}
            <fieldset disabled={isLoading} className="form-section">
              <legend>اطلاعات وظیفه</legend>
              <div className="form-grid">
                <div className="form-full">
                  <Field label="عنوان وظیفه *">
                    <input
                      className={input}
                      name="title"
                      placeholder="چه کاری باید انجام شود؟"
                      required
                      maxLength={300}
                      defaultValue={editing?.title}
                    />
                  </Field>
                </div>
                <input type="hidden" name="projectId" value={project.id} />
                <input type="hidden" name="company" value={project.company} />
                <input type="hidden" name="unit" value={project.unit} />
                {!params.get("projectId") && (
                  <Field label="پروژه *">
                    <button
                      type="button"
                      aria-label="انتخاب پروژه"
                      aria-haspopup="dialog"
                      aria-expanded={projectPickerOpen}
                      className={input + " text-right"}
                      disabled={!!editing}
                      onClick={() => setProjectPickerOpen(true)}
                    >
                      {project.name} ⌄
                    </button>
                    {projectPickerOpen && (
                      <Modal
                        title="انتخاب پروژه"
                        compact
                        onClose={() => setProjectPickerOpen(false)}
                        className="organization-tree-dialog"
                      >
                        <DefinitionPicker
                          title="پروژه"
                          selectedId={project.id}
                          items={w.projects
                            .filter((p) => can(user, "tasks.write", p.company))
                            .map((p) => ({
                              id: p.id,
                              name: p.name,
                              subtitle: [p.code, p.company, p.unit]
                                .filter(Boolean)
                                .join(" · "),
                            }))}
                          onSelect={(id) => {
                            setProjectId(String(id));
                            setParentTaskId("");
                            setProjectPickerOpen(false);
                          }}
                        />
                      </Modal>
                    )}
                  </Field>
                )}
                <Field label="منبع درخواست *">
                  <select
                    className={input}
                    key={"source-" + project.id}
                    name="source"
                    defaultValue={
                      editing?.source ||
                      (project.requestSources || defaultRequestSources)[0]
                    }
                  >
                    {Array.from(
                      new Set([
                        ...(project.requestSources || defaultRequestSources),
                        ...(editing?.source ? [editing.source] : []),
                      ]),
                    ).map((source) => (
                      <option key={source}>{source}</option>
                    ))}
                  </select>
                </Field>
                <p className="form-context form-full">
                  {project.company} / {project.unit} · منابع درخواست در تنظیمات
                  پروژه قابل تعریف‌اند.
                </p>
              </div>
            </fieldset>
            <fieldset disabled={isLoading} className="form-section">
              <legend>انجام‌دهنده و تأییدکننده</legend>
              <div className="form-grid">
                <MultiPersonPicker
                  key={"assignee-" + project.id}
                  name="assigneeIds"
                  label="تخصیص به (چند انتخابی) *"
                  users={assignees}
                  emptyMessage={
                    !project.company
                      ? "شرکت این پروژه مشخص نشده است؛ ابتدا شرکت و واحد را در ویرایش پروژه تعیین کنید."
                      : "کاربر فعالی با انتساب به شرکت این پروژه یافت نشد؛ پرونده پرسنلی و انتساب شرکت افراد را بررسی کنید."
                  }
                  defaultValue={
                    editing
                      ? assignedIds(editing)
                      : params.get("assigneeId")
                        ? [Number(params.get("assigneeId"))]
                        : assignees.length === 1
                          ? [assignees[0].id]
                          : []
                  }
                />
                <PersonPicker
                  key={"approver-" + project.id}
                  name="approverId"
                  label="تأییدکننده وظیفه *"
                  users={approvers}
                  defaultValue={
                    editing?.approverId ||
                    project.supervisorId ||
                    project.managerId
                  }
                />
                <p className="form-context form-full">
                  تأییدکننده می‌تواند ناظر پروژه باشد؛ بستن وظیفه پس از تأیید
                  خروجی انجام می‌شود.
                </p>
              </div>
            </fieldset>
            <fieldset disabled={isLoading} className="form-section">
              <legend>زمان‌بندی و اولویت</legend>
              <div className="form-grid">
                <Field label="تاریخ شروع *">
                  <JalaliDatePicker
                    name="start"
                    label="انتخاب تاریخ شروع"
                    required
                    defaultValue={
                      editing?.start || params.get("date") || iso(new Date())
                    }
                  />
                </Field>
                <Field label="مهلت انجام *">
                  <JalaliDatePicker
                    name="due"
                    label="انتخاب مهلت انجام"
                    required
                    defaultValue={
                      editing?.due ||
                      params.get("date") ||
                      iso(new Date(Date.now() + 7 * 86400000))
                    }
                  />
                </Field>
                <Field label="اولویت">
                  <select
                    className={input}
                    name="priority"
                    defaultValue={editing?.priority || "عادی"}
                  >
                    {w.priorities.map((priority) => (
                      <option key={priority}>{priority}</option>
                    ))}
                  </select>
                </Field>
                <Field label="وضعیت">
                  <select
                    className={input}
                    name="status"
                    disabled={!!editing}
                    defaultValue={editing?.status || "جدید"}
                  >
                    {statuses
                      .filter(
                        (status) =>
                          status !== "بسته شده" || editing?.status === status,
                      )
                      .map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                  </select>
                  <small className="form-context">
                    بستن وظیفه پس از تأیید خروجی انجام می‌شود.
                  </small>
                </Field>
              </div>
            </fieldset>
            <details className="form-section form-advanced">
              <summary>
                توضیحات، پیوست و تنظیمات تکمیلی <small>اختیاری</small>
              </summary>
              <div className="form-grid mt-4">
                <div className="form-full">
                  <Field label="توضیحات">
                    <textarea
                      className={input}
                      name="description"
                      rows={3}
                      placeholder="جزئیات و معیار انجام کار…"
                      defaultValue={editing?.description}
                    />
                  </Field>
                </div>
                <Field label="خروجی مورد انتظار">
                  <textarea
                    className={input}
                    name="expectedOutput"
                    rows={3}
                    defaultValue={editing?.expectedOutput}
                  />
                </Field>
                <Field label="فایل پیوست">
                  <input className={input} name="attachment" type="file" />
                  <small className="form-context">حداکثر ۲۰ مگابایت</small>
                </Field>
                <Field label="برآورد ساعت">
                  <input
                    className={input}
                    type="number"
                    name="estimate"
                    min={1}
                    max={100000}
                    defaultValue={editing?.estimate || 8}
                  />
                </Field>
                <input
                  type="hidden"
                  name="parentTaskId"
                  value={editing?.parentTaskId || parentTaskId}
                />
                <Field label="وظیفه والد (اختیاری)">
                  <select
                    className={input}
                    disabled={!!editing}
                    value={editing?.parentTaskId || parentTaskId}
                    onChange={(event) => setParentTaskId(event.target.value)}
                  >
                    <option value="">بدون والد</option>
                    {w.tasks
                      .filter(
                        (task) =>
                          task.id !== editing?.id &&
                          task.projectId === project.id &&
                          task.status !== "بسته شده" &&
                          (manages(user, task.company) ||
                            assignedIds(task).includes(user?.id || 0)),
                      )
                      .map((task) => (
                        <option key={task.id} value={task.id}>
                          {task.title}
                        </option>
                      ))}
                  </select>
                </Field>
              </div>
            </details>
          </div>
          <div className="work-form-footer">
            <span className="form-context">
              {editing ? editing.code : "کد وظیفه خودکار ایجاد می‌شود."}
            </span>
            <div>
              <button
                className={secondary}
                type="button"
                disabled={isLoading}
                onClick={close}
              >
                انصراف
              </button>
              <button className={button} disabled={isLoading}>
                {isLoading
                  ? "در حال ذخیره…"
                  : editing
                    ? "ذخیره تغییرات"
                    : "ایجاد وظیفه"}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
