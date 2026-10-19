import { useState } from "react";
import { useSelector } from "react-redux";
import { Trash2 } from "lucide-react";
import Modal from "./Modal";
import { button, secondary, ErrorBox } from "./ui";
import { useMutateMutation, can, errorText, type RootState } from "../store";
export default function DeleteButton({
  entity,
  id,
  label,
  ownerId,
  onDeleted,
  iconOnly = false,
}: {
  entity: string;
  id: string | number;
  label: string;
  ownerId?: number;
  onDeleted?: () => void;
  iconOnly?: boolean;
}) {
  const user = useSelector((s: RootState) => s.auth.user);
  const [mutate, { isLoading }] = useMutateMutation();
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  if (
    !can(user, entity + ".delete") ||
    (ownerId !== undefined &&
      user?.role !== "Admin" &&
      user?.role !== "Manager" &&
      user?.id !== ownerId)
  )
    return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        aria-label={"حذف " + label}
        title={"حذف " + label}
        className={iconOnly ? "project-icon-action project-icon-danger" : "inline-flex items-center gap-1 rounded-xl px-2 py-2 text-xs text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/70 disabled:opacity-40"}
        disabled={isLoading}
        onClick={() => { setError(""); setOpen(true); }}
      >
        <Trash2 size={14} />
        {!iconOnly && "حذف"}
      </button>
      {open && <Modal compact title="تأیید حذف" onClose={() => setOpen(false)} busy={isLoading}>
        <div className="delete-modal-icon"><Trash2 size={23} strokeWidth={1.5} /></div>
        <p className="mb-2 font-bold">«{label}» حذف شود؟</p>
        <p className="mb-5 text-sm leading-7 text-slate-500">اطلاعات در سطل بازیافت نگهداری می‌شود. حذف پروژه یا وظیفه شامل داده‌های وابسته نیز می‌شود.</p>
        {error && <ErrorBox message={error} />}
        <div className="modal-actions">
          <button type="button" className={secondary} disabled={isLoading} onClick={() => setOpen(false)}>انصراف</button>
          <button type="button" className={button + " modal-danger"} disabled={isLoading} onClick={async () => {
          try {
            await mutate({
              url: (entity === "users" ? "admin/users" : entity) + "/" + id,
              method: "DELETE",
            }).unwrap();
            setError("");
            setOpen(false);
            onDeleted?.();
          } catch (e) {
            setError(errorText(e));
          }
        }}><Trash2 size={14} />{isLoading ? "در حال حذف…" : "حذف"}</button>
        </div>
      </Modal>}
      {error && !open && (
        <span
          role="alert"
          className="max-w-64 text-xs leading-6 text-rose-600 dark:text-rose-300"
        >
          {error}
        </span>
      )}
    </span>
  );
}
