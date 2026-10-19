import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Check,
  Clock3,
  FileText,
  CalendarDays,
  Users,
  ArrowLeft,
  FolderOpen,
} from "lucide-react";
import { useWorkspaceQuery, errorText, can, type RootState } from "../store";
import { ErrorBox, Loading, Badge, input } from "../components/ui";
import { assignedNames, assignedIds } from "../lib/types";
import { fa, iso, jalali, monthDays, months, weekdays } from "../lib/jalali";
import { toJalaali } from "jalaali-js";
export default function Dashboard() {
  const { data: w, error } = useWorkspaceQuery();
  const [projectId, setProjectId] = useState("");
  const actor = useSelector((s: RootState) => s.auth.user);
  if (error) return <ErrorBox message={errorText(error)} />;
  if (!w) return <Loading />;
  const scopeIds = new Set(
    w.users.filter((u) => u.id === actor?.id || u.assignable).map((u) => u.id),
  );
  const tasks = w.tasks.filter(
    (t) =>
      (!projectId || t.projectId === projectId) &&
      (actor?.role === "Admin" ||
        assignedIds(t).some((id) => scopeIds.has(id)) ||
        w.projects.some(
          (p) => p.id === t.projectId && p.managerId === actor?.id,
        )),
  );
  const today = iso(new Date()),
    tomorrow = iso(new Date(Date.now() + 86400000));
  const completed = tasks.filter((t) => t.status === "بسته شده");
  const overdue = tasks.filter(
    (t) => t.status !== "بسته شده" && t.due.slice(0, 10) < today,
  );
  const ongoing = tasks.filter(
    (t) => t.status !== "بسته شده" && t.due.slice(0, 10) >= today,
  );
  const groups = [
    { label: "معوق", count: overdue.length, color: "red", Icon: AlertCircle },
    {
      label: "در حال انجام",
      count: ongoing.length,
      color: "amber",
      Icon: Clock3,
    },
    {
      label: "انجام‌شده",
      count: completed.length,
      color: "green",
      Icon: Check,
    },
    { label: "کل وظایف", count: tasks.length, color: "blue", Icon: FileText },
  ];
  const units = Array.from(new Set(tasks.map((t) => t.unit || "بدون واحد")))
    .map((name) => ({
      name,
      count: tasks.filter((t) => (t.unit || "بدون واحد") === name).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const people = w.users
    .map((u) => ({
      ...u,
      done: completed.filter((t) => assignedIds(t).includes(u.id)).length,
      total: tasks.filter((t) => assignedIds(t).includes(u.id)).length,
    }))
    .filter((u) => u.total)
    .sort((a, b) => b.done - a.done)
    .slice(0, 5);
  const due = tasks.filter(
    (t) =>
      t.status !== "بسته شده" &&
      t.due.slice(0, 10) >= today &&
      t.due.slice(0, 10) <= tomorrow,
  );
  const recent = [...tasks]
    .sort((a, b) =>
      (b.createdAt || b.start).localeCompare(a.createdAt || a.start),
    )
    .slice(0, 5);
  const month = monthDays(new Date()),
    offset = (month[0].getDay() + 1) % 7,
    j = toJalaali(new Date());
  const percent = (n: number) => Math.round((n / (tasks.length || 1)) * 100);
  return (
    <div className="reference-dashboard">
      <div className="rd-welcome">
        <div>
          <h1>به سامانه مدیریت وظایف خوش آمدید</h1>
          <p>وضعیت کلی وظایف و عملکرد همکاران را در یک نگاه مشاهده کنید.</p>
        </div>
        <span>
          <CalendarDays size={18} />
          {new Date().toLocaleDateString("fa-IR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </div>
      <div className="rd-filter">
        <select
          className={input}
          aria-label="پروژه میز کار"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
        >
          <option value="">همه پروژه‌ها</option>
          {w.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {can(actor, "tasks.write") && (
          <Link
            to={"/tasks/new" + (projectId ? "?projectId=" + projectId : "")}
          >
            + ارجاع وظیفه جدید
          </Link>
        )}
      </div>
      <div className="rd-stats">
        {groups.map(({ label, count, color, Icon }) => (
          <Link to="/tasks" className={"rd-stat rd-" + color} key={label}>
            <div>
              <strong>{fa(count)}</strong>
              <h2>{label}</h2>
              <small>
                {label === "کل وظایف"
                  ? "در پروژه‌های قابل دسترسی"
                  : fa(percent(count)) + "٪ از کل وظایف"}
              </small>
            </div>
            <Icon size={40} />
          </Link>
        ))}
      </div>
      <div className="rd-layout">
        <div className="rd-primary">
          <div className="rd-charts">
            <section className="rd-panel">
              <h2>وظایف بر اساس واحد سازمانی</h2>
              <div className="rd-bars">
                {units.map((u, i) => (
                  <div key={u.name}>
                    <span>{u.name}</span>
                    <div>
                      <i
                        style={{
                          width:
                            (u.count /
                              Math.max(1, ...units.map((x) => x.count))) *
                              100 +
                            "%",
                          background: [
                            "#3184d9",
                            "#23aaa4",
                            "#f5b323",
                            "#9272d8",
                            "#49b6c8",
                            "#97a4b0",
                          ][i],
                        }}
                      />
                    </div>
                    <b>{fa(u.count)}</b>
                  </div>
                ))}
                {!units.length && (
                  <p className="rd-empty">وظیفه‌ای ثبت نشده است.</p>
                )}
              </div>
            </section>
            <section className="rd-panel">
              <h2>وضعیت وظایف</h2>
              <div className="rd-donut-row">
                <div
                  className="rd-donut"
                  role="img"
                  aria-label={`کل ${tasks.length}، انجام‌شده ${completed.length}، معوق ${overdue.length}`}
                  style={{
                    background: tasks.length
                      ? `conic-gradient(#1ca56a 0 ${percent(completed.length)}%,#ffb51b ${percent(completed.length)}% ${100 - percent(overdue.length)}%,#ed4550 ${100 - percent(overdue.length)}% 100%)`
                      : "#e5ebf2",
                  }}
                >
                  <div>
                    <strong>{fa(tasks.length)}</strong>
                    <span>کل وظایف</span>
                  </div>
                </div>
                <div className="rd-legend">
                  {groups
                    .slice(0, 3)
                    .reverse()
                    .map((g) => (
                      <p key={g.label}>
                        <i className={"rd-dot rd-" + g.color} />
                        {g.label}
                        <b>{fa(g.count)}</b>
                      </p>
                    ))}
                </div>
              </div>
            </section>
          </div>
          <section className="rd-panel">
            <h2>
              <FileText size={18} />
              آخرین وظایف ثبت‌شده
            </h2>
            <div className="rd-table-wrap">
              <table>
                <thead>
                  <tr>
                    {[
                      "شماره",
                      "عنوان وظیفه",
                      "ارجاع‌دهنده / ناظر",
                      "مسئول انجام",
                      "مهلت",
                      "وضعیت",
                    ].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((t) => (
                    <tr key={t.id}>
                      <td>{t.code}</td>
                      <td>
                        <Link to={"/tasks/" + t.id}>{t.title}</Link>
                      </td>
                      <td>
                        {w.users.find((u) => u.id === t.approverId)?.name ||
                          "—"}
                      </td>
                      <td>{assignedNames(t, w.users)}</td>
                      <td>{jalali(t.due)}</td>
                      <td>
                        <Badge status={t.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!recent.length && (
              <p className="rd-empty">هنوز وظیفه‌ای ثبت نشده است.</p>
            )}
            <Link className="rd-more" to="/tasks">
              مشاهده همه وظایف <ArrowLeft size={14} />
            </Link>
          </section>
          <div className="rd-charts">
            <section className="rd-panel">
              <h2>
                <FolderOpen size={18} />
                پروژه‌های اخیر
              </h2>
              {w.projects
                .filter((p) => !projectId || p.id === projectId)
                .slice(0, 4)
                .map((p) => (
                  <Link
                    className="rd-project"
                    key={p.id}
                    to={"/projects/" + p.id}
                  >
                    <span>
                      {p.name}
                      <small>
                        {p.company} · {p.unit}
                      </small>
                    </span>
                    <Badge status={p.status} />
                  </Link>
                ))}
              <Link className="rd-more" to="/projects">
                مشاهده همه پروژه‌ها <ArrowLeft size={14} />
              </Link>
            </section>
            <section className="rd-panel">
              <h2>
                <AlertCircle size={18} />
                وظایف دارای تأخیر
              </h2>
              {overdue.slice(0, 4).map((t) => (
                <Link className="rd-project" key={t.id} to={"/tasks/" + t.id}>
                  <span>
                    {t.title}
                    <small>{jalali(t.due)}</small>
                  </span>
                  <b className="rd-late">
                    {fa(
                      Math.ceil(
                        (+new Date(today) - +new Date(t.due.slice(0, 10))) /
                          86400000,
                      ),
                    )}{" "}
                    روز
                  </b>
                </Link>
              ))}
              {!overdue.length && (
                <p className="rd-empty">وظیفه معوقی ندارید.</p>
              )}
            </section>
          </div>
        </div>
        <aside className="rd-secondary">
          <section className="rd-panel">
            <h2>
              <CalendarDays size={18} />
              وظایف سررسید امروز و فردا
            </h2>
            {due.slice(0, 5).map((t) => (
              <Link className="rd-deadline" key={t.id} to={"/tasks/" + t.id}>
                <div>
                  <strong>{t.title}</strong>
                  <span>{t.unit}</span>
                </div>
                <div>
                  <em>{t.priority}</em>
                  <span>{jalali(t.due)}</span>
                </div>
              </Link>
            ))}
            {!due.length && (
              <p className="rd-empty">برای امروز و فردا سررسیدی ندارید.</p>
            )}
            <Link className="rd-more" to="/calendar">
              مشاهده تقویم <ArrowLeft size={14} />
            </Link>
          </section>
          <section className="rd-panel">
            <h2>
              <Users size={18} />
              عملکرد همکاران
            </h2>
            <div className="rd-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>نام و نام خانوادگی</th>
                    <th>واحد</th>
                    <th>انجام‌شده</th>
                  </tr>
                </thead>
                <tbody>
                  {people.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.unit || "—"}</td>
                      <td>{fa(u.done)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!people.length && <p className="rd-empty">تخصیصی ثبت نشده است.</p>}
          </section>
          <section className="rd-panel">
            <h2>
              <CalendarDays size={18} />
              تقویم کاری
            </h2>
            <div className="rd-month-title">
              {months[j.jm - 1]} {fa(j.jy)}
            </div>
            <div className="rd-mini-calendar">
              {weekdays.map((d) => (
                <b key={d}>{d.slice(0, 1)}</b>
              ))}
              {Array.from({ length: offset }, (_, i) => (
                <span key={"blank" + i} />
              ))}
              {month.map((d) => {
                const date = iso(d);
                const projects = w.projects.filter(
                  (p) =>
                    (!projectId || p.id === projectId) &&
                    p.start.slice(0, 10) === date,
                );
                return (
                  <Link
                    key={iso(d)}
                    className={iso(d) === today ? "is-today" : ""}
                    aria-label={`${jalali(date)}؛ ${fa(projects.length)} پروژه`}
                    title={`${jalali(date)} · ${fa(projects.length)} پروژه`}
                  to={`/projects?activeOn=${date}`}
                  >
                    {fa(toJalaali(d).jd)}
                    {!!projects.length && (
                      <i className="rd-calendar-dot" aria-hidden="true" />
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
