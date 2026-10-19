import { type ReactNode } from "react";
import Modal from "./Modal";

export default function DefinitionDialog({
  title,
  onClose,
  busy,
  navigator,
  children,
}: {
  title: string;
  onClose: () => void;
  busy?: boolean;
  navigator: ReactNode;
  children: ReactNode;
}) {
  return (
    <Modal
      title={title}
      onClose={onClose}
      busy={busy}
      className="definition-dialog"
    >
      <div className="definition-layout">
        <aside className="definition-navigation" aria-label="انتخاب رکورد">
          {navigator}
        </aside>
        <div className="definition-content">{children}</div>
      </div>
    </Modal>
  );
}
