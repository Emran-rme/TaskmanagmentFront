import { useLocation } from "react-router-dom";

export function useTaskReturnPath(fallback = "/tasks") {
  const location = useLocation();
  const candidate =
    location.state?.returnTo || sessionStorage.getItem("tm-task-origin");
  return typeof candidate === "string" &&
    candidate.startsWith("/") &&
    !candidate.startsWith("//") &&
    !candidate.startsWith("/tasks/new") &&
    !/^\/tasks\/[^/]+(?:\/edit)?$/.test(candidate.split("?")[0])
    ? candidate
    : fallback;
}
