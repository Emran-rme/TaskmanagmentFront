import { useProjectWorkspace } from "../lib/useProjectWorkspace";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWorkspaceQuery } from "../store";
import { Card, input, Loading } from "../components/ui";
import { parse, iso, jalali, shiftMonth } from "../lib/jalali";
export default function Gantt() {
  const { data: w } = useProjectWorkspace(),
    [project, P] = useState(""),
    [scale, S] = useState("week");
  const navigate = useNavigate();
  if (!w) return <Loading />;
  const tasks = w.tasks.filter(
    (t) => t.status !== "بسته شده" && (!project || t.projectId === project),
  );
  const min = tasks.length
      ? Math.min(...tasks.map((t) => +parse(t.start)))
      : +parse(iso(new Date())),
    max = Math.max(
      ...tasks.map((t) => +parse(t.due) + 86400000),
      min + 86400000 * 7,
    ),
    range = max - min;
  const ticks =
    scale === "week"
      ? Array.from(
          { length: Math.floor(range / (86400000 * 7)) + 1 },
          (_, i) => min + i * 86400000 * 7,
        )
      : Array.from(
          { length: Math.ceil(range / (86400000 * 28)) + 1 },
          (_, i) => +shiftMonth(new Date(min), i),
        ).filter((date) => date <= max);
  const width = Math.max(900, ticks.length * 120),
    row = 56;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between gap-3">
        <h1 className="text-xl font-bold text-navy dark:text-sky-50">
          نمودار گانت
        </h1>
        <div className="flex gap-2">
          <select
            className={input}
            aria-label="پروژه گانت"
            value={project}
            onChange={(e) => P(e.target.value)}
          >
            <option value="">تمام پروژه‌ها</option>
            {w.projects.map((p) => (
              <option value={p.id} key={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            aria-label="مقیاس گانت"
            className={input}
            value={scale}
            onChange={(e) => S(e.target.value)}
          >
            <option value="week">هفتگی</option>
            <option value="month">ماهانه</option>
          </select>
        </div>
      </div>
      <Card>
        <p className="mb-5 text-xs text-slate-400">
          بازه شروع تا مهلت هر وظیفه؛ بخش پررنگ نشان‌دهنده پیشرفت است.
        </p>
        <div dir="ltr">
          <div className="flex">
            <div className="min-w-0 flex-1 overflow-x-auto">
              <svg
                className="shrink-0"
                width={width}
                height={60 + tasks.length * row}
                viewBox={"0 0 " + width + " " + (60 + tasks.length * row)}
                role="img"
                aria-label="خط زمانی وظایف"
              >
                {ticks.map((date, i) => {
                  const x = ((date - min) / range) * width;
                  return (
                    <g key={i}>
                      <line
                        x1={x}
                        x2={x}
                        y1="35"
                        y2={60 + tasks.length * row}
                        stroke="#e2e8f0"
                        className="dark:stroke-slate-700"
                      />
                      <text
                        x={Math.max(35, Math.min(width - 35, x))}
                        y="20"
                        textAnchor="middle"
                        fontSize="10"
                        fill="#64748b"
                        className="dark:fill-slate-300"
                      >
                        {jalali(iso(new Date(date)))}
                      </text>
                    </g>
                  );
                })}
                {tasks.map((t, i) => {
                  const x = ((+parse(t.start) - min) / range) * width,
                    bar = Math.max(
                      5,
                      ((+parse(t.due) - +parse(t.start) + 86400000) / range) *
                        width,
                    );
                  return (
                    <g
                      key={t.id}
                      role="link"
                      tabIndex={0}
                      aria-label={
                        t.title +
                        "؛ " +
                        jalali(t.start) +
                        " تا " +
                        jalali(t.due)
                      }
                      onClick={() => navigate("/tasks/" + t.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          navigate("/tasks/" + t.id);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <rect
                        x={x}
                        y={64 + i * row}
                        width={bar}
                        height="24"
                        rx="6"
                        fill={!!t.blocker ? "#ffe4e6" : "#ccfbf1"}
                      />
                      <rect
                        x={x}
                        y={64 + i * row}
                        width={(bar * t.progress) / 100}
                        height="24"
                        rx="6"
                        fill={!!t.blocker ? "#f43f5e" : "#008beb"}
                      />
                      <title>{t.title + " " + t.progress + "%"}</title>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div
              className="w-40 sm:w-64 shrink-0 border-l bg-slate-50 dark:bg-slate-900/70 text-right"
              dir="rtl"
            >
              <div className="flex h-12 items-center px-4 py-3 text-xs font-bold">
                عنوان وظیفه
              </div>
              {tasks.map((t) => (
                <Link
                  key={t.id}
                  to={"/tasks/" + t.id}
                  className="flex h-14 items-center border-b px-4 text-xs leading-6 hover:text-brand dark:hover:text-sky-300"
                >
                  {t.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
