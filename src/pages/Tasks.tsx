import { useSelector } from "react-redux";
import { RootState, can, canEditTask } from "../store";
import TaskTree from "../components/TaskTree";
import { useProjectWorkspace } from "../lib/useProjectWorkspace";
import { useState } from "react";
import DeleteButton from "../components/DeleteButton";
import { Link, useParams } from "react-router-dom";
import { Download, Plus, Search, ArrowUpDown } from "lucide-react";
import { useWorkspaceQuery } from "../store";
import {
  Card,
  input,
  button,
  secondary,
  Badge,
  Progress,
  Loading,
} from "../components/ui";
import { jalali, fa } from "../lib/jalali";
import { Task, assignedIds, assignedNames } from "../lib/types";
export default function Tasks() {
  const { projectId } = useParams();
  const actor = useSelector((s: RootState) => s.auth.user);
  const { data: w } = useProjectWorkspace();
  const [view, setView] = useState<"tree" | "table">("tree");
  const [search, S] = useState(""),
    [status, SS] = useState(""),
    [priority, SP] = useState(""),
    [project, SPr] = useState(""),
    [user, SU] = useState(""),
    [page, P] = useState(1),
    [sort, Sort] = useState<keyof Task>("due"),
    [asc, A] = useState(true);
  if (!w) return <Loading />;
  const sortValue = (t: Task) =>
    sort === "projectId"
      ? w.projects.find((p) => p.id === t.projectId)?.name ||
        "وظیفه مستقل" ||
        ""
      : sort === "assigneeId"
        ? assignedNames(t, w.users) || ""
        : t[sort];
  const rows = w.tasks
    .filter(
      (t) =>
        (!status || t.status === status) &&
        (!priority || t.priority === priority) &&
        (!project || t.projectId === project) &&
        (!user || assignedIds(t).includes(+user)) &&
        [
          t.title,
          t.code,
          t.company,
          t.unit,
          w.projects.find((p) => p.id === t.projectId)?.name || "وظیفه مستقل",
          assignedNames(t, w.users),
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort(
      (a, b) =>
        String(sortValue(a)).localeCompare(String(sortValue(b)), "fa", {
          numeric: true,
        }) * (asc ? 1 : -1),
    );
  const pages = Math.max(1, Math.ceil(rows.length / 10)),
    current = Math.min(page, pages);
  const exportData = () =>
    rows.map((t) => ({
      کد: t.code,
      عنوان: t.title,
      پروژه:
        w.projects.find((p) => p.id === t.projectId)?.name || "وظیفه مستقل",
      مسئول: assignedNames(t, w.users),
      شرکت: t.company,
      واحد: t.unit,
      وضعیت: t.status,
      اولویت: t.priority,
      مهلت: jalali(t.due),
      پیشرفت: t.progress,
    }));
  async function download(excel: boolean) {
    const data = exportData();
    if (excel) {
      const x = await import("xlsx");
      const book = x.utils.book_new();
      x.utils.book_append_sheet(book, x.utils.json_to_sheet(data), "وظایف");
      x.writeFile(book, "TaskManagement.xlsx");
    } else {
      const safe = (v: unknown) => {
        let s = String(v ?? "");
        if (/^[=+@-]/.test(s)) s = "'" + s;
        return '"' + s.replaceAll('"', '""') + '"';
      };
      const csv =
        "\uFEFF" +
        [
          Object.keys(data[0] || { کد: "", عنوان: "" }),
          ...data.map(Object.values),
        ]
          .map((r) => r.map(safe).join(","))
          .join("\r\n");
      const url = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = "TaskManagement.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy dark:text-sky-50">
            جدول وظایف
          </h1>
          <p className="mt-2 text-xs text-slate-400">
            جست‌وجو، فیلتر و پیگیری تمام وظایف سازمان
          </p>
        </div>
        <div className="flex gap-2">
          <button className={secondary} onClick={() => download(false)}>
            <Download size={15} />
            CSV
          </button>
          <button className={secondary} onClick={() => download(true)}>
            Excel
          </button>
          {can(actor, "tasks.write") && (
            <Link
              className={button}
              to={"/tasks/new" + (projectId ? "?projectId=" + projectId : "")}
            >
              <Plus size={16} />
              وظیفه جدید
            </Link>
          )}
        </div>
      </div>
      <Card>
        <div className="grid gap-3 md:grid-cols-5">
          <div className="relative">
            <Search
              className="absolute left-3 top-3 text-slate-400"
              size={16}
            />
            <input
              className={input}
              aria-label="جست‌وجوی وظیفه"
              placeholder="عنوان، کد، مسئول…"
              value={search}
              onChange={(e) => {
                S(e.target.value);
                P(1);
              }}
            />
          </div>
          {[
            [status, SS, w.statuses, "همه وضعیت‌ها"],
            [priority, SP, w.priorities, "همه اولویت‌ها"],
            [
              project,
              SPr,
              w.projects.map((p) => [p.id, p.name]),
              "همه پروژه‌ها",
            ],
            [
              user,
              SU,
              w.users.map((u) => [String(u.id), u.name]),
              "همه مسئولان",
            ],
          ].map(([value, set, items, label]) => (
            <select
              key={label as string}
              aria-label={label as string}
              value={value as string}
              onChange={(e) => {
                (set as (v: string) => void)(e.target.value);
                P(1);
              }}
              className={input}
            >
              <option value="">{label as string}</option>
              {(items as (string | string[])[]).map((item) => (
                <option
                  value={Array.isArray(item) ? item[0] : item}
                  key={String(item)}
                >
                  {Array.isArray(item) ? item[1] : item}
                </option>
              ))}
            </select>
          ))}
        </div>
      </Card>
      <div className="flex gap-2">
        <button
          className={view === "tree" ? button : secondary}
          onClick={() => setView("tree")}
        >
          نمای درختی
        </button>
        <button
          className={view === "table" ? button : secondary}
          onClick={() => setView("table")}
        >
          جدول صفحه‌بندی‌شده
        </button>
      </div>
      {view === "tree" && (
        <Card title="ساختار درختی وظایف و زیروظایف">
          <TaskTree tasks={rows} users={w.users} />
          {!rows.length && (
            <p className="text-sm text-slate-500">وظیفه‌ای یافت نشد.</p>
          )}
        </Card>
      )}
      {view === "table" && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400">
                <tr>
                  {[
                    ["کد", "code"],
                    ["عنوان وظیفه", "title"],
                    ["پروژه", "projectId"],
                    ["مسئول", "assigneeId"],
                    ["وضعیت", "status"],
                    ["اولویت", "priority"],
                    ["مهلت", "due"],
                    ["پیشرفت", "progress"],
                  ].map(([label, key]) => (
                    <th key={key} className="p-3">
                      <button
                        className="flex items-center gap-1"
                        onClick={() => {
                          Sort(key as keyof Task);
                          A(sort === key ? !asc : true);
                        }}
                      >
                        {label}
                        <ArrowUpDown size={12} />
                      </button>
                    </th>
                  ))}
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice((current - 1) * 10, current * 10).map((t) => (
                  <tr
                    className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/70"
                    key={t.id}
                  >
                    <td className="p-3 text-slate-400" dir="ltr">
                      {t.code}
                    </td>
                    <td className="max-w-64 p-3 font-bold text-navy dark:text-sky-50">
                      <Link to={"/tasks/" + t.id}>{t.title}</Link>
                      <p className="mt-2 text-[10px] font-normal text-slate-400">
                        {t.company} · {t.unit}
                      </p>
                    </td>
                    <td className="max-w-40 p-3">
                      {w.projects.find((p) => p.id === t.projectId)?.name ||
                        "وظیفه مستقل"}
                    </td>
                    <td className="p-3">{assignedNames(t, w.users)}</td>
                    <td className="p-3">
                      <Badge status={t.status} />
                    </td>
                    <td className="p-3">{t.priority}</td>
                    <td className="p-3">{jalali(t.due)}</td>
                    <td className="min-w-28 p-3">
                      <Progress value={t.progress} />
                    </td>
                    <td>
                      <Link
                        className="text-brand dark:text-sky-300"
                        to={"/tasks/" + t.id}
                      >
                        جزئیات
                      </Link>
                      {t.status !== "بسته شده" &&
                        canEditTask(actor, t, w) && (
                          <Link
                            className={secondary + " mx-2 text-xs"}
                            to={"/tasks/" + t.id + "/edit"}
                          >
                            ویرایش
                          </Link>
                        )}
                      <DeleteButton
                        entity="tasks"
                        id={t.id}
                        label={t.title}
                        ownerId={
                          assignedIds(t).includes(actor?.id || 0)
                            ? actor?.id
                            : t.assigneeId
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <p className="p-8 text-center text-slate-400">
                وظیفه‌ای یافت نشد.
              </p>
            )}
          </div>
          <div className="mt-5 flex items-center justify-between text-xs text-slate-400">
            <span>
              {fa(rows.length)} وظیفه · صفحه {fa(current)} از {fa(pages)}
            </span>
            <div className="flex gap-2">
              <button
                className={secondary}
                disabled={current <= 1}
                onClick={() => P(current - 1)}
              >
                قبلی
              </button>
              <button
                className={secondary}
                disabled={current >= pages}
                onClick={() => P(current + 1)}
              >
                بعدی
              </button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
