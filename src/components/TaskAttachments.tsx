import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { Download, Eye, FileText, Paperclip } from "lucide-react";
import { type RootState } from "../store";
import { downloadAttachment, fetchAttachment, previewContentType, supportsPreview } from "../lib/attachments";
import { fa } from "../lib/jalali";
import type { TaskAttachment, User } from "../lib/types";
import { activityDate } from "./TaskActivity";
import Modal from "./Modal";

type Preview = { name: string; url: string; type: string };

export default function TaskAttachments({ attachments, users }: { attachments: TaskAttachment[]; users: User[] }) {
  const token = useSelector((state: RootState) => state.auth.token);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const request = useRef(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; request.current++; };
  }, []);
  useEffect(() => {
    if (preview) return () => URL.revokeObjectURL(preview.url);
  }, [preview]);

  async function open(file: TaskAttachment) {
    const current = ++request.current;
    setError("");
    setBusy(file.id);
    try {
      const blob = await fetchAttachment(file, token);
      const type = await previewContentType(file.name, blob);
      if (!mounted.current || request.current !== current) return;
      if (!type) throw new Error("پیش‌نمایش این فایل در دسترس نیست؛ آن را دانلود کنید.");
      const url = URL.createObjectURL(new Blob([blob], { type }));
      setPreview({ name: file.name, url, type });
    } catch (err) {
      if (mounted.current && request.current === current) setError(err instanceof Error ? err.message : "دریافت فایل ناموفق بود.");
    } finally {
      if (mounted.current && request.current === current) setBusy(null);
    }
  }

  async function download(file: TaskAttachment) {
    setError("");
    setBusy(file.id);
    try { await downloadAttachment(file, token); }
    catch (err) { if (mounted.current) setError(err instanceof Error ? err.message : "دریافت فایل ناموفق بود."); }
    finally { if (mounted.current) setBusy(null); }
  }

  const files = [...attachments].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <section className="task-attachments" aria-labelledby="task-attachments-heading">
      <div className="task-attachments-heading">
        <h3 id="task-attachments-heading"><Paperclip size={16} /> اسناد و پیوست‌ها</h3>
        <span>{fa(files.length)} فایل</span>
      </div>
      {error && <p className="task-attachments-error" role="alert">{error}</p>}
      {files.length ? (
        <ul className="task-attachments-list">
          {files.map(file => (
            <li key={file.id} className="task-attachment">
              <span className="task-attachment-icon" aria-hidden="true"><FileText size={20} /></span>
              <div className="task-attachment-info">
                <strong title={file.name}>{file.name}</strong>
                <span>{fa(Math.max(1, Math.ceil(file.size / 1024)))} کیلوبایت · {activityDate(file.createdAt)}{file.uploadedBy ? ` · ${users.find(user => user.id === file.uploadedBy)?.name || "کاربر"}` : ""}{file.reportId ? " · پیوست نظر" : ""}</span>
              </div>
              <div className="task-attachment-actions">
                {supportsPreview(file.name) && <button type="button" disabled={busy !== null} onClick={() => void open(file)} title="پیش‌نمایش" aria-label={`پیش‌نمایش ${file.name}`}><Eye size={17} /></button>}
                <button type="button" disabled={busy !== null} onClick={() => void download(file)} title="دانلود" aria-label={`دانلود ${file.name}`}><Download size={17} /></button>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="task-attachments-empty">هنوز فایلی به این وظیفه پیوست نشده است.</p>}
      {preview && <Modal title={preview.name} className="attachment-preview-dialog" onClose={() => setPreview(null)}>
        {preview.type === "application/pdf" ? (
          <iframe title={`پیش‌نمایش ${preview.name}`} src={preview.url} sandbox="allow-scripts" className="attachment-preview-frame" />
        ) : (
          <img src={preview.url} alt={preview.name} className="attachment-preview-image" />
        )}
      </Modal>}
    </section>
  );
}
