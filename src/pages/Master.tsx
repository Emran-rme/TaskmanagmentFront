import { useSearchParams } from "react-router-dom";
import CheckboxList from "../components/CheckboxList";
import OrganizationUnitEditor from "../components/OrganizationUnitEditor";
import OrganizationTreeSelect from "../components/OrganizationTreeSelect";
import DefinitionDialog from "../components/DefinitionDialog";
import DefinitionPicker from "../components/DefinitionPicker";
import { lazy, useState } from "react";
import { useSelector } from "react-redux";
import {
  useMasterQuery,
  useMutateMutation,
  errorText,
  RootState,
} from "../store";
import {
  Card,
  Field,
  input,
  button,
  secondary,
  Loading,
  ErrorBox,
} from "../components/ui";
const Users = lazy(() => import("./Users"));
const tabs = [
  ["units", "ساختار سازمانی"],
  ["personnel", "پرسنل"],
  ["accounts", "کاربران سامانه"],
  ["roles", "نقش‌ها و اختیارات"],
];
const permissions = [
  "tasks",
  "projects",
  "users",
  "notifications",
  "settings",
  "history",
  "extensions",
  "files",
  "reports",
  "organization",
].flatMap((m) =>
  (m === "settings"
    ? ["read", "write"]
    : ["read", "write", "delete", "restore"]
  ).map((a) => m + "." + a),
);
const labels: Record<string, string> = {
  tasks: "وظایف",
  projects: "پروژه‌ها",
  users: "کاربران",
  notifications: "اعلان‌ها",
  settings: "تنظیمات",
  history: "تاریخچه",
  extensions: "تمدید",
  files: "فایل‌ها",
  reports: "گزارش‌ها",
  organization: "شرکت و دپارتمان",
  read: "مشاهده",
  write: "ثبت و ویرایش",
  delete: "حذف",
  restore: "بازیابی",
};
export default function Master() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") || "units";
  const tab = tabs.some(([id]) => id === requestedTab) ? requestedTab : "units";
  const setTab = (id: string) =>
    setSearchParams(id === "units" ? {} : { tab: id });
  const admin = useSelector(
    (s: RootState) =>
      s.auth.user?.role === "Admin" && s.auth.user?.company === "*",
  );
  const { data: d, error } = useMasterQuery(undefined, { skip: !admin });
  const [mutate, { isLoading }] = useMutateMutation();
  const [assignmentCount, setAssignmentCount] = useState(1);
  const [editing, setEditing] = useState<any>(null),
    [open, setOpen] = useState(false),
    [message, setMessage] = useState("");
  if (!admin)
    return (
      <ErrorBox message="مدیریت اطلاعات پایه برای مدیر سامانه در محدوده کل گروه مجاز است." />
    );
  if (error) return <ErrorBox message={errorText(error)} />;
  if (!d) return <Loading />;
  const companies = d.units.filter((u: any) =>
    ["شرکت مادر", "شرکت تابعه"].includes(u.type),
  );
  const rows = tab === "accounts" ? [] : d[tab];
  const deleted =
    d[
      {
        units: "deletedUnits",
        personnel: "deletedPersonnel",
        roles: "deletedRoles",
      }[tab] || "deletedUnits"
    ];
  async function action(url: string, method: string, body?: unknown) {
    try {
      await mutate({ url, method, body }).unwrap();
      setMessage("");
      return true;
    } catch (e) {
      setMessage(errorText(e));
      return false;
    }
  }
  const text = (
    label: string,
    name: string,
    required = true,
    type = "text",
  ) => (
    <Field label={label}>
      <input
        key={editing?.id || "new"}
        className={input}
        name={name}
        defaultValue={editing?.[name] || ""}
        required={required}
        type={type}
      />
    </Field>
  );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-white">
            اطلاعات پایه
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            ساختار سازمانی، پرونده پرسنلی، کاربران و محدوده اختیارات
          </p>
        </div>
        {tab !== "accounts" && tab !== "units" && (
          <button
            className={button}
            onClick={() => {
              setEditing(null);
              setAssignmentCount(1);
              setMessage("");
              setOpen(true);
            }}
          >
            افزودن رکورد
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            className={tab === id ? button : secondary}
            onClick={() => {
              setTab(id);
              setOpen(false);
              setEditing(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {message && <ErrorBox message={message} />}
      {tab === "accounts" ? (
        <Users organizationData={d} />
      ) : (
        <>
          {tab === "units" && <OrganizationUnitEditor units={d.units} />}
          {open && (
            <DefinitionDialog
              title={
                (editing ? "ویرایش " : "تعریف ") +
                (tab === "roles" ? "نقش" : "پرونده پرسنلی")
              }
              navigator={
                <DefinitionPicker
                  title={tab === "roles" ? "نقش" : "پرسنل"}
                  items={rows.map((row: any) => ({
                    ...row,
                    subtitle: row.code || row.description,
                  }))}
                  selectedId={editing?.id}
                  busy={isLoading}
                  onSelect={(id) => {
                    setEditing(rows.find((row: any) => row.id === id));
                    setAssignmentCount(1);
                    setMessage("");
                  }}
                  onCreate={() => {
                    setEditing(null);
                    setAssignmentCount(1);
                    setMessage("");
                  }}
                  createLabel={
                    tab === "roles" ? "تعریف نقش جدید" : "تعریف پرسنل جدید"
                  }
                />
              }
              onClose={() => setOpen(false)}
              busy={isLoading}
            >
              {message && <ErrorBox message={message} />}

              <form
                key={tab + (editing?.id || "new")}
                className="definition-form grid gap-4 md:grid-cols-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  let body: any = Object.fromEntries(f);
                  if (tab === "units") body.parentId = body.parentId || null;
                  if (tab === "personnel") {
                    body.unitId = body.unitId || null;
                    body.assignments = Array.from(
                      {
                        length: Math.max(
                          assignmentCount,
                          JSON.parse(editing?.assignmentsJson || "[]").length,
                        ),
                      },
                      (_, i) => ({
                        company: f.get(`assignmentCompany${i}`),
                        unitId: f.get(`assignmentUnit${i}`) || null,
                        roleId: f.get(`assignmentRole${i}`) || null,
                      }),
                    ).filter((a) => a.company);
                  }
                  if (tab === "roles") {
                    body.permissions = f.getAll("permissions");
                    body.companies = f.getAll("companies");
                  }
                  if (
                    await action(
                      `master/${tab}` + (editing ? "/" + editing.id : ""),
                      editing ? "PUT" : "POST",
                      body,
                    )
                  )
                    setOpen(false);
                }}
              >
                {text(tab === "roles" ? "عنوان نقش" : "نام", "name")}
                {tab !== "roles" && (
                  <Field label="کد سیستمی">
                    <input
                      className={input}
                      name="code"
                      readOnly
                      value={editing?.code || ""}
                      placeholder="پس از ذخیره توسط سیستم ایجاد می‌شود"
                    />
                  </Field>
                )}
                {tab === "units" && (
                  <>
                    <Field label="نوع واحد">
                      <select
                        className={input}
                        name="type"
                        defaultValue={editing?.type || "واحد"}
                      >
                        {[
                          "شرکت مادر",
                          "شرکت تابعه",
                          "معاونت",
                          "مدیریت",
                          "اداره",
                          "واحد",
                          "دپارتمان",
                        ].map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="واحد بالادست">
                      <select
                        className={input}
                        name="parentId"
                        defaultValue={editing?.parentId || ""}
                      >
                        <option value="">بدون والد</option>
                        {d.units
                          .filter((u: any) => u.id !== editing?.id)
                          .map((u: any) => (
                            <option key={u.id} value={u.id}>
                              {u.name} · {u.code}
                            </option>
                          ))}
                      </select>
                    </Field>
                  </>
                )}
                {tab === "personnel" && (
                  <>
                    {text("سمت / عنوان شغلی", "position", false)}
                    {text("تلفن", "phone", false, "tel")}
                    {text("ایمیل", "email", false, "email")}
                    <Field label="وضعیت همکاری">
                      <select
                        className={input}
                        name="status"
                        defaultValue={editing?.status || "فعال"}
                      >
                        {["فعال", "غیرفعال", "مرخصی"].map((v) => (
                          <option key={v}>{v}</option>
                        ))}
                      </select>
                    </Field>
                    <OrganizationTreeSelect
                      label="واحد سازمانی"
                      name="unitId"
                      nodes={d.units}
                      allowedIds={d.units.map((u: any) => u.id)}
                      valueKey="id"
                      defaultValue={editing?.unitId || ""}
                    />
                    <div className="space-y-3 md:col-span-2">
                      <h3 className="font-bold">انتساب‌های سازمانی چندگانه</h3>
                      {Array.from(
                        {
                          length: Math.max(
                            assignmentCount,
                            JSON.parse(editing?.assignmentsJson || "[]").length,
                          ),
                        },
                        (_, i) => i,
                      ).map((i) => {
                        const a =
                          JSON.parse(editing?.assignmentsJson || "[]")[i] || {};
                        return (
                          <div key={i} className="grid gap-3 sm:grid-cols-3">
                            <Field label={`شرکت انتساب ${i + 1}`}>
                              <select
                                className={input}
                                name={`assignmentCompany${i}`}
                                defaultValue={a.Company || ""}
                              >
                                <option value="">بدون انتساب</option>
                                {companies.map((c: any) => (
                                  <option key={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </Field>
                            <Field label="واحد">
                              <select
                                className={input}
                                name={`assignmentUnit${i}`}
                                defaultValue={a.UnitId || ""}
                              >
                                <option value="">انتخاب واحد</option>
                                {d.units.map((u: any) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                            </Field>
                            <Field label="نقش سازمانی">
                              <select
                                className={input}
                                name={`assignmentRole${i}`}
                                defaultValue={a.RoleId || ""}
                              >
                                <option value="">انتخاب نقش</option>
                                {d.roles.map((r: any) => (
                                  <option key={r.id} value={r.id}>
                                    {r.name}
                                  </option>
                                ))}
                              </select>
                            </Field>
                          </div>
                        );
                      })}
                      <button
                        type="button"
                        className={secondary}
                        onClick={() =>
                          setAssignmentCount(
                            Math.max(
                              assignmentCount,
                              JSON.parse(editing?.assignmentsJson || "[]")
                                .length,
                            ) + 1,
                          )
                        }
                      >
                        افزودن انتساب سازمانی
                      </button>
                    </div>
                  </>
                )}
                {tab === "roles" && (
                  <>
                    <Field label="نوع نقش">
                      <select
                        name="baseRole"
                        className={input}
                        defaultValue={editing?.baseRole || "Member"}
                      >
                        {[
                          ["Admin", "مدیر سامانه"],
                          ["Manager", "مدیر پروژه / ارشد"],
                          ["Member", "عضو تیم"],
                          ["Viewer", "ناظر"],
                        ].map(([id, label]) => (
                          <option key={id} value={id}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    {text("شرح اختیارات", "description", false)}
                    <fieldset className="md:col-span-2">
                      <legend className="mb-3 text-sm font-bold">
                        محدوده شرکتی
                      </legend>
                      <CheckboxList
                        name="companies"
                        defaultValues={JSON.parse(
                          editing?.companiesJson || "[]",
                        )}
                        disabled={isLoading}
                        items={[
                          { value: "*", label: "کل گروه" },
                          ...companies.map((company: any) => ({
                            value: company.name,
                            label: company.name,
                          })),
                        ]}
                      />
                    </fieldset>
                    <fieldset className="md:col-span-2">
                      <legend className="mb-3 text-sm font-bold">مجوزها</legend>
                      <CheckboxList
                        name="permissions"
                        defaultValues={JSON.parse(
                          editing?.permissionsJson || "[]",
                        )}
                        disabled={isLoading}
                        items={permissions.map((permission) => ({
                          value: permission,
                          label: permission
                            .split(".")
                            .map((part) => labels[part])
                            .join(" / "),
                        }))}
                      />
                    </fieldset>
                  </>
                )}
                <div className="definition-actions flex gap-3 md:col-span-2">
                  <button disabled={isLoading} className={button}>
                    ذخیره اطلاعات
                  </button>
                  <button
                    type="button"
                    className={secondary}
                    onClick={() => setOpen(false)}
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </DefinitionDialog>
          )}
          {tab !== "units" && (
            <Card>
              <div className="overflow-auto">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="p-3">کد / نام</th>
                      <th>توضیحات</th>
                      <th>محدوده / وضعیت</th>
                      <th>عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r: any) => (
                      <tr
                        key={r.id}
                        className="border-b border-sky-100 dark:border-slate-700"
                      >
                        <td className="p-4">
                          <strong>{r.name}</strong>
                          <p className="text-xs text-slate-400">
                            {r.code || r.baseRole}
                          </p>
                        </td>
                        <td>
                          {r.type || r.email || r.description}
                          <p className="text-xs text-slate-400">
                            {r.phone ||
                              d.units.find((u: any) => u.id === r.parentId)
                                ?.name}
                          </p>
                        </td>
                        <td>
                          {r.status ||
                            (r.companiesJson &&
                              JSON.parse(r.companiesJson)
                                .map((c: string) => (c === "*" ? "کل گروه" : c))
                                .join("، ")) ||
                            "—"}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              className={secondary}
                              onClick={() => {
                                setEditing(r);
                                setOpen(true);
                              }}
                            >
                              ویرایش
                            </button>
                            <button
                              className="text-rose-600"
                              onClick={() => {
                                if (confirm("رکورد حذف شود؟"))
                                  void action(
                                    `master/${tab}/${r.id}`,
                                    "DELETE",
                                  );
                              }}
                            >
                              حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!rows.length && (
                  <p className="p-8 text-center text-slate-400">
                    رکوردی ثبت نشده است.
                  </p>
                )}
              </div>
            </Card>
          )}
          {!!deleted.length && (
            <Card title="رکوردهای حذف‌شده">
              {deleted.map((r: any) => (
                <div key={r.id} className="flex justify-between py-3">
                  <span>{r.name}</span>
                  <button
                    className={secondary}
                    onClick={() =>
                      void action(`master/${tab}/${r.id}/restore`, "POST")
                    }
                  >
                    بازیابی
                  </button>
                </div>
              ))}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
