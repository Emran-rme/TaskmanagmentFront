import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AlarmClock,
  ArrowLeft,
  Bell,
  CalendarDays,
  ClipboardCheck,
  ListTodo,
  Target,
  TrendingUp,
  UserRound,
} from "lucide-react";
import { Card, Badge, Progress, button } from "./ui";
import { fa, iso, jalali } from "../lib/jalali";
import { assignedNames, type Project, type Workspace } from "../lib/types";
export function OverviewHero({
  title,
  subtitle,
  action,
  children,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={"overview-hero" + (compact ? " overview-hero-compact" : "")}>
      <div className="overview-hero-copy">
        {subtitle && <p>{subtitle}</p>}
        <h1>{title}</h1>
        {children}
      </div>
      {!compact && <div className="overview-hero-art" aria-hidden="true">
        <div className="overview-paper">
          <ClipboardCheck size={70} />
        </div>
        <Target size={62} className="overview-target" />
      </div>}
      {action && <div className="overview-hero-action">{action}</div>}
    </section>
  );
}
export default function WorkspaceOverview({
  workspace: w,
  project,
}: {
  workspace: Workspace;
  project?: Project;
}) {
  const tasks = w.tasks.filter(
    (task) => !project || task.projectId === project.id,
  );
  const projects = project ? [project] : w.projects;
  const average = Math.round(
    tasks.reduce((sum, task) => sum + task.progress, 0) / (tasks.length || 1),
  );
  const late = tasks.filter(
    (task) => task.status !== "بسته شده" && task.due < iso(new Date()),
  ).length;
  const recent = [...tasks]
    .sort((a, b) =>
      (b.createdAt || b.start).localeCompare(a.createdAt || a.start),
    )
    .slice(0, 5);
  const metrics = [
    {
      label: "کل وظایف",
      value: fa(tasks.length),
      hint: "تعداد وظایف ثبت‌شده",
      Icon: ListTodo,
    },
    {
      label: "پیشرفت",
      value: fa(average) + "٪",
      hint: "میانگین پیشرفت وظایف",
      Icon: TrendingUp,
    },
    {
      label: "وضعیت زمانی",
      value: late ? "نیازمند پیگیری" : "در مسیر برنامه",
      hint: late
        ? `${fa(late)} وظیفه از مهلت عبور کرده است`
        : "وظیفه‌ای با مهلت گذشته وجود ندارد",
      Icon: CalendarDays,
    },
    {
      label: "وظایف دیرکرددار",
      value: fa(late),
      hint: "نیاز به رسیدگی و پیگیری",
      Icon: AlarmClock,
    },
  ];
  return (
    <div className="space-y-5">
      <div className="overview-metrics">
        {metrics.map(({ label, value, hint, Icon }) => (
          <Card key={label} className="overview-metric">
            <div>
              <h2>{label}</h2>
              <span className="overview-icon">
                <Icon size={23} />
              </span>
            </div>
            <strong>{value}</strong>
            <p>{hint}</p>
          </Card>
        ))}
      </div>
      <Card
        title={project ? "مروری بر پروژه" : "مروری بر پروژه‌ها"}
        className="overview-projects"
      >
        {!projects.length && (
          <p className="text-sm text-slate-500">
            برای شروع، اولین پروژه را تعریف کنید.
          </p>
        )}
        {projects.map((p) => {
          const projectTasks = tasks.filter((task) => task.projectId === p.id);
          const progress = Math.round(
            projectTasks.reduce((sum, task) => sum + task.progress, 0) /
              (projectTasks.length || 1),
          );
          return (
            <article className="overview-project" key={p.id}>
              {!project && (
                <Link
                  to={`/projects/${p.id}`}
                  className="overview-project-name"
                >
                  {p.name}
                  <ArrowLeft size={16} />
                </Link>
              )}
              <div className="overview-people">
                {[
                  ["مدیر پروژه", p.managerId],
                  ["ناظر پروژه", p.supervisorId],
                  ["درخواست‌کننده", p.requesterId],
                ].map(([label, id]) => (
                  <span key={String(label)}>
                    <UserRound size={15} />
                    {label}:{" "}
                    <b>
                      {w.users.find((user) => user.id === id)?.name ||
                        "ثبت نشده"}
                    </b>
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7">
                {p.description || "توضیحی ثبت نشده است."}
              </p>
              <div className="overview-meta">
                <span>{p.company}</span>
                <span>
                  {jalali(p.start)} تا {jalali(p.end)}
                </span>
                <span>بودجه: {fa(p.budget)} ریال</span>
                <span>{fa(projectTasks.length)} وظیفه</span>
              </div>
              <Progress value={progress} />
            </article>
          );
        })}
      </Card>
      <div className="overview-lower">
        <Card title="آخرین وظایف ثبت‌شده">
          <div className="space-y-4">
            {recent.length ? (
              recent.map((task) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="overview-recent"
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong>
                      <Bell size={15} />
                      {task.title}
                    </strong>
                    <Badge status={task.status} />
                  </div>
                  <Progress value={task.progress} />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>
                      {assignedNames(task, w.users) || "انجام‌دهنده ثبت‌شده"}
                    </span>
                    <span>مهلت: {jalali(task.due)}</span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                هنوز وظیفه‌ای ثبت نشده است.
              </p>
            )}
          </div>
        </Card>
        <Card title="وضعیت وظایف">
          <div className="space-y-5">
            {w.statuses.map((status) => (
              <div key={status}>
                <div className="mb-2 flex justify-between text-sm">
                  <Badge status={status} />
                  <span>
                    {fa(tasks.filter((task) => task.status === status).length)}
                  </span>
                </div>
                <Progress
                  value={Math.round(
                    (tasks.filter((task) => task.status === status).length /
                      (tasks.length || 1)) *
                      100,
                  )}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
