import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  Pencil,
  ShieldCheck,
  UserRound,
  UsersRound,
  CheckCircle2,
  Link2,
  ChevronLeft,
  ChevronRight,
  KeyRound,
} from "lucide-react";
import UserRoleAssignments, {
  type AssignmentData,
} from "../components/UserRoleAssignments";
import { useMasterQuery } from "../store";
import { SelectionToggle } from "../components/CheckboxList";
import DefinitionDialog from "../components/DefinitionDialog";
import DefinitionPicker from "../components/DefinitionPicker";
import { useState } from "react";
import { useSelector } from "react-redux";
import { can, type RootState } from "../store";
import { useUsersQuery, useMutateMutation, errorText } from "../store";
import { User } from "../lib/types";
import DeleteButton from "../components/DeleteButton";
import {
  Card,
  Field,
  input,
  button,
  secondary,
  Loading,
  ErrorBox,
} from "../components/ui";
const modules = [
  ["tasks", "وظایف"],
  ["projects", "پروژه‌ها"],
  ["notifications", "اعلان‌ها"],
  ["settings", "تنظیمات"],
  ["users", "کاربران"],
  ["history", "تاریخچه"],
  ["extensions", "تمدیدها"],
  ["files", "پیوست‌ها"],
  ["reports", "گزارش‌های پیگیری"],
  ["organization", "شرکت و دپارتمان"],
];
const roleLabels: Record<string, string> = {
  Admin: "مدیر سامانه",
  Manager: "مدیر",
  Member: "عضو تیم",
  Viewer: "ناظر",
};
const normalize = (text: string) =>
  text
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[آأإ]/g, "ا")
    .replace(/[\s‌]+/g, "")
    .toLowerCase();
