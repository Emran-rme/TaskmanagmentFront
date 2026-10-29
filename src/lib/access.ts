import type { User, Task, Project, Workspace } from "./types";

export const can = (u: User | null, p: string, company?: string) =>
  !!u && u.enabled !== false && (u.role === "Admin" || (company && u.companyPermissions
    ? !!u.companyPermissions[company]?.includes(p) : u.permissions.includes(p)));
export const manages = (u: User | null, company: string) =>
  !!u && (u.role === "Admin" || !!u.managedCompanies?.includes(company));
export const canProject = (u: User | null, permission: string, company: string,
  projectId: string | null | undefined, w: Workspace) =>
  can(u, permission, company) && (u?.role === "Admin" || !projectId
    || !!w.projectPermissions?.[projectId]?.includes(permission));
export const canEditTask = (u: User | null, t: Task, w: Workspace) =>
  canProject(u, "tasks.write", t.company, t.projectId, w)
  && (u?.role === "Admin" || t.approverId === u?.id || (t.assigneeIds?.length ? t.assigneeIds : [t.assigneeId]).includes(u?.id || 0)
    || (t.projectId ? w.projects.some(p => p.id === t.projectId && p.managerId === u?.id) : manages(u, t.company)));
export const canCloseTask = (u: User | null, t: Task, w: Workspace) =>
  canProject(u, "tasks.write", t.company, t.projectId, w) && t.approverId === u?.id;
export const canReassignTask = (u: User | null, t: Task, w: Workspace) =>
  canEditTask(u, t, w) && (u?.role === "Admin" || t.approverId === u?.id
    || (t.projectId ? w.projects.some(p => p.id === t.projectId && p.managerId === u?.id) : manages(u, t.company)));
export const canManageProject = (u: User | null, p: Project, w: Workspace) =>
  canProject(u, "projects.write", p.company, p.id, w) && (u?.role === "Admin" || p.managerId === u?.id);
