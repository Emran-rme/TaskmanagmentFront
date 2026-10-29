import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setupListeners } from "@reduxjs/toolkit/query";
import type { User, Workspace, DashboardData } from "./lib/types";
import type { IntegrationResponse } from "./lib/integrations";
import type { ModulesResponse } from "./lib/modules";
import { notifyError } from "./lib/toasts";
import type { FlowCatalog, TaskFlow } from "./lib/workflows";
export interface DeletedRecord {
  entity: string;
  id: string;
  label: string;
  deletedAt: string | null;
  deletedBy: number | null;
  batchId: string | null;
}
const initial = (() => {
  try {
    return JSON.parse(localStorage.getItem("tm-session") || "null");
  } catch {
    return null;
  }
})();
const auth = createSlice({
  name: "auth",
  initialState: {
    token: initial?.token || "",
    user: initial?.user as User | null,
  },
  reducers: {
    signedIn(s, a: PayloadAction<{ token: string; user: User }>) {
      Object.assign(s, a.payload);
      localStorage.setItem("tm-session", JSON.stringify(a.payload));
    },
    signedOut(s) {
      s.token = "";
      s.user = null;
      localStorage.removeItem("tm-session");
    },
  },
});
export const { signedIn, signedOut } = auth.actions;
const authenticatedQuery = fetchBaseQuery({
  baseUrl: "/api/",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { token: string } }).auth.token;
    if (token) headers.set("authorization", "Bearer " + token);
    return headers;
  },
});
export const api = createApi({
  refetchOnFocus: false,
  refetchOnReconnect: true,
  refetchOnMountOrArgChange: 60,
  reducerPath: "api",
  baseQuery: async (args, apiContext, extraOptions) => {
    const result =
      import.meta.env.VITE_USE_MOCK === "true"
        ? await (
            await import("./mocks/api")
          ).mockQuery(args, apiContext, extraOptions)
        : await authenticatedQuery(args, apiContext, extraOptions);
    if (result.error) notifyError(errorText(result.error));
    if (
      result.error?.status === 401 &&
      (typeof args === "string" ? args : args.url) !== "auth/login"
    )
      apiContext.dispatch(signedOut());
    return result;
  },
  tagTypes: [
    "Workspace",
    "ProjectCover",
    "Detail",
    "Notices",
    "Users",
    "Integrations",
    "Modules",
    "Trash",
    "Master",
    "Workflows",
  ],
  endpoints: (b) => ({
    workflowCatalog: b.query<FlowCatalog, void>({query:()=>"workflows",providesTags:["Workflows"]}),
    taskFlow: b.query<TaskFlow|null,string>({query:id=>`tasks/${id}/workflow`,providesTags:["Detail"]}),
    projectRoles: b.query<
      { id: string; name: string; baseRole: string }[],
      void
    >({
      query: () => "project-roles",
      providesTags: ["Master"],
    }),
    columns: b.query<{ id: string; name: string; status: string }[], string>({
      query: (id) => `projects/${id}/columns`,
      providesTags: ["Workspace"],
    }),
    todos: b.query<
      {
        id: string;
        title: string;
        done: boolean;
        archived: boolean;
        reminderAt?: string;
      }[],
      void
    >({
      query: () => "todos",
      providesTags: ["Workspace"],
    }),
    master: b.query<any, void>({
      query: () => "master",
      providesTags: ["Master"],
    }),
    contexts: b.query<any, void>({ query: () => "auth/contexts" }),
    trash: b.query<DeletedRecord[], string>({
      query: (entity) => "trash/" + entity,
      providesTags: ["Trash"],
    }),
    modules: b.query<ModulesResponse, void>({
      query: () => "settings/modules",
      providesTags: ["Modules"],
    }),
    integrations: b.query<IntegrationResponse, void>({
      query: () => "settings/integrations",
      providesTags: ["Integrations"],
    }),
    dashboard: b.query<DashboardData, void>({
      query: () => "dashboard",
      providesTags: ["Workspace"],
      keepUnusedDataFor: 120,
    }),
    projectCover: b.query<{ coverImage: string }, string>({
      query: (id) => `projects/${id}/cover`,
      providesTags: (_result, _error, id) => [{ type: "ProjectCover", id }],
      keepUnusedDataFor: 60,
    }),
    workspace: b.query<Workspace, void>({
      query: () => "workspace",
      keepUnusedDataFor: 120,
      providesTags: ["Workspace"],
    }),
    detail: b.query<any, string>({
      query: (id) => "tasks/" + id,
      providesTags: ["Detail"],
    }),
    notices: b.query<any[], void>({
      query: () => "notifications",
      providesTags: ["Notices"],
    }),
    users: b.query<User[], void>({
      query: () => "admin/users",
      providesTags: ["Users"],
    }),
    mutate: b.mutation<any, { url: string; body?: unknown; method?: string }>({
      query: ({ url, body, method = "POST" }) => ({ url, method, body }),
      invalidatesTags: (_result, _error, arg) =>
        arg.url.startsWith("workflows") ? ["Workflows"] : arg.url === "projects" || /^projects\/[^/]+$/.test(arg.url)
          ? [
              "Workspace",
              { type: "ProjectCover", id: arg.url.split("/")[1] || "LIST" },
            ]
          : arg.url.startsWith("settings/modules")
            ? ["Modules", "Workspace", "Integrations", "Notices"]
            : arg.url === "settings"
              ? ["Workspace", "Modules"]
              : arg.url === "settings/integrations"
                ? ["Integrations"]
                : [
                    "Workspace",
                    "Detail",
                    "Notices",
                    "Users",
                    "Trash",
                    "Master",
                  ],
    }),
  }),
});
export const store = configureStore({
  reducer: { auth: auth.reducer, [api.reducerPath]: api.reducer },
  middleware: (g) => g().concat(api.middleware),
});
setupListeners(store.dispatch);
export type RootState = ReturnType<typeof store.getState>;
export const {
  useWorkflowCatalogQuery,
  useTaskFlowQuery,
  useDashboardQuery,
  useProjectCoverQuery,
  useProjectRolesQuery,
  useColumnsQuery,
  useTodosQuery,
  useMasterQuery,
  useContextsQuery,
  useTrashQuery,
  useModulesQuery,
  useIntegrationsQuery,
  useWorkspaceQuery,
  useDetailQuery,
  useNoticesQuery,
  useUsersQuery,
  useMutateMutation,
} = api;
export const errorText = (e: any) =>
  e?.data?.message ||
  e?.data?.detail ||
  e?.data?.title ||
  (e?.status === 401 ? "احراز هویت ناموفق است؛ اطلاعات ورود یا اعتبار نشست را بررسی کنید." :
   e?.status === 403 ? "اجازه انجام این عملیات را ندارید." :
   e?.status === "FETCH_ERROR" ? "اتصال به سرور برقرار نشد؛ اتصال شبکه را بررسی کنید." :
   e?.status === "TIMEOUT_ERROR" ? "مهلت پاسخ سرور تمام شد؛ دوباره تلاش کنید." : "") ||
  "عملیات ناموفق بود. اتصال و دسترسی را بررسی کنید.";
export { can, manages, canProject, canEditTask, canCloseTask, canReassignTask, canManageProject } from "./lib/access";
