import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export default function Modal({
  title,
  onClose,
  children,
  busy = false,
  compact = false,
  className = "",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  busy?: boolean;
  compact?: boolean;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return createPortal(
    <dialog
      ref={dialog}
      dir="rtl"
      aria-labelledby={titleId}
      className={
        "app-modal" + (compact ? " app-modal-compact" : "") + " " + className
      }
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget || busy) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <div className="app-modal-head">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label="بستن پنجره"
        >
          <X size={18} strokeWidth={1.6} />
        </button>
      </div>
      <div className="app-modal-body">{children}</div>
    </dialog>,
    document.body,
  );
}
