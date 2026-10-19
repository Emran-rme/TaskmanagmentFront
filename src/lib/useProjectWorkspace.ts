import { useParams } from "react-router-dom";
import { useWorkspaceQuery } from "../store";
export function useProjectWorkspace() {
  const { projectId } = useParams();
  const result = useWorkspaceQuery();
  return {
    ...result,
    data:
      result.data && projectId
        ? {
            ...result.data,
            tasks: result.data.tasks.filter((t) => t.projectId === projectId),
            projects: result.data.projects.filter((p) => p.id === projectId),
          }
        : result.data,
  };
}
