import { lazy } from "react";
import { Link, NavLink, Routes, Route, useParams } from "react-router-dom";
import { useWorkspaceQuery, can, type RootState } from "../store";
import { useSelector } from "react-redux";
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  FolderKanban,
  ListTodo,
  Plus,
  Rows3,
} from "lucide-react";
import { button, secondary, Loading, ErrorBox } from "../components/ui";
import { OverviewHero } from "../components/WorkspaceOverview";
import DashboardViews from "../components/DashboardViews";
import ProjectMembers from "../components/ProjectMembers";
const Tasks = lazy(() => import("./Tasks"));
const Gantt = lazy(() => import("./Gantt"));
const Kanban = lazy(() => import("./Kanban"));
const Calendar = lazy(() => import("./Calendar"));
export default function ProjectWorkspace() {
  const { projectId } = useParams();
  const { data: w, error } = useWorkspaceQuery();
  const user = useSelector((state: RootState) => state.auth.user);
  if (error) return <ErrorBox message="دریافت پروژه ناموفق بود." />;
  if (!w) return <Loading />;
  const project = w.projects.find((p) => p.id === projectId);
  if (!project) return <ErrorBox message="پروژه یافت نشد یا دسترسی ندارید." />;
  const tabs = [
    { path: "", label: "خلاصه و میز کار", Icon: ChartNoAxesCombined },
    { path: "tasks", label: "جدول وظایف", Icon: ListTodo },
    { path: "gantt", label: "گانت چارت", Icon: Rows3 },
    { path: "kanban", label: "کانبان پروژه", Icon: FolderKanban },
    { path: "calendar", label: "تقویم", Icon: CalendarDays },
    ...(user?.role === "Admin" || user?.id === project.managerId ? [{path:"members",label:"تنظیمات اعضا",Icon:ListTodo}] : []),
  ];
  return (
    <div className="overview-page space-y-5">
      <OverviewHero
        compact
        title={project.name}
        subtitle={`${project.company} · ${project.unit}`}
        action={
          can(user, "tasks.write", project.company) && (
            <Link className={button} to={`/tasks/new?projectId=${project.id}`}>
              <Plus size={16} />
              افزودن وظیفه
            </Link>
          )
        }
      >
        <Link className="overview-back" to="/projects">
          <ArrowRight size={14} />
          بازگشت به پروژه‌ها
        </Link>
        <nav className="overview-tabs" aria-label="نماهای پروژه">
          {tabs
            .filter(
              (tab) => !tab.path || can(user, "tasks.read", project.company),
            )
            .map(({ path, label, Icon }) => (
              <NavLink
                end
                key={path}
                to={`/projects/${project.id}/${path}`}
                className={({ isActive }) => (isActive ? button : secondary)}
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
        </nav>
      </OverviewHero>
      <Routes>
        <Route path="members" element={user?.role === "Admin" || user?.id === project.managerId ? <ProjectMembers project={project}/> : <ErrorBox message="مدیریت اعضا در اختیار مدیر پروژه است."/>}/>
        <Route
          index
          element={<DashboardViews workspace={w} project={project} />}
        />
        <Route path="tasks" element={<Tasks />} />
        <Route path="gantt" element={<Gantt />} />
        <Route path="kanban" element={<Kanban />} />
        <Route path="calendar" element={<Calendar />} />
      </Routes>
    </div>
  );
}
