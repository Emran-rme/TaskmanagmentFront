import { useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";
import PersonPicker from "./PersonPicker";
import {
  useWorkspaceQuery,
  useProjectRolesQuery,
  useMutateMutation,
  errorText,
} from "../store";
import { Card, button, secondary, input, ErrorBox, Loading } from "./ui";
import type { Project } from "../lib/types";
import { matchesPerson } from "../lib/personSearch";

export default function ProjectMembers({ project }: { project: Project }) {
  const { data: w } = useWorkspaceQuery();
  const actor = useSelector((state: RootState) => state.auth.user);
  const [success, setSuccess] = useState("");
  const { data: roles, error: roleError } = useProjectRolesQuery();
  const [mutate, { isLoading }] = useMutateMutation();
  const [error, setError] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [draft, setDraft] = useState<
    { userId: number; roleId: string }[] | null
  >(null);
  if (roleError) return <ErrorBox message={errorText(roleError)} />;
  if (!w || !roles) return <Loading />;
  const members =
    draft ?? w.projectMembers?.filter((m) => m.projectId === project.id) ?? [];
  const availableUsers = w.users.filter(
    (u) =>
      u.assignable !== false &&
      (u.projectCompanies ?? u.companies)?.includes(project.company) &&
      !members.some((m) => m.userId === u.id),
  );
  const matchingUsers = availableUsers.filter((u) =>
    matchesPerson(u, memberSearch),
  );
  const managers = w.users.filter(
    (u) =>
      u.enabled !== false &&
      (u.assignable !== false || u.id === project.managerId) &&
      (u.projectCompanies ?? u.companies)?.includes(project.company),
  );
  async function assignManager(managerId: number) {
    setError("");
    setSuccess("");
    try {
      await mutate({
        url: `projects/${project.id}/manager`,
        method: "PUT",
        body: { managerId, expectedManagerId: project.managerId },
      }).unwrap();
      setSuccess("مدیر پروژه ذخیره شد و عضویت مدیریتی او برقرار است.");
    } catch (err) {
      setError(errorText(err));
    }
  }
  return (
    <Card title="اعضا و نقش‌های پروژه">
      <p className="mb-4 text-sm">
        فقط اعضای تعریف‌شده با مجوز نقش خود به پروژه دسترسی دارند. مسئول وظیفه
        باید عضو پروژه باشد.
      </p>
      {error && <ErrorBox message={error} />}
      {success && (
        <p
          role="status"
          className="mb-4 rounded border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
        >
          {success}
        </p>
      )}
      <form
        key={`manager-${project.managerId}`}
        className="mb-6 space-y-4 rounded-xl border border-sky-200 p-4 dark:border-slate-600"
        onSubmit={(e) => {
          e.preventDefault();
          void assignManager(
            Number(new FormData(e.currentTarget).get("managerId")),
          );
        }}
      >
        <h3 className="font-bold">مدیر اصلی پروژه</h3>
        <p className="text-sm leading-7">
          مدیر فعلی:{" "}
          <strong>
            {w.users.find((u) => u.id === project.managerId)?.name ||
              project.managerId}
          </strong>
          . تعیین نقش اعضا، مدیر اصلی پروژه را تغییر نمی‌دهد؛ برای تغییر مدیر از
          همین بخش استفاده کنید.
        </p>
        <fieldset disabled={isLoading || draft !== null} className="space-y-4">
          <PersonPicker
            name="managerId"
            label="انتخاب مدیر پروژه"
            users={managers}
            defaultValue={project.managerId}
          />
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={button}>
              ذخیره مدیر پروژه
            </button>
            {actor &&
              managers.some((u) => u.id === actor.id) &&
              actor.id !== project.managerId && (
                <button
                  type="button"
                  className={secondary}
                  onClick={() => void assignManager(actor.id)}
                >
                  انتخاب خودم به‌عنوان مدیر پروژه
                </button>
              )}
          </div>
        </fieldset>
        {draft !== null && (
          <p
            role="status"
            className="text-xs text-amber-700 dark:text-amber-300"
          >
            ابتدا تغییرات اعضا را ذخیره کنید تا بتوانید مدیر پروژه را تغییر
            دهید.
          </p>
        )}
      </form>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            setError("");
            setSuccess("");
            await mutate({
              url: `projects/${project.id}/members`,
              method: "PUT",
              body: members,
            }).unwrap();
            setDraft(null);
            setSuccess("اعضا و نقش‌های پروژه ذخیره شدند.");
          } catch (err) {
            setError(errorText(err));
          }
        }}
      >
        {members.map((member, index) => (
          <div
            key={member.userId}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="min-w-36">
              {w.users.find((u) => u.id === member.userId)?.name ||
                member.userId}
            </span>
            {member.userId === project.managerId ? (
              <span className="rounded bg-sky-50 p-2 text-sm text-sky-800 dark:bg-slate-800 dark:text-sky-200">
                مدیر اصلی پروژه · عضویت مدیریتی محفوظ است
              </span>
            ) : (
              <>
                <details
                  className="project-member-role w-full"
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node))
                      e.currentTarget.open = false;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      e.currentTarget.open = false;
                      e.currentTarget.querySelector("summary")?.focus();
                    }
                  }}
                >
                  <summary className={input} aria-label="نقش عضو پروژه">
                    {roles.find((r) => r.id === member.roleId)?.name ||
                      "انتخاب نقش"}
                  </summary>
                  <fieldset className="project-member-role-options">
                    <legend className="sr-only">نقش عضو پروژه</legend>
                    {roles.length === 0 && <p>نقشی تعریف نشده است.</p>}
                    {roles.map((r) => (
                      <label key={r.id}>
                        <input
                          type="radio"
                          name={`member-role-${member.userId}`}
                          value={r.id}
                          required
                          checked={member.roleId === r.id}
                          onChange={() =>
                            setDraft(
                              members.map((m, i) =>
                                i === index ? { ...m, roleId: r.id } : m,
                              ),
                            )
                          }
                          onInvalid={(e) => {
                            const details = e.currentTarget.closest("details");
                            if (details) details.open = true;
                          }}
                        />
                        <span>{r.name}</span>
                      </label>
                    ))}
                  </fieldset>
                </details>
                <button
                  type="button"
                  className={secondary}
                  onClick={() =>
                    setDraft(members.filter((_, i) => i !== index))
                  }
                >
                  حذف از پروژه
                </button>
              </>
            )}
          </div>
        ))}
        <fieldset
          className="rounded border p-3"
          style={{ borderColor: "var(--line)" }}
        >
          <legend className="px-2">افزودن عضو پروژه</legend>
          <p className="mb-2 text-sm">
            عضو موردنظر را پیدا کنید و «افزودن» را بزنید؛ سپس نقش او را انتخاب و
            اعضا را ذخیره کنید.
          </p>
          <input
            aria-label="جستجوی عضو جدید"
            className={input}
            placeholder="جستجو با نام یا نام کاربری…"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
          />
          <div
            className="mt-2 max-h-64 space-y-2 overflow-y-auto"
            aria-label="افراد قابل افزودن"
          >
            {matchingUsers.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b py-2"
                style={{ borderColor: "var(--line)" }}
              >
                <div>
                  <strong>{u.name}</strong>
                  <p className="text-xs">
                    {[u.username, u.position, u.unit]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  className={secondary}
                  aria-label={`افزودن ${u.name}`}
                  onClick={() => {
                    setDraft([...members, { userId: u.id, roleId: "" }]);
                    setMemberSearch("");
                  }}
                >
                  افزودن
                </button>
              </div>
            ))}
            {!matchingUsers.length && (
              <p className="py-3 text-sm" role="status">
                {availableUsers.length
                  ? "عضوی با این جستجو پیدا نشد."
                  : "کاربر دیگری از شرکت پروژه برای افزودن وجود ندارد. کاربران و دسترسی شرکت آن‌ها را در اطلاعات پایه بررسی کنید."}
              </p>
            )}
          </div>
        </fieldset>
        <button className={button} disabled={isLoading}>
          ذخیره اعضا
        </button>
      </form>
    </Card>
  );
}
