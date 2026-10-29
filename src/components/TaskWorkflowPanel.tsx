import { useState, lazy, Suspense } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  RootState,
  useTaskFlowQuery,
  useMutateMutation,
  errorText,
} from "../store";
import { flowLabels, type FlowKind } from "../lib/workflows";
import { type Task } from "../lib/types";
import { button, secondary, input, ErrorBox } from "./ui";
const WorkflowCanvas = lazy(() => import("./WorkflowCanvas"));
export default function TaskWorkflowPanel({
  task,
  reviewer,
}: {
  task: Task;
  reviewer: boolean;
}) {
  const { data: flow, error } = useTaskFlowQuery(task.id, {
    pollingInterval: 30000,
  });
  const [mutate, { isLoading }] = useMutateMutation();
  const user = useSelector((s: RootState) => s.auth.user);
  const [reason, setReason] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [failure, setFailure] = useState("");
  if (error) return <ErrorBox message={errorText(error)} />;
  if (!flow) return null;
  const active = flow.enabled && flow.status === "Waiting";
  async function act(action: "reject" | "bypass") {
    try {
      await mutate({
        url: `tasks/${task.id}/workflow/${action}`,
        body: { reason, version: task.version },
      }).unwrap();
      setReason("");
      setFailure("");
      toast.success(
        action === "reject"
          ? "خروجی برگشت داده شد."
          : "گردش‌کار این وظیفه به رفتار قبلی برگشت.",
      );
    } catch (e) {
      setFailure(errorText(e));
    }
  }
  return (
    <section className="task-flow-panel" aria-label="گردش‌کار وظیفه">
      <strong>
        {flow.name} · نسخه {flow.version}
      </strong>
      <p>
        مرحله:{" "}
        {flow.graph.nodes.find((n) => n.id === flow.nodeId)?.label ||
          flowLabels[flow.stage as FlowKind]}{" "}
        ·{" "}
        {flow.status === "Completed"
          ? "پایان‌یافته"
          : flow.status === "Bypassed"
            ? "بازگشت به رفتار قبلی"
            : flow.enabled
              ? "در انتظار"
              : "موتور غیرفعال"}
      </p>
      {flow.dueAt && (
        <p>
          زمان ادامه:{" "}
          {new Date(
            flow.dueAt + (/Z$/.test(flow.dueAt) ? "" : "Z"),
          ).toLocaleString("fa-IR")}
        </p>
      )}
      <button className={secondary} onClick={() => setExpanded(!expanded)}>
        {expanded ? "بستن نمودار" : "مشاهده مسیر اجرا"}
      </button>
      {expanded && (
        <Suspense fallback={<p>بارگذاری نمودار…</p>}>
          <WorkflowCanvas graph={flow.graph} current={flow.nodeId} />
        </Suspense>
      )}
      {active &&
        (user?.role === "Admin" || (reviewer && flow.stage === "approval")) && (
          <div className="workflow-properties">
            <label>
              علت برگشت
              <input
                className={input}
                value={reason}
                maxLength={1500}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
            <div className="workflow-toolbar">
              {reviewer && flow.stage === "approval" && (
                <button
                  className={button}
                  disabled={isLoading || !reason.trim()}
                  onClick={() => act("reject")}
                >
                  برگشت به مرحله قبلی
                </button>
              )}
              {user?.role === "Admin" && (
                <button
                  className={secondary}
                  disabled={isLoading || !reason.trim()}
                  onClick={() => act("bypass")}
                >
                  بازگشت این تسک به رفتار قبلی
                </button>
              )}
            </div>
          </div>
        )}
      {failure && <ErrorBox message={failure} />}
    </section>
  );
}
