import { readCoverImage } from "../lib/coverImage";
import ProjectCover from "../components/ProjectCover";
import BudgetInput from "../components/BudgetInput";
import Modal from "../components/Modal";
import PersonPicker from "../components/PersonPicker";
import OrganizationTreeSelect from "../components/OrganizationTreeSelect";
import { useSelector } from "react-redux";
import { RootState, can, canProject, canManageProject } from "../store";
import { useState, useRef, useEffect, type CSSProperties } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DeleteButton from "../components/DeleteButton";
import { Pencil, LayoutGrid, List } from "lucide-react";
import { useWorkspaceQuery, useMutateMutation, errorText } from "../store";
import {
  Card,
  Field,
  input,
  button,
  Loading,
  ErrorBox,
  Progress,
  secondary,
} from "../components/ui";
import JalaliDatePicker from "../components/JalaliDatePicker";
import { iso, jalali, fa } from "../lib/jalali";
import { defaultRequestSources } from "../lib/types";
import type { Project } from "../lib/types";
export default function Projects() {
  const [view, setView] = useState<"grid" | "list">(() => {
    try { return localStorage.getItem("tm-projects-view") === "list" ? "list" : "grid"; } catch { return "grid"; }
  });
  const [columns, setColumns] = useState(() => {
    try { const n = Number(localStorage.getItem("tm-projects-columns")); return n >= 1 && n <= 4 && Number.isInteger(n) ? n : 3; } catch { return 3; }
  });
  useEffect(() => { try { localStorage.setItem("tm-projects-view", view); localStorage.setItem("tm-projects-columns", String(columns)); } catch { /* Keep the session setting. */ } }, [view, columns]);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDate = searchParams.get("date") || iso(new Date());
  const actor = useSelector((s: RootState) => s.auth.user);
  const { data: w } = useWorkspaceQuery(),
    [mutate, { isLoading }] = useMutateMutation(),
    [editing, setEditing] = useState<Project | null>(null),
    [company, setCompany] = useState(""),
    [error, E] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const open =
    (editing !== null && !!w && canManageProject(actor, editing, w)) ||
    (can(actor, "projects.write") && searchParams.get("new") === "true");
  function closeForm() {
    setEditing(null);
    setCompany("");
    E("");
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete("new");
        next.delete("date");
        return next;
      },
      { replace: true },
    );
  }
  useEffect(() => {
    if (error) contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [error]);
  if (!w) return <Loading />;
  const organization = w.organization || [];
  const byId = new Map(organization.map((node) => [node.id, node]));
  const isCompany = (type: string) =>
    ["شرکت مادر", "شرکت تابعه"].includes(type);
  const companyIds = organization
    .filter(
      (node) =>
        isCompany(node.type) &&
        w.companies.includes(node.name) &&
        (can(actor, "projects.write", node.name) ||
          (!!editing &&
            editing.company === node.name &&
            canManageProject(actor, editing, w))),
    )
    .map((node) => node.id);
  const unitIds = organization
    .filter((candidate) => {
      if (isCompany(candidate.type) || !w.units.includes(candidate.name))
        return false;
      let node: typeof candidate | undefined = candidate;
      const seen = new Set<string>();
      while (node && !seen.has(node.id)) {
        seen.add(node.id);
        if (isCompany(node.type)) return node.name === company;
        node = node.parentId ? byId.get(node.parentId) : undefined;
      }
      return false;
    })
    .map((node) => node.id);

  return (
    <div className="projects-page space-y-5">
      <div className="flex justify-between">
        <h1 className="text-xl font-bold text-navy dark:text-sky-50">
          پروژه‌ها
        </h1>
        {can(actor, "projects.write") && (
          <button
            className={button}
            onClick={() => {
              setEditing(null);
              setCompany("");
              E("");
              setSearchParams((current) => {
                const next = new URLSearchParams(current);
                next.set("new", "true");
                return next;
              });
            }}
          >
            پروژه جدید
          </button>
        )}
      </div>
      {error && <ErrorBox message={error} />}{" "}
      {open && (
        <Modal
          title={editing ? "ویرایش پروژه" : "پروژه جدید"}
          onClose={closeForm}
          busy={isLoading}
          className="work-form-dialog project-compose"
        >
          <form
            key={editing?.id || "new"}
            className="work-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              if (!f.company || !f.unit) {
                E("شرکت و معاونت / واحد را از ساختار سازمانی انتخاب کنید.");
                return;
              }
              if (String(f.end) < String(f.start)) {
                E("تاریخ پایان پروژه باید پس از شروع یا برابر آن باشد.");
                return;
              }
              try {
                const file = f.coverImage as File;
                let coverImage = editing?.coverImage || "";
                if (file?.size) {
                  if (file.size > 2 * 1024 * 1024)
                    throw {
                      data: { message: "حداکثر حجم کاور دو مگابایت است." },
                    };
                  coverImage = await readCoverImage(file);
                }
                await mutate({
                  url: "projects" + (editing ? "/" + editing.id : ""),
                  method: editing ? "PUT" : "POST",
                  body: {
                    ...f,
                    coverImage,
                    preserveCoverImage: !!editing && !file?.size,
                    requestSources: String(f.requestSources || "")
                      .split(/\r?\n/)
                      .map((x) => x.trim())
                      .filter(Boolean),
                    managerId: +String(f.managerId),
                    supervisorId: +String(f.supervisorId),
                    requesterId: +String(f.requesterId),
                    budget: +String(f.budget),
                  },
                }).unwrap();
                closeForm();
              } catch (err) {
                E(errorText(err));
              }
            }}
          >
            <div className="work-form-content" ref={contentRef}>
              {error && <ErrorBox message={error} />}
              <p className="form-intro">
                ابتدا مشخصات پروژه و افراد مسئول را تعیین کنید. منابع درخواست و
                ظاهر پروژه در تنظیمات تکمیلی قرار دارند.
              </p>
              <fieldset className="form-section" disabled={isLoading}>
                <legend>مشخصات پروژه</legend>
                <div className="form-grid">
                  {[
                    ["نام پروژه", "name"],

                    ["حامی پروژه", "sponsor"],
                  ].map(([l, n]) => (
                    <Field label={l} key={n}>
                      <input
                        className={input}
                        name={n}
                        required={n === "name"}
                        defaultValue={String(
                          editing?.[n as keyof Project] || "",
                        )}
                      />
                    </Field>
                  ))}
                  <OrganizationTreeSelect
                    label="شرکت"
                    name="company"
                    nodes={organization}
                    allowedIds={companyIds}
                    value={company}
                    onChange={setCompany}
                  />
                  <OrganizationTreeSelect
                    key={company}
                    label="معاونت / واحد"
                    name="unit"
                    nodes={organization}
                    allowedIds={unitIds}
                    defaultValue={
                      company === editing?.company ? editing.unit : ""
                    }
                    preserveDefault={!!editing}
                    disabled={!company}
                  />
                </div>
              </fieldset>
              <fieldset className="form-section" disabled={isLoading}>
                <legend>افراد مسئول</legend>
                <div className="form-grid">
                  <PersonPicker
                    key={"manager-" + company}
                    label="مدیر پروژه"
                    name="managerId"
                    users={w.users.filter((u) =>
                      u.enabled !== false &&
                      (u.assignable !== false || u.id === editing?.managerId) &&
                      (u.projectCompanies ?? u.companies)?.includes(company),
                    )}
                    defaultValue={editing?.managerId}
                  />
                  <PersonPicker
                    label="ناظر پروژه"
                    name="supervisorId"
                    users={w.users}
                    defaultValue={editing?.supervisorId}
                  />
                  <PersonPicker
                    label="درخواست‌کننده پروژه"
                    name="requesterId"
                    users={w.users}
                    defaultValue={editing?.requesterId}
                  />
                  <p className="text-xs leading-6 text-slate-500 form-full">
                    کد پروژه پس از ثبت به‌صورت خودکار تولید می‌شود. ناظر و
                    درخواست‌کننده می‌توانند یک نفر یا دو نفر متفاوت باشند.
                  </p>
                </div>
              </fieldset>
              <fieldset className="form-section" disabled={isLoading}>
                <legend>زمان‌بندی و بودجه</legend>
                <div className="form-grid">
                  <Field label="شروع">
                    <JalaliDatePicker
                      required
                      name="start"
                      defaultValue={editing?.start || selectedDate}
                    />
                  </Field>
                  <Field label="پایان">
                    <JalaliDatePicker
                      required
                      name="end"
                      defaultValue={
                        editing?.end ||
                        searchParams.get("date") ||
                        iso(new Date(Date.now() + 90 * 86400000))
                      }
                    />
                  </Field>
                  <Field label="بودجه (ریال)">
                    <BudgetInput defaultValue={editing?.budget || 0} />
                  </Field>
                  <Field label="وضعیت">
                    <select
                      name="status"
                      className={input}
                      defaultValue={editing?.status}
                    >
                      {["فعال", "در برنامه", "متوقف", "تکمیل‌شده"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </fieldset>
              <details className="form-section form-advanced">
                <summary>
                  منابع درخواست، توضیحات و ظاهر پروژه{" "}
                  <small>تنظیمات تکمیلی</small>
                </summary>
                <div className="form-grid mt-4">
                  <div className="form-full">
                    <Field label="منابع درخواست وظایف (هر مورد در یک سطر)">
                      <textarea
                        name="requestSources"
                        className={input}
                        rows={3}
                        required
                        defaultValue={(
                          editing?.requestSources || defaultRequestSources
                        ).join("\n")}
                      />
                    </Field>
                    <p className="mt-2 text-xs text-slate-500">
                      این مقادیر در فهرست منبع درخواست هنگام تعریف وظیفه نمایش
                      داده می‌شوند.
                    </p>
                  </div>
                  <Field label="رنگ کاور">
                    <input
                      type="color"
                      name="coverColor"
                      defaultValue={editing?.coverColor || "#008beb"}
                      className={input}
                    />
                  </Field>
                  <Field label="تصویر کاور (حداکثر ۲ مگابایت)">
                    <input
                      type="file"
                      name="coverImage"
                      accept="image/png,image/jpeg,image/webp"
                      className={input}
                    />
                  </Field>
                  <div className="form-full">
                    <Field label="توضیحات پروژه">
                      <textarea
                        className={input}
                        name="description"
                        rows={3}
                        defaultValue={editing?.description}
                      />
                    </Field>
                  </div>
                </div>
              </details>
            </div>
            <div className="work-form-footer">
              <span className="form-context">
                کد پروژه خودکار ایجاد می‌شود.
              </span>
              <div>
                <button
                  type="button"
                  className={secondary}
                  disabled={isLoading}
                  onClick={closeForm}
                >
                  انصراف
                </button>
                <button disabled={isLoading} className={button}>
                  {isLoading
                    ? "در حال ذخیره…"
                    : editing
                      ? "ذخیره تغییرات"
                      : "ایجاد پروژه"}
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
      {searchParams.get("activeOn") && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-800">
          <p>پروژه‌های شروع‌شونده در {jalali(searchParams.get("activeOn")!)}</p>
          <Link className={secondary} to="/projects">
            همه پروژه‌ها
          </Link>
        </div>
      )}
      {searchParams.get("activeOn") &&
        !w.projects.some(
          (p) => p.start.slice(0, 10) === searchParams.get("activeOn")!,
        ) && <p>در این تاریخ پروژه‌ای در محدوده دسترسی شما وجود ندارد.</p>}
      <div className="projects-view-toolbar">
        <div className="projects-view-switch" role="group" aria-label="نمایش پروژه‌ها">
          <button type="button" aria-pressed={view === "grid"} onClick={() => setView("grid")}><LayoutGrid size={16} /> شبکه‌ای</button>
          <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={16} /> فهرستی</button>
        </div>
        {view === "grid" && <label className="projects-columns">تعداد ستون <select value={columns} onChange={(event) => setColumns(Number(event.target.value))} aria-label="تعداد ستون پروژه‌ها">{[1, 2, 3, 4].map(n => <option key={n} value={n}>{fa(n)}</option>)}</select></label>}
      </div>
      <div className={`projects-grid ${view === "list" ? "is-list" : "is-grid"}`} style={{ "--project-columns": columns } as CSSProperties}>
        {w.projects
          .filter(
            (p) =>
              !searchParams.get("activeOn") ||
              p.start.slice(0, 10) === searchParams.get("activeOn")!,
          )
          .map((p) => (
            <Card
              key={p.id}
              className="project-list-card"
              title={p.name}
              action={
                <div className="flex shrink-0 items-center gap-1">
                  {canManageProject(actor, p, w) && (
                    <button
                      type="button"
                      className="project-icon-action"
                      aria-label={"ویرایش پروژه " + p.name}
                      title="ویرایش پروژه"
                      onClick={() => {
                        closeForm();
                        setEditing(p);
                        setCompany(p.company);
                      }}
                    >
                      <Pencil size={15} />
                    </button>
                  )}
                  <DeleteButton
                    iconOnly
                    entity="projects"
                    id={p.id}
                    label={p.name}
                  />
                </div>
              }
            >
              <div className="project-list-cover relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-400 via-brand to-blue-700">
                <ProjectCover project={p}>
                  <svg
                    className="h-36 w-full"
                    preserveAspectRatio="none"
                    viewBox="0 0 400 140"
                    aria-hidden="true"
                  >
                    <rect
                      width="400"
                      height="140"
                      fill={p.coverColor || "#008beb"}
                    />
                    <circle
                      cx="360"
                      cy="0"
                      r="100"
                      fill="#06cce5"
                      opacity="0.4"
                    />
                    <circle
                      cx="10"
                      cy="140"
                      r="100"
                      fill="#0058ff"
                      opacity="0.5"
                    />
                  </svg>
                </ProjectCover>
                <div className="absolute inset-x-0 bottom-0 bg-slate-950/40 p-3 text-xs text-white backdrop-blur-sm">
                  {p.company}
                </div>
              </div>
              <div className="project-list-details text-xs text-slate-500 dark:text-slate-400">
                <p className="project-list-status">{p.status}</p>
                <p className="project-list-single" title={w.users.find((u) => u.id === p.managerId)?.name}>مدیر: {w.users.find((u) => u.id === p.managerId)?.name || "—"}</p>
                <p className="project-list-single" title={p.sponsor}>حامی: {p.sponsor || "—"}</p>
                <p className="project-list-description" title={[p.unit, p.description].filter(Boolean).join(" · ")}>
                  {p.unit} · {p.description}
                </p>
                <p className="project-list-single">
                  {jalali(p.start)} تا {jalali(p.end)}
                </p>
                <Progress
                  value={Math.round(
                    w.tasks
                      .filter((t) => t.projectId === p.id)
                      .reduce((s, t) => s + t.progress, 0) /
                      (w.tasks.filter((t) => t.projectId === p.id).length || 1),
                  )}
                />
                <div className="project-list-actions">
                  <Link className={secondary} to={`/projects/${p.id}`}>
                    ورود به فضای پروژه
                  </Link>
                  {can(actor, "tasks.read", p.company) &&
                    canProject(actor, "tasks.write", p.company, p.id, w) && (
                      <Link
                        className={secondary}
                        to={`/tasks/new?projectId=${p.id}`}
                      >
                        افزودن وظیفه
                      </Link>
                    )}
                </div>
                <p className="project-list-single">بودجه: {p.budget.toLocaleString("fa-IR")} ریال</p>
                <p className="project-list-count text-brand dark:text-sky-300">
                  {fa(w.tasks.filter((t) => t.projectId === p.id).length)} وظیفه
                </p>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}
