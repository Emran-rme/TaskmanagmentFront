import { useState } from "react";
import { Check, Circle, Pencil, Trash2, Clock3, RotateCcw } from "lucide-react";
import { iso } from "../lib/jalali";
import Modal from "../components/Modal";
import JalaliDatePicker from "../components/JalaliDatePicker";
import { useTodosQuery, useMutateMutation, errorText } from "../store";
import {
  Card,
  button,
  secondary,
  input,
  Loading,
  ErrorBox,
} from "../components/ui";
export default function PersonalTodos() {
  const { data: todos, error } = useTodosQuery();
  const [mutate, { isLoading }] = useMutateMutation();
  const [actionError, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<
    NonNullable<typeof todos>[number] | null
  >(null);
  const [removed, setRemoved] = useState<
    NonNullable<typeof todos>[number] | null
  >(null);
  async function save(todo: any) {
    try {
      await mutate({
        url: "todos/" + todo.id,
        method: "PUT",
        body: todo,
      }).unwrap();
      setError("");
      return true;
    } catch (e) {
      setError(errorText(e));
      return false;
    }
  }
  if (error) return <ErrorBox message={errorText(error)} />;
  if (!todos) return <Loading />;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">کارهای شخصی من</h1>
        <button
          className={button}
          onClick={() => {
            setError("");
            setEditing(null);
            setAdding(true);
          }}
        >
          + افزودن کار شخصی
        </button>
      </div>
      <p className="text-sm">
        این فهرست خصوصی است و به پروژه وابسته نیست. یادآوری‌ها در مرکز اعلان‌ها
        ثبت می‌شوند.
      </p>
      {actionError && <ErrorBox message={actionError} />}
      {removed && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          <span>«{removed.title}» حذف شد.</span>
          <button
            className={secondary}
            disabled={isLoading}
            onClick={async () => {
              if (await save({ ...removed, archived: false })) setRemoved(null);
            }}
          >
            <RotateCcw size={15} />
            بازگردانی
          </button>
        </div>
      )}
      {adding && (
        <Modal
          title={editing ? "ویرایش کار شخصی" : "افزودن کار شخصی"}
          onClose={() => setAdding(false)}
          busy={isLoading}
          compact
          className="personal-todo-dialog"
        >
          <p className="mb-5 text-xs leading-7 text-slate-500">
            یک کار، یک قدم رو به جلو. یادآوری را در صورت نیاز تنظیم کنید.
          </p>
          {actionError && <ErrorBox message={actionError} />}
          <form
            className="space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const data = new FormData(form);
              try {
                const date = String(data.get("reminderDate") || "");
                const time = String(data.get("reminderTime") || "");
                if (time && !date)
                  throw new Error("تاریخ یادآوری را انتخاب کنید.");
                await mutate({
                  url: editing ? "todos/" + editing.id : "todos",
                  method: editing ? "PUT" : "POST",
                  body: {
                    ...(editing || {}),
                    title: data.get("title"),
                    reminderAt: date
                      ? new Date(date + "T" + (time || "09:00")).toISOString()
                      : null,
                  },
                }).unwrap();
                form.reset();
                setError("");
                setAdding(false);
              } catch (err) {
                setError(errorText(err));
              }
            }}
          >
            <label className="block space-y-2 text-xs font-bold">
              عنوان کار *
              <input
                name="title"
                required
                maxLength={300}
                aria-label="عنوان کار شخصی"
                placeholder="چه کاری باید انجام دهم؟"
                className={input}
                defaultValue={editing?.title || ""}
              />
            </label>
            <div className="rounded border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-bold">یادآوری اختیاری</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs">تاریخ شمسی</p>
                  <JalaliDatePicker
                    name="reminderDate"
                    label="انتخاب تاریخ یادآوری"
                    defaultValue={
                      editing?.reminderAt
                        ? iso(new Date(editing.reminderAt))
                        : ""
                    }
                  />
                </div>
                <label className="space-y-2 text-xs">
                  ساعت
                  <input
                    name="reminderTime"
                    type="time"
                    aria-label="ساعت یادآوری"
                    className={input}
                    dir="ltr"
                    defaultValue={
                      editing?.reminderAt
                        ? new Date(editing.reminderAt)
                            .toTimeString()
                            .slice(0, 5)
                        : ""
                    }
                  />
                </label>
              </div>
              <p className="mt-3 text-[11px] text-slate-500">
                در صورت انتخاب تاریخ بدون ساعت، یادآوری برای ساعت ۰۹:۰۰ تنظیم
                می‌شود.
              </p>
            </div>
            <div className="personal-todo-form-footer">
              <button className={button} disabled={isLoading}>
                {isLoading
                  ? "در حال ذخیره…"
                  : editing
                    ? "ذخیره تغییرات"
                    : "ثبت کار شخصی"}
              </button>
              <button
                type="button"
                className={secondary}
                disabled={isLoading}
                onClick={() => setAdding(false)}
              >
                انصراف
              </button>
            </div>
          </form>
        </Modal>
      )}
      <Card>
        <div className="space-y-3">
          {todos.map((todo) => (
            <div
              key={todo.id}
              className={
                "personal-todo-row " + (todo.done ? "is-done" : "is-open")
              }
            >
              <label className="personal-todo-toggle">
                <input
                  type="checkbox"
                  checked={todo.done}
                  disabled={isLoading}
                  onChange={(e) => save({ ...todo, done: e.target.checked })}
                  className="sr-only peer"
                />
                <span className="personal-todo-check">
                  {todo.done ? (
                    <Check size={19} strokeWidth={3} />
                  ) : (
                    <Circle size={19} />
                  )}
                </span>
                <span className="personal-todo-copy">
                  <span
                    className={todo.done ? "line-through text-slate-400" : ""}
                  >
                    {todo.title}
                  </span>
                  <small>{todo.done ? "انجام شد" : "در انتظار انجام"}</small>
                </span>
              </label>
              {todo.reminderAt && (
                <time className="personal-todo-time">
                  <Clock3 size={14} />
                  {new Date(todo.reminderAt).toLocaleString("fa-IR")}
                </time>
              )}
              <button
                className="personal-todo-action"
                aria-label={"ویرایش " + todo.title}
                title="ویرایش"
                disabled={isLoading}
                onClick={() => {
                  setEditing(todo);
                  setError("");
                  setAdding(true);
                }}
              >
                <Pencil size={17} />
              </button>
              <button
                className="personal-todo-action is-delete"
                aria-label={"حذف " + todo.title}
                title="حذف"
                disabled={isLoading}
                onClick={async () => {
                  if (await save({ ...todo, archived: true })) setRemoved(todo);
                }}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
          {!todos.length && <p className="text-sm">کار شخصی ثبت نشده است.</p>}
        </div>
      </Card>
    </div>
  );
}
