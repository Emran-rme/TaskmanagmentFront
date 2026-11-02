import { useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowUpLeft,
  ClipboardCheck,
  ListTodo,
  Search,
  Clock3,
  FolderKanban,
} from "lucide-react";
import { RootState, useMyWorkQuery } from "../store";
import { ErrorBox, Loading, input, secondary } from "../components/ui";
import { errorText } from "../store";
import { fa, jalali } from "../lib/jalali";

const kinds: Record<string, string> = {
  "project-task": "تسک پروژه",
  "standalone-task": "وظیفه مستقل",
  todo: "کار روزانه",
  approval: "تأیید خروجی",
  extension: "درخواست تمدید",
};
const tabs = [
  ["all", "همه کارها"],
  ["tasks", "وظایف من"],
  ["reviews", "نیازمند بررسی"],
  ["todo", "کارهای روزانه"],
  ["overdue", "با تأخیر"],
] as const;

export default function MyWork() {
  const user = useSelector((s: RootState) => s.auth.user);
  const { data, error, isFetching } = useMyWorkQuery(undefined, {
    pollingInterval: 60000,
    refetchOnFocus: true,
  });
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  if (error) return <ErrorBox message={errorText(error)} />;
  if (!data) return <Loading />;
  const reviews = data.items.filter((i) =>
    ["approval", "extension"].includes(i.kind),
  ).length;
  const filtered = data.items.filter(
    (item) =>
      (tab === "all" ||
        (tab === "tasks" &&
          ["project-task", "standalone-task"].includes(item.kind)) ||
        (tab === "reviews" && ["approval", "extension"].includes(item.kind)) ||
        (tab === "todo" && item.kind === "todo") ||
        (tab === "overdue" &&
          item.actionable &&
          !!item.due &&
          item.due < data.today)) &&
      `${item.title} ${item.code} ${item.projectName} ${item.company}`
        .toLocaleLowerCase()
        .includes(search.trim().toLocaleLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 20));
  const current = Math.min(page, pages);
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-sky-200 bg-gradient-to-l from-sky-50 via-white to-indigo-50 p-6 dark:border-slate-700 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-950">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
              سلام {user?.name}
            </p>
            <h1 className="text-2xl font-bold">کارهای من</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
              کارهایی که به شما سپرده شده یا منتظر تصمیم شما هستند، در یک نگاه.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              شرکت فعال:{" "}
              {user?.company === "*" ? "همه شرکت‌های مجاز" : user?.company} ·{" "}
              {jalali(data.today)}
            </p>
          </div>
          <Link className={secondary} to="/todos">
            <ListTodo size={16} /> ثبت کار روزانه
          </Link>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["all", "کار باز", data.total, ListTodo],
            ["reviews", "منتظر بررسی شما", reviews, ClipboardCheck],
            ["overdue", "نیازمند پیگیری سررسید", data.overdue, Clock3],
          ].map(([key, label, count, Icon]) => {
            const Symbol = Icon as typeof ListTodo;
            return (
              <button
                type="button"
                key={String(key)}
                onClick={() => {
                  setTab(String(key));
                  setPage(1);
                }}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 text-right transition hover:border-sky-400 dark:border-slate-700 dark:bg-slate-900/70"
              >
                <Symbol size={21} className="text-sky-600 dark:text-sky-400" />
                <div>
                  <b className="block text-xl">{fa(Number(count))}</b>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {String(label)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-4 dark:border-slate-700">
          <div className="flex flex-wrap gap-2" aria-label="فیلتر کارهای من">
            {tabs.map(([key, label]) => (
              <button
                type="button"
                key={key}
                aria-pressed={tab === key}
                onClick={() => {
                  setTab(key);
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-2 text-sm ${tab === key ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="relative min-w-56">
            <span className="sr-only">جست‌وجوی کارهای من</span>
            <Search
              className="absolute right-3 top-3 text-slate-400"
              size={16}
            />
            <input
              className={`${input} pr-10`}
              placeholder="جست‌وجوی عنوان یا پروژه…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>
        <div aria-live="polite" className="px-4 pt-3 text-xs text-slate-500">
          {fa(filtered.length)} مورد {isFetching && "· در حال به‌روزرسانی…"}
        </div>
        {!filtered.length ? (
          <div role="status" className="px-6 py-14 text-center">
            <ClipboardCheck className="mx-auto mb-4 text-sky-500" size={34} />
            <h2 className="font-bold">کاری در این فهرست ندارید</h2>
            <p className="mt-2 text-sm text-slate-500">
              ارجاع‌های جدید در محدوده نقش و شرکت فعال، اینجا نمایش داده
              می‌شوند.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.slice((current - 1) * 20, current * 20).map((item) => (
              <Link
                key={item.key}
                to={item.href}
                className="flex flex-wrap items-center gap-4 p-5 transition hover:bg-sky-50/60 focus-visible:outline focus-visible:outline-sky-500 dark:hover:bg-slate-800"
              >
                <span className="rounded-xl bg-slate-100 p-3 text-sky-600 dark:bg-slate-800">
                  {["approval", "extension"].includes(item.kind) ? (
                    <ClipboardCheck size={21} />
                  ) : item.kind === "project-task" ? (
                    <FolderKanban size={21} />
                  ) : (
                    <ListTodo size={21} />
                  )}
                </span>
                <div className="min-w-48 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-sky-700 dark:text-sky-400">
                      {kinds[item.kind] || item.kind}
                    </span>
                    {item.code && (
                      <span className="text-xs text-slate-400" dir="ltr">
                        {item.code}
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {item.projectName}
                    {item.company && ` · ${item.company}`}
                  </p>
                </div>
                <div className="space-y-2 text-xs">
                  <p
                    className={
                      item.actionable
                        ? "text-sky-700 dark:text-sky-400"
                        : "text-slate-500"
                    }
                  >
                    {item.status}
                  </p>
                  <p
                    className={
                      item.actionable && item.due && item.due < data.today
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-slate-500"
                    }
                  >
                    {item.due ? `مهلت: ${jalali(item.due)}` : "بدون مهلت"} ·{" "}
                    {item.priority}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  {item.actionable ? "رسیدگی" : "مشاهده"}
                  <ArrowUpLeft size={15} />
                </span>
              </Link>
            ))}
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-center gap-4 border-t border-slate-200 p-4 dark:border-slate-700">
            <button
              className={secondary}
              disabled={current <= 1}
              onClick={() => setPage(current - 1)}
            >
              قبلی
            </button>
            <span className="text-sm">
              {fa(current)} از {fa(pages)}
            </span>
            <button
              className={secondary}
              disabled={current >= pages}
              onClick={() => setPage(current + 1)}
            >
              بعدی
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
