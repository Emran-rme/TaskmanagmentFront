import { Fragment } from "react";
import {
  NavLink,
  Outlet,
  Link,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  LayoutDashboard,
  ClipboardList,
  CalendarCheck2,
  Bell,
  FolderKanban,
  Workflow,
  Database,
  Settings,
  Plus,
  RefreshCw,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { RootState, signedOut, api, can, useMutateMutation } from "../store";
import HeaderMenu from "./HeaderMenu";
import NotificationListener from "./NotificationListener";
import { useEffect, useState } from "react";
import { BRAND_ICON } from "../lib/branding";
import {
  canVisit,
  firstAllowedPage,
  canViewWorkspace,
} from "../lib/navigationAccess";
const nav = [
  ["/", "میز کار", LayoutDashboard, "work"],
  ["/inbox", "کارتابل وظایف", ClipboardList, "work"],
  ["/projects", "پروژه‌ها", FolderKanban, "work"],
  ["/tasks", "وظایف", ClipboardList, "work"],
  ["/todos", "کارهای روزانه", CalendarCheck2, "work"],
  ["/notifications", "اعلان‌ها", Bell, "work"],
  ["/workflows", "گردش‌کارها", Workflow, "management"],
  ["/master", "اطلاعات پایه", Database, "management"],
] as const;
export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem("tm-sidebar-collapsed") === "true"; }
    catch { return false; }
  });
  const user = useSelector((s: RootState) => s.auth.user);
  const dispatch = useDispatch(),
    navigate = useNavigate(),
    location = useLocation();
  const [mutate] = useMutateMutation();
  useEffect(() => {
    try { localStorage.setItem("tm-sidebar-collapsed", String(sidebarCollapsed)); } catch { /* Keep the session setting. */ }
  }, [sidebarCollapsed]);
  useEffect(() => {
    if (!/^\/tasks\/(new|[^/]+)(\/edit)?\/?$/.test(location.pathname))
      sessionStorage.setItem(
        "tm-task-origin",
        location.pathname + location.search,
      );
  }, [location.pathname, location.search]);
  const visibleNav = nav.filter(([path]) => canVisit(user, path));
  const title =
    location.pathname === "/"
      ? "میز کار"
      : nav.find(
          ([path]) => path !== "/" && location.pathname.startsWith(path),
        )?.[1] ||
        (location.pathname === "/dashboard"
          ? "گزارش مدیریتی"
          : location.pathname === "/settings"
            ? "تنظیمات"
            : "فضای کار");
  const refresh = () =>
    dispatch(
      api.util.invalidateTags([
        "Workspace",
        "Detail",
        "Notices",
        "Users",
        "Integrations",
        "Modules",
        "Trash",
        "Master",
      ]),
    );
  async function logout() {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        try {
          await mutate({
            url: "push/unsubscribe",
            body: { endpoint: subscription.endpoint },
          }).unwrap();
        } catch {
          console.error("Browser push unsubscribe request failed");
        }
        await subscription.unsubscribe();
      }
    }
    await mutate({ url: "auth/logout" });
    dispatch(signedOut());
    dispatch(api.util.resetApiState());
    navigate("/login");
  }
  return (
    <div className={`app-shell reference-shell min-h-screen font-sans${sidebarCollapsed ? " sidebar-collapsed" : ""}`} dir="rtl">
      <NotificationListener />
      <aside className="reference-sidebar" aria-label="منوی اصلی">
        <Link to="/" className="reference-brand">
          <span className="reference-mark hamrah-logo-surface"><img src={BRAND_ICON} alt="نشان همراه" width={58} height={58} /></span>
        </Link>
        <nav id="main-navigation" aria-label="بخش‌های سامانه">
          {visibleNav.map(([path, label, Icon, group], index) => (
            <Fragment key={path}>
              {index > 0 && group !== visibleNav[index - 1][3] && (
                <div
                  role="separator"
                  aria-label="گزارش و مدیریت"
                  className="reference-nav-separator"
                />
              )}
              <NavLink to={path} end={path === "/"} title={sidebarCollapsed ? label : undefined} aria-label={label}>
                <Icon size={19} strokeWidth={1.6} />
                <span>{label}</span>
              </NavLink>
            </Fragment>
          ))}
        </nav>
      </aside>
      <header className="reference-header">
        <div className="reference-header-main">
          <div className="reference-heading">
            <button type="button" className="sidebar-toggle" aria-label={sidebarCollapsed ? "باز کردن نوار کناری" : "جمع کردن نوار کناری"} title={sidebarCollapsed ? "باز کردن نوار کناری" : "جمع کردن نوار کناری"} aria-expanded={!sidebarCollapsed} aria-controls="main-navigation" onClick={() => setSidebarCollapsed((value) => !value)}>
              {sidebarCollapsed ? <PanelRightOpen size={19} /> : <PanelRightClose size={19} />}
            </button>
            <div>
            <h2>{title}</h2>
            </div>
          </div>
          <div className="reference-profile">
            <div className="reference-role">
              <span>نقش فعال</span>
              <b>
                {user?.roleNames?.join("، ") ||
                  (user?.role === "Admin"
                    ? "مدیر سیستم"
                    : user?.role === "Manager"
                      ? "مدیر"
                      : "عضو تیم")}
              </b>
            </div>
            <HeaderMenu user={user} logout={logout} />
          </div>
        </div>
        <div className="reference-toolbar">
          <div className="reference-quick">
            {(canVisit(user, "/tasks/new") ||
              (canVisit(user, "/projects") && can(user, "projects.write"))) && (
              <span className="quick-caption">عملیات سریع</span>
            )}
            {canVisit(user, "/tasks/new") && (
              <Link className="ui-button" to="/tasks/new">
                <Plus size={15} />
                وظیفه جدید
              </Link>
            )}
            {canVisit(user, "/projects") && can(user, "projects.write") && (
              <Link className="ui-secondary" to="/projects?new=true">
                <Plus size={15} />
                پروژه جدید
              </Link>
            )}
          </div>
          <div className="reference-tools">
            {canVisit(user, "/settings") && (
              <Link to="/settings">
                <Settings size={14} />
                تنظیمات
              </Link>
            )}
            {canViewWorkspace(user) && (
              <button onClick={refresh}>
                <RefreshCw size={13} />
                به‌روزرسانی
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="app-content reference-content">
        {canVisit(user, location.pathname) ? (
          <Outlet />
        ) : firstAllowedPage(user) ? (
          <Navigate to={firstAllowedPage(user)!} replace />
        ) : (
          <p role="status">
            بخشی برای این حساب فعال نشده است. با مدیر سامانه تماس بگیرید.
          </p>
        )}
      </main>
    </div>
  );
}
