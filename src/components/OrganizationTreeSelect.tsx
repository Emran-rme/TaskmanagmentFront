import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import DefinitionPicker from "./DefinitionPicker";
import Modal from "./Modal";
import { input } from "./ui";

type Unit = {
  id: string;
  name: string;
  type: string;
  parentId?: string | null;
};
export default function OrganizationTreeSelect({
  nodes,
  allowedIds,
  label,
  name,
  value,
  defaultValue = "",
  onChange,
  disabled = false,
  valueKey = "name",
}: {
  nodes: Unit[];
  allowedIds: string[];
  label: string;
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  valueKey?: "name" | "id";
}) {
  const [selection, setSelection] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const id = useId();
  const allowed = new Set(allowedIds);
  const selected = nodes.find(
    (node) => allowed.has(node.id) && node[valueKey] === (value ?? selection),
  );
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const visible = new Set<string>();
  for (const nodeId of allowed) {
    let node = byId.get(nodeId);
    const seen = new Set<string>();
    while (node && !seen.has(node.id)) {
      seen.add(node.id);
      visible.add(node.id);
      node = node.parentId ? byId.get(node.parentId) : undefined;
    }
  }
  return (
    <div className="organization-tree-select space-y-2">
      <span id={id + "-label"} className="block text-xs font-bold">
        {label}
      </span>
      <input type="hidden" name={name} value={selected?.[valueKey] || ""} />
      <button
        type="button"
        className={
          input + " flex items-center justify-between gap-2 text-right"
        }
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={id + "-tree"}
        disabled={disabled}
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">{selected?.name || "انتخاب " + label}</span>
        <ChevronDown
          size={16}
          className={
            "shrink-0 transition-transform " + (open ? "rotate-180" : "")
          }
        />
      </button>
      {open && (
        <Modal
          title={"انتخاب " + label}
          onClose={() => setOpen(false)}
          compact
          className="organization-tree-dialog"
        >
          <div id={id + "-tree"}>
            <DefinitionPicker
              tree
              title={label}
              selectedId={selected?.id}
              items={nodes
                .filter((node) => visible.has(node.id))
                .map((node) => ({
                  ...node,
                  subtitle: node.type,
                  disabled: !allowed.has(node.id),
                }))}
              onSelect={(nodeId) => {
                const node = byId.get(String(nodeId));
                if (!node || !allowed.has(node.id)) return;
                setSelection(node[valueKey]);
                onChange?.(node[valueKey]);
                setOpen(false);
              }}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
