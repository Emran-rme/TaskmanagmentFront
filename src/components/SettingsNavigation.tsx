import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  CalendarDays,
  ChartGantt,
  Columns3,
  Workflow,
  Users,
  Puzzle,
  Trash2,
  ArrowUpLeft,
} from "lucide-react";
import { can, type RootState } from "../store";
import { canVisit } from "../lib/navigationAccess";

export default function SettingsNavigation() {
  const user = useSelector((s: RootState) => s.auth.user);
  const links = [
    {
      path: "/calendar",
      label: "تقویم شمسی",
      icon: CalendarDays,
      visible: true,
    },
    { path: "/gantt", label: "نمودار گانت", icon: ChartGantt, visible: true },
    { path: "/kanban", label: "برد کانبان", icon: Columns3, visible: true },
    {
      path: "/organization",
      label: "هولدینگ و شرکت‌ها",
      icon: Workflow,
      visible: true,
    },
    {
      path: "/users",
      label: "کاربران و دسترسی",
      icon: Users,
      visible:
        user?.company === "*" &&
        ["read", "write", "delete", "restore"].some((a) =>
          can(user, "users." + a),
        ),
    },
    {
      path: "/modules",
      label: "مدیریت ماژول‌ها",
      icon: Puzzle,
      visible: user?.role === "Admin",
    },
    {
      path: "/trash",
      label: "سطل بازیافت",
      icon: Trash2,
      visible: [
        "users",
        "projects",
        "tasks",
        "history",
        "extensions",
        "files",
        "notifications",
        "reports",
      ].some((m) => can(user, m + ".delete") || can(user, m + ".restore")),
    },
  ];
  return (
    <section
      className="settings-shortcuts"
      aria-labelledby="settings-shortcuts-title"
    >
      <h2 id="settings-shortcuts-title">بخش‌های تکمیلی سامانه</h2>
      <nav className="settings-navigation" aria-label="امکانات تکمیلی">
        {links
          .filter((link) => link.visible && canVisit(user, link.path))
          .map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path}>
              <Icon size={17} strokeWidth={1.6} />
              <span>{label}</span>
              <ArrowUpLeft
                className="shortcut-arrow"
                size={14}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            </Link>
          ))}
      </nav>
    </section>
  );
}
