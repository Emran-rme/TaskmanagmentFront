import type { User } from "./types";
import { can } from "../store";

export const canViewWorkspace = (user: User | null) =>
  [
    "tasks.read",
    "projects.read",
    "organization.read",
    "organization.write",
  ].some((permission) => can(user, permission));

export function canVisit(user: User | null, path: string): boolean {
  if (!user || user.enabled === false) return false;
  if (path === "/" || path === "/select-context") return canViewWorkspace(user);
  if (path === "/master") return user.role === "Admin" && user.company === "*";
  if (path === "/modules" || path === "/workflows") return user.role === "Admin";
  if (path === "/settings")
    return can(user, "settings.read") && canViewWorkspace(user);
  if (path === "/notifications") return can(user, "notifications.read");
  if (path === "/users")
    return (
      user.company === "*" &&
      (can(user, "users.read") || can(user, "users.write")) &&
      canViewWorkspace(user)
    );
  if (path === "/trash")
    return [
      "users",
      "projects",
      "tasks",
      "history",
      "extensions",
      "files",
      "notifications",
      "reports",
    ].some(
      (module) =>
        can(user, module + ".delete") || can(user, module + ".restore"),
    );
  if (path === "/organization") return can(user,"organization.read") || can(user,"organization.write");
  if (["/calendar", "/gantt", "/kanban"].includes(path))
    return can(user, "tasks.read");
  if (path.startsWith("/tasks"))
    return (
      can(user, "tasks.read") &&
      ((!path.endsWith("/new") && !path.endsWith("/edit")) ||
        can(user, "tasks.write"))
    );
  if (path.startsWith("/projects")) {
    const taskView = /\/(tasks|gantt|kanban|calendar)\/?$/.test(path);
    return can(user, "projects.read") && (!taskView || can(user, "tasks.read"));
  }
  return true;
}

export const firstAllowedPage = (user: User | null) =>
  [
    "/",
    "/tasks",
    "/projects",
    "/notifications",
    "/settings",
    "/master",
    "/users",
    "/modules",
    "/trash",
  ].find((path) => canVisit(user, path));
