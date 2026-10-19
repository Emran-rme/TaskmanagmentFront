import { useState } from "react";
import { useSelector } from "react-redux";
import { BarChart3, LayoutDashboard } from "lucide-react";
import { Link } from "react-router-dom";
import WorkspaceOverview from "./WorkspaceOverview";
import { Card, Badge, Progress, button, secondary } from "./ui";
import { assignedIds, type Project, type Workspace } from "../lib/types";
import type { RootState } from "../store";
import { fa, iso } from "../lib/jalali";
export default function DashboardViews({
  workspace: w,
  project,
}: {
  workspace: Workspace;
  project?: Project;
}) {
  const userId = useSelector((state: RootState) => state.auth.user?.id);
  return (
    <SavedDashboard
      key={userId}
      storageKey={`tm-dashboard-view-${userId}`}
      workspace={w}
      project={project}
    />
  );
}
function SavedDashboard({
  workspace: w,
  project,
  storageKey,
}: {
  workspace: Workspace;
  project?: Project;
  storageKey: string;
}) {
  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem(storageKey) === "analytics"
        ? "analytics"
        : "summary";
    } catch {
      return "summary";
    }
  });
  const tasks = w.tasks.filter(
    (task) => !project || task.projectId === project.id,
  );
  const projects = project ? [project] : w.projects;
  const today = iso(new Date());
  const open = tasks.filter((task) => task.status !== "بسته شده");
  const dueSoon = open.filter(
    (task) =>
      task.due >= today && task.due <= iso(new Date(Date.now() + 7 * 86400000)),
  );
  const people = Array.from(new Set(tasks.flatMap(assignedIds)))
    .map((id) => ({
      id,
      name: w.users.find((user) => user.id === id)?.name || "کاربر ثبت‌شده",
      count: tasks.filter((task) => assignedIds(task).includes(id)).length,
      open: open.filter((task) => assignedIds(task).includes(id)).length,
    }))
    .sort((a, b) => b.open - a.open);
  return (
    <div className="space-y-5">
      <div
        className="dashboard-view-switch"
        role="group"
        aria-label="نمای میز کار"
      >
        {[
          { id: "summary", label: "خلاصه و کارتی", Icon: LayoutDashboard },
          { id: "analytics", label: "تحلیلی و نموداری", Icon: BarChart3 },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={view === id ? button : secondary}
            aria-pressed={view === id}
            onClick={() => {
              setView(id);
              try {
                localStorage.setItem(storageKey, id);
              } catch {}
            }}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      {view === "summary" ? (
        <WorkspaceOverview workspace={w} project={project} />
      ) : (
        <div className="dashboard-analytics">
          <Card title="توزیع وضعیت وظایف">
            <div className="analytics-bars">
              {w.statuses.map((status, index) => {
                const count = tasks.filter(
                  (task) => task.status === status,
                ).length;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-xs">
                      <Badge status={status} />
                      <span>
                        {fa(count)} وظیفه ·{" "}
                        {fa(Math.round((count / (tasks.length || 1)) * 100))}٪
                      </span>
                    </div>
                    <div
                      className="analytics-track"
                      role="img"
                      aria-label={`${status}: ${count} وظیفه`}
                    >
                      <span
                        style={{
                          width: `${(count / (tasks.length || 1)) * 100}%`,
                          background: [
                            "#aaa0d3",
                            "#625bb1",
                            "#37a59b",
                            "#43876c",
                          ][index % 4],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {!tasks.length && (
              <p className="mt-4 text-xs text-slate-500">
                وظیفه‌ای برای تحلیل ثبت نشده است.
              </p>
            )}
          </Card>
          <Card title="پیشرفت پروژه‌ها">
            <div className="analytics-bars">
              {projects.map((p) => {
                const list = tasks.filter((task) => task.projectId === p.id);
                const average = Math.round(
                  list.reduce((sum, task) => sum + task.progress, 0) /
                    (list.length || 1),
                );
                return (
                  <div key={p.id}>
                    <Link
                      className="mb-3 flex justify-between gap-3 text-xs"
                      to={`/projects/${p.id}`}
                    >
                      <span>{p.name}</span>
                      <span>{fa(list.length)} وظیفه</span>
                    </Link>
                    <Progress value={average} />
                  </div>
                );
              })}
              {!projects.length && (
                <p className="text-sm text-slate-500">پروژه‌ای ثبت نشده است.</p>
              )}
            </div>
          </Card>
          <Card title="بار کاری افراد">
            <div className="analytics-bars">
              {people.map((person) => (
                <div key={person.id}>
                  <div className="mb-2 flex justify-between gap-3 text-xs">
                    <span>{person.name}</span>
                    <span>
                      {fa(person.open)} باز از {fa(person.count)} وظیفه
                    </span>
                  </div>
                  <div
                    className="analytics-track"
                    role="img"
                    aria-label={`${person.name}: ${person.open} وظیفه باز`}
                  >
                    <span
                      style={{
                        width: `${(person.open / Math.max(1, ...people.map((p) => p.open))) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {!people.length && (
                <p className="text-sm text-slate-500">
                  تخصیصی برای نمایش وجود ندارد.
                </p>
              )}
            </div>
          </Card>
          <Card title="مهلت‌ها و موانع">
            <div className="analytics-deadlines">
              {[
                ["وظایف باز", open.length],
                [
                  "دارای دیرکرد",
                  open.filter((task) => task.due < today).length,
                ],
                ["سررسید ۷ روز آینده", dueSoon.length],
                ["دارای مانع", open.filter((task) => !!task.blocker).length],
              ].map(([label, count]) => (
                <div key={label}>
                  <span>{label}</span>
                  <strong>{fa(Number(count))}</strong>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
