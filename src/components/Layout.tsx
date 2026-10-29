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
  ListTodo,
  Bell,
  FolderKanban,
  Grid2X2,
  Settings,
  Plus,
  RefreshCw,
} from "lucide-react";
import { RootState, signedOut, api, can, useMutateMutation } from "../store";
import HeaderMenu from "./HeaderMenu";
import NotificationListener from "./NotificationListener";
import { useEffect } from "react";
import { APP_NAME } from "../lib/branding";
import {
  canVisit,
  firstAllowedPage,
  canViewWorkspace,
} from "../lib/navigationAccess";
const nav = [
  ["/workflows", "گردش‌کارها", Grid2X2],
  ["/todos", "کارهای شخصی", ListTodo],
  ["/master", "اطلاعات پایه", Grid2X2],
  ["/", "میز کار", LayoutDashboard],
  ["/tasks", "وظایف", ListTodo],
  ["/projects", "پروژه‌ها", FolderKanban],
  ["/notifications", "اعلان‌ها", Bell],
] as const;
export default function Layout() {
  const user = useSelector((s: RootState) => s.auth.user);
  const dispatch = useDispatch(),
    navigate = useNavigate(),
    location = useLocation();
  const [mutate] = useMutateMutation();
  useEffect(() => {
    if (!/^\/tasks\/(new|[^/]+)(\/edit)?\/?$/.test(location.pathname))
      sessionStorage.setItem(
        "tm-task-origin",
        location.pathname + location.search,
      );
  }, [location.pathname, location.search]);
  const title =
    location.pathname === "/"
      ? "میز کار"
      : nav.find(
          ([path]) => path !== "/" && location.pathname.startsWith(path),
        )?.[1] || (location.pathname === "/settings" ? "تنظیمات" : "فضای کار");
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
    <div className="app-shell reference-shell min-h-screen font-sans" dir="rtl">
      <NotificationListener />
      <aside className="reference-sidebar" aria-label="منوی اصلی">
        <Link to="/" className="reference-brand">
          <span className="reference-mark">پ</span>
          <span>
            <b>{APP_NAME}</b>
            <small>مدیریت وظایف و پروژه‌ها</small>
          </span>
        </Link>
        <nav>
          {nav
            .filter(([path]) => canVisit(user, path))
            .map(([path, label, Icon]) => (
              <NavLink key={path} to={path} end={path === "/"}>
                <Icon size={19} strokeWidth={1.6} />
                <span>{label}</span>
              </NavLink>
            ))}
        </nav>
        <div className="reference-sidefoot">
          {APP_NAME}
          <br />
          مدیریت یکپارچه وظایف و پروژه‌ها
        </div>
      </aside>
      <header className="reference-header">
        <div className="reference-header-main">
          <div>
            <p className="reference-crumb">
              {APP_NAME} <span>/</span> {title}
            </p>
            <h2>{title}</h2>
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
