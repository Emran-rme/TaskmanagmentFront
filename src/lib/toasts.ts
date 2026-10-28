import { toast } from "react-toastify";

export function notifyError(message: string) {
  if (!message.trim()) return;
  toast.error(message, { toastId: `error:${message}`, autoClose: 8000 });
}