export default function Users({
  organizationData,
}: { organizationData?: AssignmentData } = {}) {
  const actor = useSelector((s: RootState) => s.auth.user);
  const writable = actor?.role === "Admin";
  const fullAdmin = writable && actor?.company === "*";
  const { data: masterData } = useMasterQuery(undefined, {
    skip: !!organizationData || !fullAdmin,
  });
  const organization: AssignmentData | undefined =
    organizationData || masterData;
  const [assignmentUserId, setAssignmentUserId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [authFilter, setAuthFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const { data: users, error } = useUsersQuery(),
    [mutate, { isLoading }] = useMutateMutation(),
    [editing, Edit] = useState<User | null | undefined>(undefined),
    [message, M] = useState(""),
    [role, R] = useState("Member"),
    [permissions, P] = useState<string[]>([
      "tasks.read",
      "tasks.write",
      "projects.read",
      "notifications.read",
      "notifications.write",
    ]);
  if (error) return <ErrorBox message={errorText(error)} />;
  if (!users) return <Loading />;
  function open(u: User | null) {
    Edit(u);
    R(u?.role || "Member");
    P(
      u?.permissions || [
        "tasks.read",
        "tasks.write",
        "projects.read",
        "notifications.read",
        "notifications.write",
      ],
    );
    M("");
  }
  const roleNames = (id: number) =>
    organization?.assignments
      .filter((a) => a.userId === id)
      .map((a) => organization.roles.find((role) => role.id === a.roleId)?.name)
      .filter(Boolean) as string[] | undefined;
  const person = (user: User) =>
    organization?.personnel.find(
      (p) =>
        p.id ===
        (organization.users.find((u) => u.id === user.id)?.personnelId ||
          user.personnelId),
    );
  const filtered = users.filter(
    (user) =>
      (status === "all" || user.enabled === (status === "active")) &&
      (authFilter === "all" || user.authSource === authFilter) &&
      (roleFilter === "all" || user.role === roleFilter) &&
      normalize(
        [
          user.name,
          user.username,
          person(user)?.name,
          ...(roleNames(user.id) || []),
        ].join(" "),
      ).includes(normalize(search)),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const attention = organization
    ? users.filter((user) => !person(user) || !roleNames(user.id)?.length)
        .length
    : undefined;
  const clear = () => {
    setSearch("");
    setStatus("all");
    setAuthFilter("all");
    setRoleFilter("all");
    setPage(1);
  };
  const actions = (user: User) => (
    <div className="users-row-actions">
      {writable && (
        <button
          type="button"
          className={secondary}
          onClick={() => open(user)}
          aria-label={"ویرایش حساب " + user.name}
        >
          <Pencil size={14} />
          ویرایش حساب
        </button>
      )}
      {fullAdmin && organization && (
        <button
          type="button"
          className={secondary}
          onClick={() => setAssignmentUserId(user.id)}
          aria-label={"نقش‌ها و پرونده " + user.name}
        >
          <ShieldCheck size={14} />
          نقش‌ها و پرونده
        </button>
      )}
      <DeleteButton entity="users" id={user.id} label={user.name} />
    </div>
  );
  return (
    <div className="users-management space-y-5">
      <div className="users-page-heading">
        <div>
          <h2 className="text-xl font-bold text-navy dark:text-sky-50">
            کاربران و سطح دسترسی
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            مدیریت حساب، نقش‌ها و اتصال پرونده پرسنلی در یک فهرست
          </p>
        </div>
        {writable && (
          <button className={button} onClick={() => open(null)}>
            <Plus size={16} />
            تعریف کاربر جدید
          </button>
        )}
      </div>
      {message && <ErrorBox message={message} />}{" "}
      {editing !== undefined && (
        <DefinitionDialog
          navigator={
            <DefinitionPicker
              title="کاربر"
              items={users.map((user) => ({
                ...user,
                subtitle: user.username,
              }))}
              selectedId={editing?.id}
              busy={isLoading}
              onSelect={(id) => open(users.find((user) => user.id === id)!)}
              onCreate={() => open(null)}
              createLabel="تعریف کاربر جدید"
            />
          }
          title={editing ? "ویرایش کاربر" : "کاربر جدید"}
          onClose={() => Edit(undefined)}
          busy={isLoading}
        >
          <p className="mb-4 text-xs leading-7 text-slate-500">
            مشخصات ورود و مجوزهای حساب در این بخش است. برای انتساب نقش سازمانی و
            پرونده پرسنلی، از «نقش‌ها و پرونده» در فهرست کاربران استفاده کنید.
          </p>
          {message && <ErrorBox message={message} />}
          <form
            key={editing?.id || "new"}
            className="definition-form grid gap-4 md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = Object.fromEntries(new FormData(e.currentTarget));
              try {
                await mutate({
                  url: "admin/users" + (editing ? "/" + editing.id : ""),
                  method: editing ? "PUT" : "POST",
                  body: {
                    ...f,
                    role,
                    enabled: f.enabled === "on",
                    permissions,
                  },
                }).unwrap();
                Edit(undefined);
                M("");
              } catch (err) {
                M(errorText(err));
              }
            }}
          >
            {[
              ["نام نمایشی", "name", editing?.name],
              ["نام کاربری", "username", editing?.username],
              ["شناسه دایرکتوری LDAP", "ldapUsername", editing?.ldapUsername],
            ].map(([l, n, v]) => (
              <Field label={l || ""} key={n}>
                <input
                  className={input}
                  name={n}
                  defaultValue={v || ""}
                  required={n !== "ldapUsername"}
                />
              </Field>
            ))}
            <Field label="نقش پایه حساب">
              <select
                name="role"
                className={input}
                value={role}
                onChange={(e) => {
                  const role = e.target.value;
                  R(role);
                  P(
                    role === "Admin"
                      ? []
                      : role === "Manager"
                        ? modules
                            .filter(([m]) => m !== "users")
                            .flatMap(([m]) => [m + ".read", m + ".write"])
                        : [
                            "tasks.read",
                            "projects.read",
                            "notifications.read",
                            ...(role === "Member"
                              ? ["tasks.write", "notifications.write"]
                              : []),
                          ],
                  );
                }}
              >
                {["Admin", "Manager", "Member", "Viewer"].map((r) => (
                  <option key={r} value={r}>
                    {roleLabels[r] || r}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="روش احراز هویت">
              <select
                name="authSource"
                className={input}
                defaultValue={editing?.authSource || "local"}
              >
                <option value="local">داخلی</option>
                <option value="ldap">LDAP</option>
              </select>
            </Field>
            <Field label="رمز جدید (حداقل ۸ نویسه؛ برای LDAP خالی)">
              <input
                className={input}
                name="password"
                type="password"
                autoComplete="new-password"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={editing?.enabled ?? true}
              />
              حساب فعال
            </label>
            <div className="md:col-span-2">
              <h3 className="mb-3 text-sm font-bold">مجوزهای کاربر</h3>
              {role === "Admin" ? (
                <p className="text-xs text-slate-400">
                  مدیر سیستم به تمام امکانات دسترسی دارد.
                </p>
              ) : (
                <div>
                  <SelectionToggle
                    values={modules.flatMap(([module]) =>
                      (module === "settings"
                        ? ["read", "write"]
                        : ["history", "extensions", "files"].includes(module)
                          ? ["delete", "restore"]
                          : ["read", "write", "delete", "restore"]
                      ).map((action) => module + "." + action),
                    )}
                    selected={permissions}
                    onChange={P}
                    disabled={isLoading}
                  />
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {modules.map(([module, label]) => (
                      <div
                        key={module}
                        className="space-y-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 p-3"
                      >
                        <h4 className="text-xs font-bold">{label}</h4>
                        <SelectionToggle
                          label="انتخاب همه این بخش"
                          values={(module === "settings"
                            ? ["read", "write"]
                            : ["history", "extensions", "files"].includes(
                                  module,
                                )
                              ? ["delete", "restore"]
                              : ["read", "write", "delete", "restore"]
                          ).map((action) => module + "." + action)}
                          selected={permissions}
                          onChange={P}
                          disabled={isLoading}
                        />
                        {(module === "settings"
                          ? ["read", "write"]
                          : ["history", "extensions", "files"].includes(module)
                            ? ["delete", "restore"]
                            : ["read", "write", "delete", "restore"]
                        ).map((action) => {
                          const p = module + "." + action;
                          return (
                            <label
                              key={p}
                              className="flex items-center gap-2 text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={permissions.includes(p)}
                                onChange={(e) =>
                                  P(
                                    e.target.checked
                                      ? [...permissions, p]
                                      : permissions.filter((x) => x !== p),
                                  )
                                }
                              />
                              {
                                {
                                  read: "مشاهده",
                                  write: "ایجاد / تغییر",
                                  delete: "حذف",
                                  restore: "بازیابی",
                                }[action]
                              }
                            </label>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="definition-actions flex gap-2 md:col-span-2">
              <button disabled={isLoading} className={button}>
                {isLoading ? "در حال ذخیره…" : "ذخیره کاربر"}
              </button>
              <button
                type="button"
                className={secondary}
                disabled={isLoading}
                onClick={() => Edit(undefined)}
              >
                انصراف
              </button>
            </div>
          </form>
        </DefinitionDialog>
      )}
      {organization && assignmentUserId !== null && (
        <UserRoleAssignments
          data={organization}
          userId={assignmentUserId}
          onClose={() => setAssignmentUserId(null)}
          onSelectUser={setAssignmentUserId}
        />
      )}
      <div className="users-statistics">
        {[
          { label: "کل کاربران", value: users.length, Icon: UsersRound },
          {
            label: "حساب فعال",
            value: users.filter((user) => user.enabled).length,
            Icon: CheckCircle2,
          },
          {
            label: "متصل به پرونده",
            value: organization
              ? users.filter((user) => person(user)).length
              : undefined,
            Icon: Link2,
          },
          {
            label: "نیازمند تکمیل انتساب",
            value: attention,
            Icon: ShieldCheck,
          },
        ].map(({ label, value, Icon }) => (
          <div key={label}>
            <span className="users-stat-icon">
              <Icon size={20} />
            </span>
            <div>
              <strong>
                {value === undefined ? "—" : value.toLocaleString("fa-IR")}
              </strong>
              <p>{label}</p>
            </div>
          </div>
        ))}
      </div>
      <Card className="users-directory">
        <div className="users-filters">
          <label className="users-search">
            <Search size={17} />
            <input
              className={input}
              aria-label="جستجوی کاربران"
              placeholder="جستجوی نام، نام کاربری یا نقش…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <select
            className={input}
            aria-label="فیلتر وضعیت حساب"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="active">فعال</option>
            <option value="inactive">غیرفعال</option>
          </select>
          <select
            className={input}
            aria-label="فیلتر نوع نقش"
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">همه نقش‌های پایه</option>
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className={input}
            aria-label="فیلتر روش ورود"
            value={authFilter}
            onChange={(event) => {
              setAuthFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="all">همه روش‌های ورود</option>
            <option value="local">حساب داخلی</option>
            <option value="ldap">دایرکتوری LDAP</option>
          </select>
          {(search ||
            status !== "all" ||
            authFilter !== "all" ||
            roleFilter !== "all") && (
            <button type="button" className={secondary} onClick={clear}>
              پاک کردن فیلترها
            </button>
          )}
        </div>
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                {[
                  "کاربر",
                  "نقش و دسترسی",
                  "پرونده پرسنلی",
                  "روش ورود",
                  "وضعیت",
                  "عملیات",
                ].map((label) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="users-identity">
                      <span className="users-avatar">
                        {user.name.trim().charAt(0)}
                      </span>
                      <div>
                        <strong>{user.name}</strong>
                        <small dir="ltr">{user.username}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="users-role">
                      {roleLabels[user.role] || user.role}
                    </span>
                    <small className="users-role-detail">
                      {roleNames(user.id)?.join("، ") ||
                        (organization ? "نقش سازمانی تخصیص نیافته" : "")}
                    </small>
                  </td>
                  <td>
                    <span
                      className={
                        person(user)
                          ? "users-person-linked"
                          : "users-person-missing"
                      }
                    >
                      {person(user) ? (
                        <Link2 size={14} />
                      ) : (
                        <UserRound size={14} />
                      )}{" "}
                      {person(user)?.name ||
                        (organization ? "بدون اتصال" : "—")}
                    </span>
                  </td>
                  <td>
                    <span className="users-auth">
                      <KeyRound size={14} />
                      {user.authSource === "ldap" ? "LDAP" : "حساب داخلی"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        "users-status " +
                        (user.enabled ? "is-active" : "is-inactive")
                      }
                    >
                      {user.enabled ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                  <td>{actions(user)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="users-mobile-list">
          {visible.map((user) => (
            <article key={user.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="users-identity">
                  <span className="users-avatar">
                    {user.name.trim().charAt(0)}
                  </span>
                  <div>
                    <strong>{user.name}</strong>
                    <small dir="ltr">{user.username}</small>
                  </div>
                </div>
                <span
                  className={
                    "users-status " +
                    (user.enabled ? "is-active" : "is-inactive")
                  }
                >
                  {user.enabled ? "فعال" : "غیرفعال"}
                </span>
              </div>
              <div className="users-mobile-meta">
                <span className="users-role">
                  {roleLabels[user.role] || user.role}
                </span>
                <span>
                  {user.authSource === "ldap" ? "LDAP" : "حساب داخلی"}
                </span>
                <span>
                  {person(user)?.name ||
                    (organization ? "بدون اتصال به پرونده" : "")}
                </span>
              </div>
              {roleNames(user.id)?.length ? (
                <p className="mb-3 text-xs text-slate-500">
                  {roleNames(user.id)?.join("، ")}
                </p>
              ) : null}
              {actions(user)}
            </article>
          ))}
        </div>
        {!filtered.length && (
          <div className="users-empty">
            <UsersRound size={32} />
            <h3>کاربری یافت نشد</h3>
            <p>نام یا فیلترهای جستجو را تغییر دهید.</p>
            <button type="button" className={secondary} onClick={clear}>
              نمایش همه کاربران
            </button>
          </div>
        )}
        <div className="users-pagination">
          <span>
            {filtered.length.toLocaleString("fa-IR")} کاربر · صفحه{" "}
            {currentPage.toLocaleString("fa-IR")} از{" "}
            {pages.toLocaleString("fa-IR")}
          </span>
          <div>
            <button
              type="button"
              className={secondary}
              disabled={currentPage <= 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ChevronRight size={14} />
              قبلی
            </button>
            <button
              type="button"
              className={secondary}
              disabled={currentPage >= pages}
              onClick={() => setPage(currentPage + 1)}
            >
              بعدی
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>
      </Card>
      <details className="users-ldap-help">
        <summary>
          <KeyRound size={16} />
          راهنمای اتصال LDAP
        </summary>
        <p>
          حساب‌های LDAP با اطلاعات دایرکتوری سازمان وارد می‌شوند. تنظیم سرور و
          اتصال در بخش تنظیمات سامانه انجام می‌شود.
        </p>
        <Link className={secondary} to="/settings">
          رفتن به تنظیمات
        </Link>
      </details>
    </div>
  );
}
