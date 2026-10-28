import {
  useId,
  useEffect,
  isValidElement,
  cloneElement,
  type ReactNode,
  type ReactElement,
} from "react";
import { Link } from "react-router-dom";
import type { Task } from "../lib/types";
import { jalali, fa } from "../lib/jalali";
import { notifyError } from "../lib/toasts";
export const input =
  "ui-input w-full rounded-2xl border border-white/80 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 px-3 py-2.5 text-sm text-navy dark:text-sky-50 shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-800";
export const button =
  "ui-button inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-600/15 transition hover:bg-sky-700 disabled:opacity-40";
export const secondary =
  "ui-secondary inline-flex items-center justify-center gap-2 rounded-2xl border border-white/80 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 px-4 py-2 text-sm text-navy dark:text-sky-50 shadow-sm backdrop-blur-xl hover:bg-white dark:hover:bg-slate-800";
export function Card({
  children,
  title,
  action,
  className = "",
}: {
  children: ReactNode;
  title?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={
        "ui-card rounded-md border border-white/60 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 p-5 shadow-xl shadow-slate-500/5 backdrop-blur-xl lg:p-6 " +
        className
      }
    >
      {title && (
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="font-bold text-navy dark:text-sky-50">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  const native = isValidElement(children) && typeof children.type === "string";
  return (
    <div className="space-y-2">
      <label
        htmlFor={native ? id : undefined}
        className="block text-xs font-bold text-slate-600 dark:text-slate-300"
      >
        {label}
      </label>
      {native ? cloneElement(children as ReactElement, { id }) : children}
    </div>
  );
}
export function Badge({ status }: { status: string }) {
  return (
    <span
      className={
        "inline-flex rounded-lg px-2 py-1 text-[11px] " +
        (status === "بسته شده" || status === "تکمیل‌شده"
          ? "bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300"
          : status === "دارای مانع"
            ? "bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300"
            : status === "حل شده"
              ? "bg-violet-50 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300"
              : "bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300")
      }
    >
      {status}
    </span>
  );
}
export function Progress({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="flex flex-1 gap-px overflow-hidden rounded-full"
        aria-label={"پیشرفت " + value + " درصد"}
      >
        {Array.from({ length: 20 }, (_, i) => (
          <span
            key={i}
            className={
              "h-1.5 flex-1 " +
              (i < value / 5 ? "bg-brand" : "bg-slate-100 dark:bg-slate-700")
            }
          />
        ))}
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {fa(value)}٪
      </span>
    </div>
  );
}
export function TaskCard({ task, draggable }: { task: Task; draggable?: boolean }) {
  return (
    <Link
      to={"/tasks/" + task.id}
      draggable={draggable}
      className="block space-y-3 rounded-2xl border border-white/80 dark:border-white/10 bg-white/65 dark:bg-slate-800/65 p-4 shadow-sm transition hover:border-brand hover:bg-white/90 dark:hover:bg-slate-700/90"
    >
      <div className="flex justify-between">
        <span className="text-xs text-slate-400" dir="ltr">
          {task.code}
        </span>
        <Badge status={task.status} />
      </div>
      <h3 className="text-sm font-bold leading-7">{task.title}</h3>
      <Progress value={task.progress} />
      <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{task.company}</span>
        <span>{jalali(task.due)}</span>
      </div>
    </Link>
  );
}
export function Loading() {
  return (
    <div className="rounded-xl bg-white dark:bg-slate-800 p-8 text-center text-slate-500 dark:text-slate-400">
      در حال دریافت اطلاعات…
    </div>
  );
}
export function ErrorBox({ message }: { message: string }) {
  useEffect(() => { notifyError(message); }, [message]);
  return (
    <p
      role="alert"
      className="rounded-xl bg-rose-50 dark:bg-rose-950/70 p-3 text-sm text-rose-700 dark:text-rose-300"
    >
      {message}
    </p>
  );
}
