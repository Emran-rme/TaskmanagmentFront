import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState, can, manages } from "../store";
import { assignedIds, assignedNames, type Task, type User } from "../lib/types";
import { Badge, Progress, secondary } from "./ui";
export default function TaskTree({
  tasks,
  users,
  parentId,
}: {
  tasks: Task[];
  users: User[];
  parentId?: string;
}) {
  const actor = useSelector((s: RootState) => s.auth.user);
  function branch(parent?: string) {
    return tasks
      .filter((t) =>
        parent
          ? t.parentTaskId === parent
          : !t.parentTaskId || !tasks.some((p) => p.id === t.parentTaskId),
      )
      .map((t) => {
        const children = tasks.filter((c) => c.parentTaskId === t.id);
        return (
          <li key={t.id} className="space-y-3">
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-sky-100 bg-white/50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
              <Link
                className="min-w-40 flex-1 text-sm font-semibold text-brand"
                to={"/tasks/" + t.id}
              >
                {t.title}
                <span className="mt-1 block text-[10px] font-normal text-slate-500">
                  {t.code} · {assignedNames(t, users) || "مسئول ثبت‌شده"}
                </span>
              </Link>
              <Badge status={t.status} />
              {t.status !== "بسته شده" &&
                can(actor, "tasks.write", t.company) &&
                (manages(actor, t.company) ||
                  assignedIds(t).includes(actor?.id || 0) ||
                  actor?.id === t.approverId) && (
                  <Link
                    className={secondary + " text-xs"}
                    to={"/tasks/" + t.id + "/edit"}
                  >
                    ویرایش
                  </Link>
                )}
              <div className="w-24">
                <Progress value={t.progress} />
              </div>
              {t.status !== "بسته شده" &&
                can(actor, "tasks.write", t.company) &&
                (manages(actor, t.company) ||
                  assignedIds(t).includes(actor?.id || 0)) && (
                  <Link
                    className={secondary + " text-xs"}
                    to={
                      "/tasks/new?projectId=" +
                      t.projectId +
                      "&parentTaskId=" +
                      t.id
                    }
                  >
                    افزودن زیروظیفه
                  </Link>
                )}
            </div>
            {children.length > 0 && (
              <details
                open
                className="mr-3 border-r-2 border-sky-200 pr-4 dark:border-slate-700"
              >
                <summary className="mb-3 cursor-pointer text-xs text-slate-500">
                  زیروظایف ({children.length})
                </summary>
                <ul className="space-y-3">{branch(t.id)}</ul>
              </details>
            )}
          </li>
        );
      });
  }
  return (
    <ul className="space-y-3" aria-label="درخت وظایف">
      {branch(parentId)}
    </ul>
  );
}
