import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Trash2, FolderKanban, ListTodo, ShieldCheck } from "lucide-react";
import Modal from "./Modal";
import { button, secondary, ErrorBox, Loading } from "./ui";
import { useMutateMutation, errorText } from "../store";
import type { FlowDefinition } from "../lib/workflows";

interface Preview {
  definitions: { id: string; name: string; version: number }[];
  id: string;
  name: string;
  revision: number;
  previewToken: string;
  selectedProjectIds: string[];
  projects: {
    id: string;
    name: string;
    shared: boolean;
    taskCount: number;
    otherDefinitionCount: number;
  }[];
  tasks: {
    id: string;
    title: string;
    code: string;
    projectId: string | null;
  }[];
  definitionCount: number;
  relatedRecordCount: number;
}
export default function DeleteWorkflowDialog({
  definition,
  onClose,
  onDeleted,
}: {
  definition: FlowDefinition;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [mutate] = useMutateMutation();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  useEffect(() => {
    let live = true;
    mutate({
      url: `workflows/${definition.id}/deletion-preview`,
      body: { projectIds: null },
    })
      .unwrap()
      .then((p: Preview) => {
        if (live) setPreview(p);
      })
      .catch((e) => {
        if (live) setError(errorText(e));
      })
      .finally(() => {
        if (live) setBusy(false);
      });
    return () => {
      live = false;
    };
  }, [definition.id, mutate]);
  async function selectProject(id: string, checked: boolean) {
    if (!preview) return;
    setBusy(true);
    setAcknowledged(false);
    setError("");
    const ids = checked
      ? [...preview.selectedProjectIds, id]
      : preview.selectedProjectIds.filter((x) => x !== id);
    await refresh(ids);
  }
  async function refresh(
    ids: string[] | null = preview?.selectedProjectIds ?? null,
  ) {
    setBusy(true);
    setAcknowledged(false);
    setError("");
    try {
      setPreview(
        await mutate({
          url: `workflows/${definition.id}/deletion-preview`,
          body: { projectIds: ids },
        }).unwrap(),
      );
    } catch (e) {
      setError(errorText(e));
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!preview || !acknowledged || busy) return;
    setDeleting(true);
    setError("");
    try {
      await mutate({
        url: `workflows/${definition.id}`,
        method: "DELETE",
        body: {
          previewToken: preview.previewToken,
          projectIds: preview.selectedProjectIds,
        },
      }).unwrap();
      toast.success("گردش‌کار و موارد انتخاب‌شده به سطل بازیافت منتقل شدند.");
      onDeleted();
    } catch (e) {
      setError(errorText(e));
      setAcknowledged(false);
    } finally {
      setDeleting(false);
    }
  }
  return (
    <Modal
      title={`حذف گردش‌کار: ${definition.name}`}
      className="workflow-delete-dialog"
      onClose={() => {
        if (!deleting) onClose();
      }}
    >
      <div className="workflow-delete-content">
        <p className="workflow-delete-intro">
          <ShieldCheck size={20} />
          این حذف قابل بازیابی است. گردش‌کار و موارد زیر در یک عملیات به سطل
          بازیافت منتقل می‌شوند.
        </p>
        {error && <ErrorBox message={error} />}
        {busy && <Loading />}
        {preview && (
          <>
            <div className="workflow-delete-totals">
              <span>
                <Trash2 size={18} />
                {preview.definitionCount.toLocaleString("fa-IR")} الگو / نسخه
              </span>
              <span>
                <FolderKanban size={18} />
                {preview.selectedProjectIds.length.toLocaleString("fa-IR")}{" "}
                پروژه
              </span>
              <span>
                <ListTodo size={18} />
                {preview.tasks.length.toLocaleString("fa-IR")} تسک
              </span>
            </div>
            <h3>پروژه‌های مرتبط</h3>
            <p>
              حذف پروژه اختیاری است. با انتخاب پروژه، تمام تسک‌ها و الگوهای متصل
              به همان پروژه نیز حذف می‌شوند.
            </p>
            {!preview.projects.length && (
              <p>
                پروژه مرتبطی وجود ندارد؛ هیچ پروژه دیگری از شرکت حذف نمی‌شود.
              </p>
            )}
            <div className="workflow-delete-projects">
              {preview.projects.map((p) => (
                <label key={p.id}>
                  <input
                    type="checkbox"
                    disabled={busy || deleting}
                    checked={preview.selectedProjectIds.includes(p.id)}
                    onChange={(e) => selectProject(p.id, e.target.checked)}
                  />
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {p.taskCount.toLocaleString("fa-IR")} تسک ·{" "}
                      {p.otherDefinitionCount.toLocaleString("fa-IR")} الگوی
                      دیگر
                      {p.shared ? " · پروژه مشترک، نیازمند انتخاب صریح" : ""}
                    </small>
                  </span>
                </label>
              ))}
            </div>
            <details className="workflow-delete-tasks">
              <summary>
                الگوها و نسخه‌های مشمول حذف (
                {preview.definitionCount.toLocaleString("fa-IR")})
              </summary>
              {(preview.definitions ?? []).map((d) => (
                <div key={d.id}>
                  <strong>{d.name}</strong>
                  <span>
                    {d.version
                      ? `نسخه ${d.version.toLocaleString("fa-IR")}`
                      : "پیش‌نویس"}
                  </span>
                </div>
              ))}
            </details>
            <h3>
              تسک‌هایی که حذف می‌شوند (
              {preview.tasks.length.toLocaleString("fa-IR")})
            </h3>
            <p>
              تسک‌های مستقیم گردش‌کار و زیروظایف آن‌ها، حتی بدون انتخاب پروژه،
              در این فهرست قرار دارند.
            </p>
            <div className="workflow-delete-tasks">
              {preview.tasks.map((t) => (
                <div key={t.id}>
                  <strong>{t.title}</strong>
                  <span>
                    {t.code}{" "}
                    {t.projectId
                      ? ` · ${preview.projects.find((p) => p.id === t.projectId)?.name || "پروژه"}`
                      : " · مستقل"}
                  </span>
                </div>
              ))}
              {!preview.tasks.length && <p>تسکی برای حذف وجود ندارد.</p>}
            </div>
            <p>
              {preview.relatedRecordCount.toLocaleString("fa-IR")} مورد از
              سوابق، گزارش‌ها، اعلان‌ها و پیوست‌های این تسک‌ها نیز همراه آن‌ها
              به سطل بازیافت منتقل می‌شود. مواردی که قبلاً حذف شده‌اند تغییری
              نمی‌کنند.
            </p>
            <label className="workflow-delete-ack">
              <input
                type="checkbox"
                disabled={busy || deleting}
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
              فهرست بالا را بررسی کردم و حذف همین موارد را تأیید می‌کنم.
            </label>
          </>
        )}
        <div className="workflow-delete-actions">
          <button
            className={`${button} workflow-delete-confirm`}
            disabled={!preview || busy || deleting || !acknowledged}
            onClick={remove}
          >
            <Trash2 size={16} />
            {deleting
              ? "در حال انتقال به سطل بازیافت…"
              : "حذف گردش‌کار و موارد انتخاب‌شده"}
          </button>
          <button
            className={secondary}
            disabled={busy || deleting}
            onClick={() => refresh()}
          >
            به‌روزرسانی پیش‌نمایش
          </button>
          <button className={secondary} disabled={deleting} onClick={onClose}>
            انصراف
          </button>
        </div>
      </div>
    </Modal>
  );
}
