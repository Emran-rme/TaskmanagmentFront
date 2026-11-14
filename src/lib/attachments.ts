import type { TaskAttachment } from "./types";

export async function fetchAttachment(file: TaskAttachment, token: string): Promise<Blob> {
  const response = await fetch(`/api/files/${encodeURIComponent(file.id)}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("نشست شما پایان یافته است؛ دوباره وارد شوید.");
    if (response.status === 403) throw new Error("اجازه دریافت این فایل را ندارید.");
    if (response.status === 404) throw new Error("فایل پیدا نشد یا دیگر در دسترس نیست.");
    throw new Error("دریافت فایل ناموفق بود.");
  }
  return response.blob();
}

export async function downloadAttachment(file: TaskAttachment, token: string) {
  const url = URL.createObjectURL(await fetchAttachment(file, token));
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// Only allow passive formats and confirm their content before rendering a preview.
export async function previewContentType(name: string, blob: Blob): Promise<string | null> {
  const bytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  const starts = (...signature: number[]) => signature.every((value, index) => bytes[index] === value);
  const ext = name.toLowerCase().split(".").pop();
  if (ext === "pdf" && starts(0x25, 0x50, 0x44, 0x46, 0x2d)) return "application/pdf";
  if (ext === "png" && starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if ((ext === "jpg" || ext === "jpeg") && starts(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (ext === "gif" && (starts(0x47, 0x49, 0x46, 0x38, 0x37, 0x61) || starts(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))) return "image/gif";
  if (ext === "webp" && starts(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return "image/webp";
  return null;
}

export function supportsPreview(name: string) {
  return /\.(pdf|png|jpe?g|gif|webp)$/i.test(name);
}
