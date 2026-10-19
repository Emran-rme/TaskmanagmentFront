import { useState } from "react";
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
    (u) => u.companies?.includes(project.company) &&
      !members.some((m) => m.userId === u.id),
  );
  const matchingUsers = availableUsers.filter((u) => matchesPerson(u, memberSearch));
  return (
    <Card title="اعضا و نقش‌های پروژه">
      <p className="mb-4 text-sm">
        فقط اعضای تعریف‌شده با مجوز نقش خود به پروژه دسترسی دارند. مسئول وظیفه
        باید عضو پروژه باشد.
      </p>
      {error && <ErrorBox message={error} />}
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            setError("");
            await mutate({
              url: `projects/${project.id}/members`,
              method: "PUT",
              body: members,
            }).unwrap();
            setDraft(null);
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
                {roles.find((r) => r.id === member.roleId)?.name || "انتخاب نقش"}
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
                        setDraft(members.map((m, i) =>
                          i === index ? { ...m, roleId: r.id } : m,
                        ))
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
              onClick={() => setDraft(members.filter((_, i) => i !== index))}
            >
              حذف از پروژه
            </button>
          </div>
        ))}
        <fieldset className="rounded border p-3" style={{ borderColor: "var(--line)" }}>
          <legend className="px-2">افزودن عضو پروژه</legend>
          <p className="mb-2 text-sm">عضو موردنظر را پیدا کنید و «افزودن» را بزنید؛ سپس نقش او را انتخاب و اعضا را ذخیره کنید.</p>
          <input
            aria-label="جستجوی عضو جدید"
            className={input}
            placeholder="جستجو با نام یا نام کاربری…"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
          />
          <div className="mt-2 max-h-64 space-y-2 overflow-y-auto" aria-label="افراد قابل افزودن">
            {matchingUsers.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 border-b py-2" style={{ borderColor: "var(--line)" }}>
                <div>
                  <strong>{u.name}</strong>
                  <p className="text-xs">{[u.username, u.position, u.unit].filter(Boolean).join(" · ")}</p>
                </div>
                <button type="button" className={secondary} aria-label={`افزودن ${u.name}`} onClick={() => {
                  setDraft([...members, { userId: u.id, roleId: "" }]);
                  setMemberSearch("");
                }}>افزودن</button>
              </div>
            ))}
            {!matchingUsers.length && <p className="py-3 text-sm" role="status">
              {availableUsers.length
                ? "عضوی با این جستجو پیدا نشد."
                : "کاربر دیگری از شرکت پروژه برای افزودن وجود ندارد. کاربران و دسترسی شرکت آن‌ها را در اطلاعات پایه بررسی کنید."}
            </p>}
          </div>
        </fieldset>
        <button className={button} disabled={isLoading}>
          ذخیره اعضا
        </button>
      </form>
    </Card>
  );
}
