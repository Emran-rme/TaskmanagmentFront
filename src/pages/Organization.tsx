import DepartmentManager from "../components/DepartmentManager";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2, ChevronDown, FolderKanban, Users } from "lucide-react";
import { useWorkspaceQuery, errorText, can, RootState } from "../store";
import { useSelector } from "react-redux";
import {
  Card,
  Loading,
  ErrorBox,
  input,
  button,
  secondary,
} from "../components/ui";

export default function Organization() {
  const { data: w, error } = useWorkspaceQuery();
  const actor = useSelector((s: RootState) => s.auth.user);
  const [company, setCompany] = useState("");
  const [projectId, setProjectId] = useState("");
  const [search, setSearch] = useState("");
  if (error) return <ErrorBox message={errorText(error)} />;
  if (!w) return <Loading />;
  const units = w.organization || [];
  const projects = w.projects.filter((p) => !company || p.company === company);
  const selected = projects.find((p) => p.id === projectId) || projects[0];
  const members = w.users.filter(
    (u) =>
      (!company || u.companies?.includes(company)) && u.name.includes(search),
  );
  function nodes(parent?: string | null) {
    return units
      .filter((u) => (u.parentId || null) === (parent || null))
      .map((u) => (
        <details
          key={u.id}
          open
          className="mr-2 border-r border-sky-200 pr-3 dark:border-slate-700"
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl py-2 text-sm">
            <ChevronDown size={14} />
            <Building2 size={17} className="text-brand" />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (w?.companies.includes(u.name)) {
                  setCompany(u.name);
                  setProjectId("");
                }
              }}
              className={
                "rounded-lg px-2 py-1 text-right " +
                (company === u.name
                  ? "bg-brand text-white"
                  : "hover:bg-sky-100 dark:hover:bg-slate-700")
              }
            >
              {u.name}
              <span className="mr-2 text-[10px] opacity-70">{u.type}</span>
            </button>
          </summary>
          {nodes(u.id)}
        </details>
      ));
  }
  return (
    <div dir="rtl" className="space-y-6">
      <DepartmentManager workspace={w} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">
            هولدینگ و شرکت‌های تابعه
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            شرکت را از درخت انتخاب کنید؛ سپس پروژه و مسئول انجام وظیفه را مشخص
            کنید.
          </p>
        </div>
        {actor?.role === "Admin" && (
          <Link to="/master" className={secondary}>
            تعریف شرکت، پرسنل و نقش
          </Link>
        )}
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-[320px_1fr]">
        <Card title="ساختار سازمانی مجاز">
          <button
            className={secondary + " mb-4 w-full"}
            onClick={() => {
              setCompany("");
              setProjectId("");
            }}
          >
            همه شرکت‌های مجاز
          </button>
          {nodes()}
          {!units.length && (
            <p className="text-sm text-slate-500">
              ابتدا ساختار هولدینگ و شرکت‌ها را در اطلاعات پایه تعریف کنید.
            </p>
          )}
        </Card>
        <div className="space-y-5">
          <Card title={company || "پروژه‌های شرکت‌های مجاز"}>
            <div className="flex flex-wrap gap-3">
              <select
                aria-label="انتخاب پروژه"
                className={input + " flex-1"}
                value={selected?.id || ""}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">انتخاب پروژه</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.company} / {p.name}
                  </option>
                ))}
              </select>
              {can(actor, "projects.write") && (
                <Link className={secondary} to="/projects">
                  تعریف پروژه
                </Link>
              )}
              {selected && (
                <Link className={secondary} to={"/projects/" + selected.id}>
                  <FolderKanban size={16} />
                  فضای پروژه
                </Link>
              )}
            </div>
          </Card>
          <Card title="اعضای شرکت و تخصیص وظیفه">
            <input
              className={input + " mb-4"}
              placeholder="جستجوی نام عضو…"
              aria-label="جستجوی اعضا"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="space-y-3">
              {members.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-white/50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <div className="flex items-center gap-3">
                    <Users size={20} className="text-brand" />
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {[
                          u.position || "سمت ثبت نشده",
                          u.unit,
                          u.companies?.join("، "),
                          u.roleNames?.join("، "),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                  {selected &&
                    u.companies?.includes(selected.company) &&
                    can(actor, "tasks.write", selected.company) &&
                    (["Admin", "Manager"].includes(actor?.role || "") ||
                      actor?.id === u.id) && (
                      <Link
                        className={button}
                        to={
                          "/tasks/new?projectId=" +
                          selected.id +
                          "&assigneeId=" +
                          u.id
                        }
                      >
                        تخصیص وظیفه
                      </Link>
                    )}
                </div>
              ))}
            </div>
            {!members.length && (
              <p className="text-sm text-slate-500">
                عضوی یافت نشد. در اطلاعات پایه، پرونده فعال پرسنلی را به شرکت و
                حساب کاربری متصل کنید.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
