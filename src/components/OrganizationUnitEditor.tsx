import { useState } from "react";
import DefinitionDialog from "./DefinitionDialog";
import DefinitionPicker from "./DefinitionPicker";
import { useMutateMutation, errorText } from "../store";
import { Card, Field, input, button, secondary, ErrorBox } from "./ui";

type Unit = {
  id: string;
  name: string;
  code?: string;
  type: string;
  parentId?: string | null;
};
export default function OrganizationUnitEditor({
  units,
  endpoint = "master/units",
  allowed = () => true,
  admin = true,
}: {
  units: Unit[];
  endpoint?: string;
  allowed?: (id: string) => boolean;
  admin?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [parentId, setParentId] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [mutate, { isLoading }] = useMutateMutation();
  const selected = units.find((u) => u.id === selectedId);
  const editable =
    creating ||
    (!!selected &&
      allowed(selected.id) &&
      (admin || !["شرکت مادر", "شرکت تابعه"].includes(selected.type)));
  const descendants = new Set<string>();
  function collect(id: string) {
    if (descendants.has(id)) return;
    descendants.add(id);
    units.filter((u) => u.parentId === id).forEach((u) => collect(u.id));
  }
  if (selected && !creating) collect(selected.id);
  const [open, setOpen] = useState(false);
  function start(parent = "") {
    setCreating(true);
    setSelectedId(null);
    setParentId(parent);
    setMessage("");
    setSuccess("");
    setOpen(true);
  }
  const items = units.map((unit) => ({ ...unit, subtitle: unit.type }));
  const navigator = (
    <DefinitionPicker
      items={items}
      selectedId={creating ? parentId : selectedId}
      title="واحد"
      tree
      busy={isLoading}
      onSelect={(id) => {
        setSelectedId(String(id));
        setCreating(false);
        setOpen(true);
        setMessage("");
        setSuccess("");
      }}
      onCreate={() => start()}
      createLabel="تعریف واحد جدید"
    />
  );
  return (
    <>
      <Card title="ساختار سازمانی">
        <p className="mb-4 text-sm text-slate-500">
          برای مشاهده و ویرایش اطلاعات، واحد را انتخاب کنید.
        </p>
        {navigator}
      </Card>
      {open && (
        <DefinitionDialog
          title={creating ? "تعریف واحد جدید" : "ویرایش واحد سازمانی"}
          onClose={() => setOpen(false)}
          busy={isLoading}
          navigator={navigator}
        >
          {message && <ErrorBox message={message} />}
          {success && (
            <p role="status" className="mb-4 text-sm text-emerald-600">
              {success}
            </p>
          )}
          <form
            key={creating ? `new-${parentId}` : selected?.id}
            className="definition-form definition-unit-form grid gap-4 sm:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const body = Object.fromEntries(new FormData(e.currentTarget));
              try {
                const saved = await mutate({
                  url:
                    endpoint + (!creating && selected ? "/" + selected.id : ""),
                  method: creating ? "POST" : "PUT",
                  body: { ...body, parentId: body.parentId || null },
                }).unwrap();
                setSelectedId(saved.id);
                setCreating(false);
                setMessage("");
                setSuccess("اطلاعات واحد ذخیره شد.");
              } catch (err) {
                setMessage(errorText(err));
                setSuccess("");
              }
            }}
          >
            <Field label="نام واحد">
              <input
                name="name"
                className={input}
                required
                maxLength={200}
                defaultValue={creating ? "" : selected?.name}
                disabled={!editable || isLoading}
              />
            </Field>
            <Field label="کد سیستمی واحد">
              <input
                className={input}
                readOnly
                value={
                  creating
                    ? "پس از ذخیره توسط سیستم ایجاد می‌شود"
                    : selected?.code || ""
                }
              />
            </Field>
            <Field label="نوع واحد">
              <select
                name="type"
                className={input}
                defaultValue={creating ? "واحد" : selected?.type}
                disabled={!editable || isLoading}
              >
                {(admin
                  ? [
                      "شرکت مادر",
                      "شرکت تابعه",
                      "معاونت",
                      "مدیریت",
                      "اداره",
                      "واحد",
                      "دپارتمان",
                    ]
                  : ["معاونت", "مدیریت", "اداره", "واحد", "دپارتمان"]
                ).map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="واحد بالادست">
              <select
                name="parentId"
                className={input}
                defaultValue={creating ? parentId : selected?.parentId || ""}
                required={!admin}
                disabled={!editable || isLoading}
              >
                <option value="">بدون والد</option>
                {units
                  .filter(
                    (u) =>
                      !descendants.has(u.id) &&
                      (allowed(u.id) || u.id === selected?.parentId),
                  )
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} · {u.type}
                    </option>
                  ))}
              </select>
            </Field>
            <div className="definition-actions flex flex-wrap gap-3 sm:col-span-2">
              {editable && (
                <button className={button} disabled={isLoading}>
                  {isLoading ? "در حال ذخیره…" : "ذخیره اطلاعات"}
                </button>
              )}
              {selected && allowed(selected.id) && (
                <button
                  type="button"
                  className={secondary}
                  disabled={isLoading}
                  onClick={() => start(selected.id)}
                >
                  افزودن زیرواحد
                </button>
              )}
              {selected && endpoint === "master/units" && (
                <button
                  type="button"
                  className={secondary + " text-rose-600"}
                  disabled={isLoading}
                  onClick={async () => {
                    if (!confirm("واحد انتخاب‌شده حذف شود؟")) return;
                    try {
                      await mutate({
                        url: endpoint + "/" + selected.id,
                        method: "DELETE",
                      }).unwrap();
                      setSelectedId(null);
                      setMessage("");
                      setSuccess("واحد حذف شد.");
                      setOpen(false);
                    } catch (err) {
                      setMessage(errorText(err));
                    }
                  }}
                >
                  حذف واحد
                </button>
              )}
              {
                <button
                  type="button"
                  className={secondary}
                  disabled={isLoading}
                  onClick={() => setOpen(false)}
                >
                  انصراف
                </button>
              }
            </div>
          </form>
        </DefinitionDialog>
      )}
    </>
  );
}
