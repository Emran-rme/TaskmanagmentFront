import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { Provider, useSelector } from "react-redux";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { store, RootState } from "./store";
import Layout from "./components/Layout";
import { Loading } from "./components/ui";
import "./index.css";
import { safeReturnTo, authDestination } from "./lib/returnTo";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("/sw.js").catch(console.error);
const ContextSelect = lazy(() => import("./pages/ContextSelect"));
const Workflows = lazy(() => import("./pages/Workflows"));
const Organization = lazy(() => import("./pages/Organization"));
const PersonalTodos = lazy(() => import("./pages/PersonalTodos"));
const Master = lazy(() => import("./pages/Master"));
const ProjectWorkspace = lazy(() => import("./pages/ProjectWorkspace"));
const Login = lazy(() => import("./pages/Login")),
  Dashboard = lazy(() => import("./pages/Dashboard")),
  Tasks = lazy(() => import("./pages/Tasks")),
  TaskForm = lazy(() => import("./pages/TaskForm")),
  TaskDetail = lazy(() => import("./pages/TaskDetail")),
  Calendar = lazy(() => import("./pages/Calendar")),
  Gantt = lazy(() => import("./pages/Gantt")),
  Kanban = lazy(() => import("./pages/Kanban")),
  Notifications = lazy(() => import("./pages/Notifications")),
  Projects = lazy(() => import("./pages/Projects")),
  Users = lazy(() => import("./pages/Users")),
  Settings = lazy(() => import("./pages/Settings")),
  Modules = lazy(() => import("./pages/Modules")),
  Trash = lazy(() => import("./pages/Trash"));
function Protected() {
  const { token, user } = useSelector((s: RootState) => s.auth);
  const location = useLocation();
  const target = safeReturnTo(location.pathname);
  if (!token)
    return <Navigate to={authDestination("/login", target)} replace />;
  if (user?.contextRequired)
    return <Navigate to={authDestination("/select-context", target)} replace />;
  return <Layout />;
}
function ContextRoute() {
  const token = useSelector((s: RootState) => s.auth.token);
  const location = useLocation();
  const target = safeReturnTo(
    new URLSearchParams(location.search).get("returnTo"),
  );
  return token ? (
    <ContextSelect />
  ) : (
    <Navigate to={authDestination("/login", target)} replace />
  );
}
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="select-context" element={<ContextRoute />} />
        <Route element={<Protected />}>
          <Route path="workflows" element={<Workflows />} />
          <Route path="organization" element={<Organization />} />
          <Route path="master" element={<Master />} />
          <Route path="projects/:projectId/*" element={<ProjectWorkspace />} />
          <Route index element={<Dashboard />} />
          <Route path="todos" element={<PersonalTodos />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="tasks/new" element={<TaskForm />} />
          <Route path="tasks/:id/edit" element={<TaskForm />} />
          <Route path="tasks/:id" element={<TaskDetail />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="gantt" element={<Gantt />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="projects" element={<Projects />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Settings />} />
          <Route path="modules" element={<Modules />} />
          <Route path="trash" element={<Trash />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ToastContainer position="top-center" theme="colored" rtl limit={3} newestOnTop pauseOnHover closeOnClick />
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
