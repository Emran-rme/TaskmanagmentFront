import { useProjectWorkspace } from "../lib/useProjectWorkspace";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState, can } from "../store";
import { useState, useEffect } from "react";
import { toJalaali } from "jalaali-js";
import Modal from "../components/Modal";
import {
  Card,
  TaskCard,
  secondary,
  button,
  Loading,
  ErrorBox,
} from "../components/ui";
import {
  monthDays,
  shiftMonth,
  months,
  weekdays,
  iso,
  fa,
  jalali,
  parse,
} from "../lib/jalali";
function calendarDate(value: string | null, fallback: Date) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  const date = parse(value);
  return Number.isFinite(+date) &&
    date.getFullYear() >= 1000 &&
    date.getFullYear() <= 3000
    ? date
    : fallback;
}
export default function Calendar() {
  const actor = useSelector((s: RootState) => s.auth.user);
  const { projectId } = useParams();
  const [params, setParams] = useSearchParams();
  const initialDate = calendarDate(params.get("date"), new Date());
  const [creating, setCreating] = useState("");
  const { data: w, error } = useProjectWorkspace();
  const [cursor, setCursor] = useState(initialDate);
  const [selected, setSelected] = useState(
    iso(calendarDate(params.get("selected"), initialDate)),
  );
  const [view, setView] = useState(
    ["day", "week", "month"].includes(params.get("view") || "")
      ? params.get("view")!
      : "month",
  );
  useEffect(() => {
    if (
      params.get("date") === iso(cursor) &&
      params.get("view") === view &&
      params.get("selected") === selected
    )
      return;
    const next = new URLSearchParams(params);
    next.set("date", iso(cursor));
    next.set("view", view);
    next.set("selected", selected);
    setParams(next, { replace: true });
  }, [cursor, view, selected, params, setParams]);
  if (error) return <ErrorBox message="دریافت تقویم ناموفق بود." />;
  if (!w) return <Loading />;
  const project = w.projects.find((p) => p.id === projectId);
  const taskAllowed = can(actor, "tasks.write", project?.company);
  const projectAllowed = !projectId && can(actor, "projects.write");
  const j = toJalaali(cursor);
  const month = monthDays(cursor);
  const offset = (month[0].getDay() + 1) % 7;
  const start = parse(iso(cursor));
  start.setDate(start.getDate() - ((start.getDay() + 1) % 7));
  const days: (Date | null)[] =
    view === "month"
      ? Array.from(
          { length: Math.ceil((offset + month.length) / 7) * 7 },
          (_, i) => month[i - offset] || null,
        )
      : view === "day"
        ? [cursor]
        : Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(d.getDate() + i);
            return d;
          });
  function shift(n: number) {
    const d = view === "month" ? shiftMonth(cursor, n) : new Date(cursor);
    if (view !== "month")
      d.setDate(d.getDate() + n * (view === "week" ? 7 : 1));
    setCursor(d);
    setSelected(iso(d));
  }
  const tasksOn = (date: string) =>
    w!.tasks.filter(
      (t) => t.start.slice(0, 10) <= date && t.due.slice(0, 10) >= date,
    );
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">تقویم شمسی وظایف</h1>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="نمای تقویم"
      >
        {[
          ["day", "روزانه"],
          ["week", "هفتگی"],
          ["month", "ماهانه"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={view === key ? button : secondary}
            aria-pressed={view === key}
            onClick={() => setView(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {creating && (
        <Modal
          compact
          title={"ایجاد در تاریخ " + jalali(creating)}
          onClose={() => setCreating("")}
        >
          <div className="flex flex-wrap gap-3">
            {projectAllowed && (
              <Link
                className={button}
                to={"/projects?new=true&date=" + creating}
              >
                تعریف پروژه
              </Link>
            )}
            {taskAllowed && (
              <Link
                className={button}
                to={
                  "/tasks/new?date=" +
                  creating +
                  (projectId ? "&projectId=" + projectId : "")
                }
              >
                تعریف وظیفه / زیروظیفه
              </Link>
            )}
            <button className={secondary} onClick={() => setCreating("")}>
              بستن
            </button>
          </div>
        </Modal>
      )}
      <div className="grid gap-5 xl:grid-cols-4">
        <Card
          className="xl:col-span-3"
          title={
            view === "day"
              ? jalali(iso(cursor))
              : months[j.jm - 1] + " " + fa(j.jy)
          }
          action={
            <div className="flex flex-wrap gap-2">
              <button className={secondary} onClick={() => shift(-1)}>
                قبل
              </button>
              <button
                className={secondary}
                onClick={() => {
                  setCursor(new Date());
                  setSelected(iso(new Date()));
                }}
              >
                امروز
              </button>
              <button className={secondary} onClick={() => shift(1)}>
                بعد
              </button>
            </div>
          }
        >
          <div
            className={view === "day" ? "grid grid-cols-1" : "grid grid-cols-7"}
          >
            {view !== "day" &&
              weekdays.map((day) => (
                <div className="p-2 text-center text-xs" key={day}>
                  {day}
                </div>
              ))}
            {days.map((d, i) => {
              if (!d)
                return (
                  <div
                    key={i}
                    className="min-h-24 border border-slate-100 dark:border-slate-700"
                  />
                );
              const date = iso(d),
                tasks = tasksOn(date);
              return (
                <div
                  key={date}
                  className={
                    "relative min-h-32 min-w-0 border p-1 transition-colors hover:bg-violet-50 dark:hover:bg-slate-800 sm:p-2 " +
                    (date === selected
                      ? "border-brand bg-sky-50 dark:bg-sky-950"
                      : "border-slate-100 dark:border-slate-700")
                  }
                >
                  <button
                    className="absolute inset-0 h-full w-full rounded p-2 text-right focus-visible:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
                    aria-label={"انتخاب روز " + jalali(date)}
                    onClick={() => {
                      setSelected(date);
                      if (taskAllowed || projectAllowed) setCreating(date);
                    }}
                  >
                    <span className="absolute right-2 top-2 text-sm font-bold">{fa(toJalaali(d).jd)}</span>
                    {!tasks.length && (
                      <span className="flex h-full flex-col items-start justify-center gap-1 pt-5 text-[10px] text-slate-500 dark:text-slate-400">
                        <span>{months[toJalaali(d).jm - 1]} {fa(toJalaali(d).jy)}</span>
                        <span className="hidden sm:block">{d.toLocaleDateString("fa-IR", { weekday: "long" })}</span>
                        <span className="hidden text-[9px] sm:block" dir="ltr">{date}</span>
                        <span className="text-violet-600 dark:text-violet-300">{taskAllowed || projectAllowed ? "+ ایجاد" : "بدون وظیفه"}</span>
                      </span>
                    )}
                  </button>
                  <div className="pointer-events-none relative pt-7">
                  {tasks
                    .slice(0, view === "day" ? tasks.length : 2)
                    .map((t) => (
                      <Link
                        key={t.id}
                        to={"/tasks/" + t.id}
                        className="pointer-events-auto relative my-1 block truncate rounded bg-sky-100 px-1 py-1 text-[10px] text-sky-900 dark:bg-sky-900 dark:text-sky-100"
                      >
                        {t.title}
                      </Link>
                    ))}
                  {view !== "day" && tasks.length > 2 && (
                    <button
                      className="pointer-events-auto relative text-[10px]"
                      onClick={() => setSelected(date)}
                    >
                      {fa(tasks.length - 2)} مورد دیگر
                    </button>
                  )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card
          title={"وظایف " + jalali(selected)}
          action={
            (taskAllowed || projectAllowed) && (
              <button
                className={secondary}
                onClick={() => setCreating(selected)}
              >
                ایجاد
              </button>
            )
          }
        >
          <div className="space-y-3">
            {tasksOn(selected).map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
            {!tasksOn(selected).length && (
              <p className="text-xs">برای این روز وظیفه‌ای ثبت نشده است.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
