import { useState } from "react";
import { useSelector } from "react-redux";
import { ArchiveRestore, Trash2 } from "lucide-react";
import {
  useTrashQuery,
  useMutateMutation,
  can,
  errorText,
  type RootState,
} from "../store";
import {
  Card,
  Field,
  input,
  button,
  ErrorBox,
  Loading,
} from "../components/ui";
import { jalali, fa } from "../lib/jalali";
const entities = [
  ["users", "کاربران"],
  ["projects", "پروژه‌ها"],
  ["tasks", "وظایف"],
  ["history", "تاریخچه پیشرفت"],
  ["extensions", "درخواست‌های تمدید"],
  ["files", "پیوست‌ها"],
  ["notifications", "اعلان‌ها"],
  ["reports", "گزارش‌های پیگیری"],
];
export default function Trash() {
  const user = useSelector((s: RootState) => s.auth.user);
  const available = entities.filter(
    ([key]) => can(user, key + ".delete") || can(user, key + ".restore"),
  );
  const [selected, setSelected] = useState("");
  const entity = available.some(([key]) => key === selected)
    ? selected
    : available[0]?.[0] || "";
  const { data, error } = useTrashQuery(entity, { skip: !entity });
  const [mutate, { isLoading }] = useMutateMutation();
  const [feedback, setFeedback] = useState({ error: "", message: "" });
  if (!entity)
    return <ErrorBox message="مجوز مشاهده حذف‌شده‌ها برای شما فعال نیست." />;
  return (
    <div className="space-y-5">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-navy dark:text-sky-50">
        <Trash2 className="text-brand dark:text-sky-300" />
        سطل بازیافت
      </h1>
      <Card>
        <p className="mb-5 text-sm leading-8 text-slate-500 dark:text-slate-400">
          رکوردها از دیتابیس پاک نمی‌شوند. بازیابی پروژه یا وظیفه، وابسته‌هایی
          را برمی‌گرداند که در همان عملیات حذف شده‌اند. برای بازیابی زیرمجموعه،
          ابتدا والد را بازیابی کنید. کاربر بازیابی‌شده تا فعال‌سازی مدیر،
          غیرفعال می‌ماند.
        </p>
        <div className="max-w-sm">
          <Field label="نوع اطلاعات">
            <select
              className={input}
              value={entity}
              onChange={(e) => {
                setSelected(e.target.value);
                setFeedback({ error: "", message: "" });
              }}
            >
              {available.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>
      {feedback.error && <ErrorBox message={feedback.error} />}{" "}
      {feedback.message && (
        <p
          role="status"
          className="rounded-2xl bg-sky-50 dark:bg-sky-950/70 p-4 text-sm text-brand dark:text-sky-300"
        >
          {feedback.message}
        </p>
      )}
      {error ? (
        <ErrorBox message={errorText(error)} />
      ) : !data ? (
        <Loading />
      ) : (
        <Card title={"حذف‌شده‌ها · " + fa(data.length)}>
          <div className="divide-y dark:divide-slate-700 divide-white/80 dark:divide-slate-700">
            {data.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4"
              >
                <div>
                  <p className="text-sm font-bold text-navy dark:text-sky-50">
                    {row.label}
                  </p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    حذف در {row.deletedAt ? jalali(row.deletedAt) : "—"} · شناسه
                    حذف‌کننده: {row.deletedBy ? fa(row.deletedBy) : "—"}
                  </p>
                </div>
                {can(user, entity + ".restore") && (
                  <button
                    className={button}
                    disabled={isLoading}
                    onClick={async () => {
                      try {
                        await mutate({
                          url: "trash/" + entity + "/" + row.id + "/restore",
                        }).unwrap();
                        setFeedback({
                          error: "",
                          message: "اطلاعات بازیابی شد.",
                        });
                      } catch (e) {
                        setFeedback({ error: errorText(e), message: "" });
                      }
                    }}
                  >
                    <ArchiveRestore size={16} />
                    بازیابی
                  </button>
                )}
              </div>
            ))}
          </div>
          {!data.length && (
            <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
              رکورد حذف‌شده‌ای در این بخش وجود ندارد.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
