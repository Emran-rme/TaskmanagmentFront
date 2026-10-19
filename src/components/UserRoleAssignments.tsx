import CheckboxList from "./CheckboxList";
import { useState } from "react";
import DefinitionDialog from "./DefinitionDialog";
import DefinitionPicker from "./DefinitionPicker";
import { Card, Field, input, button, secondary, ErrorBox } from "./ui";
import { useMutateMutation, errorText } from "../store";
export type AssignmentData = {
  users: { id: number; name: string; username: string; personnelId?: string }[];
  personnel: { id: string; name: string; code: string }[];
  roles: { id: string; name: string }[];
  assignments: { userId: number; roleId: string }[];
};
export default function UserRoleAssignments({
  data,
  userId,
  onClose,
  onSelectUser,
}: {
  data: AssignmentData;
  userId?: number | null;
  onClose?: () => void;
  onSelectUser?: (id: number) => void;
}) {
  const [internalSelectedId, setInternalSelectedId] = useState<number | null>(
    null,
  );
  const selectedId = userId === undefined ? internalSelectedId : userId;
  function setSelectedId(id: number | null) {
    if (userId === undefined) setInternalSelectedId(id);
    else if (id === null) onClose?.();
    else onSelectUser?.(id);
  }
  const [message, setMessage] = useState("");
  const [mutate, { isLoading }] = useMutateMutation();
  const selected = data.users.find((user) => user.id === selectedId);
  return (
    <>
      {userId === undefined && (
        <Card title="اتصال پرونده پرسنلی و نقش‌های مجاز">
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.users.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <span>
                  {user.name}
                  <small className="mr-3 text-slate-500">{user.username}</small>
                </span>
                <button
                  type="button"
                  className={secondary}
                  onClick={() => {
                    setSelectedId(user.id);
                    setMessage("");
                  }}
                >
                  ویرایش انتساب‌ها
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
      {selected && (
        <DefinitionDialog
          title="پرونده پرسنلی و نقش‌های کاربر"
          busy={isLoading}
          onClose={() => setSelectedId(null)}
          navigator={
            <DefinitionPicker
              title="کاربر"
              items={data.users.map((user) => ({
                ...user,
                subtitle: user.username,
              }))}
              selectedId={selected.id}
              busy={isLoading}
              onSelect={(id) => {
                setSelectedId(Number(id));
                setMessage("");
              }}
            />
          }
        >
          {message && <ErrorBox message={message} />}
          <form
            key={selected.id}
            className="definition-form grid gap-5 sm:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              try {
                await mutate({
                  url: `master/users/${selected.id}/roles`,
                  method: "PUT",
                  body: {
                    personnelId: form.get("personnelId") || null,
                    roleIds: form.getAll("roleIds"),
                  },
                }).unwrap();
                setSelectedId(null);
                setMessage("");
              } catch (error) {
                setMessage(errorText(error));
              }
            }}
          >
            <div className="sm:col-span-2">
              <strong>{selected.name}</strong>
              <p className="mt-1 text-xs text-slate-500">{selected.username}</p>
            </div>
            <div className="sm:col-span-2">
              <Field label="پرونده پرسنلی">
                <select
                  className={input}
                  name="personnelId"
                  defaultValue={selected.personnelId || ""}
                  disabled={isLoading}
                >
                  <option value="">بدون اتصال</option>
                  {data.personnel.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name} · {person.code}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <fieldset className="sm:col-span-2" disabled={isLoading}>
              <legend className="mb-3 text-sm font-bold">نقش‌های مجاز</legend>
              <CheckboxList
                name="roleIds"
                disabled={isLoading}
                items={data.roles.map((role) => ({
                  value: role.id,
                  label: role.name,
                }))}
                defaultValues={data.assignments
                  .filter((assignment) => assignment.userId === selected.id)
                  .map((assignment) => assignment.roleId)}
              />
            </fieldset>
            <p className="text-xs text-slate-500 sm:col-span-2">
              پس از تغییر نقش، کاربر باید دوباره وارد سامانه شود.
            </p>
            <div className="definition-actions flex gap-3 sm:col-span-2">
              <button className={button} disabled={isLoading}>
                ذخیره اطلاعات
              </button>
              <button
                type="button"
                className={secondary}
                disabled={isLoading}
                onClick={() => setSelectedId(null)}
              >
                انصراف
              </button>
            </div>
          </form>
        </DefinitionDialog>
      )}
    </>
  );
}
