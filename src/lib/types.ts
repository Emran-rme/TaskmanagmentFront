export interface User {
  assignable?: boolean;
  companyPermissions?: Record<string, string[]>;
  managedCompanies?: string[];
  companies?: string[];
  position?: string;
  unit?: string;
  roleNames?: string[];
  id: number;
  username: string;
  name: string;
  role: string;
  permissions: string[];
  enabled: boolean;
  authSource: string;
  ldapUsername?: string;
  personnelId?: string;
  company?: string;
}
export interface Task {
  createdAt?: string;
  id: string;
  code: string;
  title: string;
  projectId: string;
  parentTaskId?: string;
  company: string;
  unit: string;
  management: string;
  assigneeId: number;
  assigneeIds?: number[];
  kanbanColumnId?: string;
  approverId?: number;
  start: string;
  due: string;
  estimate: number;
  source: string;
  priority: string;
  status: string;
  progress: number;
  description: string;
  expectedOutput: string;
  deliveredOutput: string;
  blocker: string;
  quality: number;
  version: string;
}
export const defaultRequestSources = ["صورتجلسه", "کمیته", "دستور"];
export const assignedIds = (task: Task): number[] =>
  task.assigneeIds?.length ? task.assigneeIds : [task.assigneeId];
export const assignedNames = (task: Task, users: User[]) =>
  assignedIds(task)
    .map((id) => users.find((user) => user.id === id)?.name || "کاربر ثبت‌شده")
    .join("، ");
export interface TaskAttachment {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  reportId?: string;
  uploadedBy?: number;
}
export interface TaskReport {
  id: string;
  text: string;
  authorId: number;
  createdAt: string;
  mentionIdsJson: string;
}
export interface TaskHistory {
  id: string;
  action: string;
  actorId: number;
  createdAt: string;
  status: string;
  progress: number;
  previousStatus?: string;
  previousProgress?: number;
  changesJson?: string;
}
export interface Project {
  requestSources?: string[];
  company: string;
  unit: string;
  description: string;
  coverColor: string;
  coverImage: string;
  id: string;
  name: string;
  code: string;
  sponsor: string;
  managerId: number;
  supervisorId?: number;
  requesterId?: number;
  start: string;
  end: string;
  budget: number;
  status: string;
}
export interface Settings {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  reminder: number;
  approval: boolean;
}
export interface Workspace {
  projectMembers?: {projectId: string; userId: number; roleId: string}[];
  organization?: {
    id: string;
    code?: string;
    parentId?: string;
    name: string;
    type: string;
  }[];
  tasks: Task[];
  projects: Project[];
  users: User[];
  settings: Settings;
  companies: string[];
  units: string[];
  statuses: string[];
  priorities: string[];
}
export const statuses = ["جدید", "در حال انجام", "حل شده", "بسته شده"];
