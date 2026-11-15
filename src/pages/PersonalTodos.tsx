import { useState } from "react";
import { Check, Circle, Pencil, Trash2, Clock3, RotateCcw } from "lucide-react";
import { iso } from "../lib/jalali";
import Modal from "../components/Modal";
import JalaliDatePicker from "../components/JalaliDatePicker";
import { api, store, type TodoList, useTodosQuery, useTodoListsQuery, useMutateMutation, errorText } from "../store";
import { useDispatch } from "react-redux";
import { TodoListsSidebar, TodoListForm } from "../components/TodoLists";
import { randomUuid } from "../lib/uuid";
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
  const { data: lists, error: listsError } = useTodoListsQuery();
  const dispatch = useDispatch<typeof store.dispatch>();
  const [selected, setSelected] = useState<string | null>(null);
  const [listForm, setListForm] = useState<TodoList | "new" | null>(null);
  const [deletingList, setDeletingList] = useState<TodoList | null>(null);
  const [pendingTodos, setPendingTodos] = useState<string[]>([]);
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
    setPendingTodos(p => [...p, todo.id]);
    const patch = dispatch(api.util.updateQueryData("todos", undefined, draft => {
      const index = draft.findIndex(t => t.id === todo.id);
      if (index >= 0) Object.assign(draft[index], todo);
    }));
    try {
      await mutate({
        url: "todos/" + todo.id,
        method: "PUT",
        body: todo,
      }).unwrap();
      setError("");
      return true;
    } catch (e) {
      patch.undo();
      setError(errorText(e));
      return false;
    } finally {
      setPendingTodos(p => p.filter(id => id !== todo.id));
    }
  }
  async function saveList(value: { name: string; color: string; icon: string }) {
    const editingList = listForm !== "new" ? listForm : null;
    const tempId = `pending-${randomUuid()}`;
    const patch = dispatch(api.util.updateQueryData("todoLists", undefined, draft => {
      if (editingList) { const row = draft.find(l => l.id === editingList.id); if (row) Object.assign(row, value); }
      else draft.push({ ...value, id: tempId });
    }));
    setListForm(null);
    if (!editingList) setSelected(tempId);
    try {
      const saved = await mutate({ url: editingList ? `todo-lists/${editingList.id}` : "todo-lists", method: editingList ? "PUT" : "POST", body: value }).unwrap() as TodoList;
      dispatch(api.util.updateQueryData("todoLists", undefined, draft => { const row = draft.find(l => l.id === tempId); if (row) Object.assign(row, saved); }));
      if (!editingList) setSelected(s => s === tempId ? saved.id : s);
      setError("");
    } catch (e) {
      patch.undo();
      if (!editingList) setSelected(s => s === tempId ? null : s);
      setError(errorText(e));
    }
  }
  if (error || listsError) return <ErrorBox message={errorText(error || listsError)} />;
  if (!todos || !lists) return <Loading />;
  const visible = todos.filter(t => (t.listId || null) === selected).slice().sort((a, b) => Number(a.done) - Number(b.done) || (b.priority || 0) - (a.priority || 0));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">کارهای شخصی من</h1>
        <button
          className={button}
          disabled={!!selected?.startsWith("pending-")}
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
      {listForm && <TodoListForm list={listForm === "new" ? null : listForm} close={() => setListForm(null)} save={saveList} />}
      {deletingList && <Modal title="حذف فهرست" onClose={() => setDeletingList(null)} compact busy={isLoading}>
        {actionError && <ErrorBox message={actionError} />}
        <p className="mb-4">کارهای فهرست «{deletingList.name}» چه شوند؟ این انتخاب شامل کارهای بایگانی‌شده نیز می‌شود.</p>
        <div className="flex flex-wrap gap-2">{[["inbox", "انتقال کارها به صندوق ورودی"], ["delete", "حذف فهرست و همه کارهای آن"]].map(([disposition, label]) => <button key={disposition} type="button" className={disposition === "delete" ? secondary : button} disabled={isLoading} onClick={async () => {
          try { await mutate({ url: `todo-lists/${deletingList.id}?disposition=${disposition}`, method: "DELETE" }).unwrap(); if (selected === deletingList.id) setSelected(null); setDeletingList(null); setError(""); }
          catch (e) { setError(errorText(e)); }
        }}>{label}</button>)}<button type="button" className={secondary} onClick={() => setDeletingList(null)}>انصراف</button></div>
      </Modal>}
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
                    listId: String(data.get("listId") || "") || null,
                    priority: Number(data.get("priority") || 0),
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
            <label className="block space-y-2 text-xs font-bold">فهرست<select name="listId" className={input} defaultValue={editing?.listId || selected || ""}><option value="">صندوق ورودی</option>{lists.filter(l => !l.id.startsWith("pending-")).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
            <label className="block space-y-2 text-xs font-bold">اولویت<select name="priority" className={input} defaultValue={editing?.priority || 0}><option value="0">عادی</option><option value="1">مهم</option><option value="2">فوری</option></select></label>
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
      <div className="grid items-start gap-4 md:grid-cols-[240px_1fr]">
      <TodoListsSidebar lists={lists} selected={selected} select={setSelected} add={() => setListForm("new")} edit={setListForm} remove={setDeletingList} />
      <Card>
        <div className="space-y-3">
          {visible.map((todo) => (
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
                  disabled={pendingTodos.includes(todo.id)}
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
                  <small>{todo.done ? "انجام شد" : "در انتظار انجام"}{todo.priority === 2 ? " · فوری" : todo.priority === 1 ? " · مهم" : ""}</small>
                </span>
              </label>
              {todo.reminderAt && (
                <time className="personal-todo-time">
                  <Clock3 size={14} />
                  {new Date(todo.reminderAt).toLocaleString("fa-IR")}
                </time>
              )}
              <select aria-label={`انتقال ${todo.title} به فهرست`} className={input} style={{ width: "auto" }} value={todo.listId || ""} disabled={pendingTodos.includes(todo.id)} onChange={e => void save({ ...todo, listId: e.target.value || null })}>
                <option value="">صندوق ورودی</option>{lists.filter(l => !l.id.startsWith("pending-")).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
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
          {!visible.length && <p className="text-sm">کاری در این فهرست ثبت نشده است.</p>}
        </div>
      </Card>
      </div>
    </div>
  );
}
