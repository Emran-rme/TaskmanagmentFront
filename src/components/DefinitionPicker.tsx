import { useState, type ReactNode } from "react";
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  Folder,
  Plus,
  Search,
} from "lucide-react";
import { button, input } from "./ui";
export type DefinitionItem = {
  id: string | number;
  name: string;
  subtitle?: string;
  parentId?: string | null;
  disabled?: boolean;
};
const normalize = (value: string) =>
  value
    .replace(/[ي]/g, "ی")
    .replace(/[ك]/g, "ک")
    .replace(/[آأإ]/g, "ا")
    .replace(/[\s‌]+/g, "")
    .toLowerCase();
export default function DefinitionPicker({
  items,
  selectedId,
  onSelect,
  onCreate,
  title,
  createLabel,
  tree = false,
  busy = false,
}: {
  items: DefinitionItem[];
  selectedId?: string | number | null;
  onSelect: (id: string | number) => void;
  onCreate?: () => void;
  title: string;
  createLabel?: string;
  tree?: boolean;
  busy?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string | number>>(new Set());
  const byId = new Map(items.map((item) => [String(item.id), item]));
  const visible = new Set<string>();
  for (const item of items.filter((item) =>
    normalize(item.name + " " + (item.subtitle || "")).includes(
      normalize(search),
    ),
  )) {
    let current: DefinitionItem | undefined = item;
    const seen = new Set<string>();
    while (current && !seen.has(String(current.id))) {
      seen.add(String(current.id));
      visible.add(String(current.id));
      current =
        tree && current.parentId ? byId.get(current.parentId) : undefined;
    }
  }
  function branch(parent: string | null, path = new Set<string>()): ReactNode {
    return items
      .filter(
        (item) =>
          !tree ||
          (parent === null
            ? !item.parentId || !byId.has(item.parentId)
            : item.parentId === parent),
      )
      .filter(
        (item) => visible.has(String(item.id)) && !path.has(String(item.id)),
      )
      .map((item) => {
        const children =
          tree && items.some((child) => child.parentId === item.id);
        const expanded = !!search || !collapsed.has(item.id);
        const selected = String(selectedId) === String(item.id);
        return (
          <li key={item.id}>
            <div
              className={"definition-node" + (selected ? " is-selected" : "")}
            >
              {children ? (
                <button
                  type="button"
                  className="definition-toggle"
                  aria-expanded={expanded}
                  aria-label={`${expanded ? "بستن" : "باز کردن"} ${item.name}`}
                  disabled={busy}
                  onClick={() =>
                    setCollapsed((previous) => {
                      const next = new Set(previous);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    })
                  }
                >
                  {expanded ? (
                    <ChevronDown size={15} />
                  ) : (
                    <ChevronLeft size={15} />
                  )}
                </button>
              ) : (
                tree && <span className="definition-toggle" />
              )}
              <button
                type="button"
                className="definition-select"
                aria-pressed={selected}
                disabled={busy || item.disabled}
                onClick={() => onSelect(item.id)}
              >
                {tree &&
                  (children ? <Folder size={18} /> : <Building2 size={17} />)}
                <span>
                  {item.name}
                  {item.subtitle && <small>{item.subtitle}</small>}
                </span>
              </button>
            </div>
            {children && expanded && (
              <ul className="definition-branches">
                {branch(String(item.id), new Set([...path, String(item.id)]))}
              </ul>
            )}
          </li>
        );
      });
  }
  return (
    <div className="definition-picker">
      <label className="definition-search">
        <Search size={17} />
        <input
          className={input}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label={`جستجوی ${title}`}
          placeholder={`جستجوی ${title}…`}
        />
      </label>
      {onCreate && (
        <button
          type="button"
          className={button + " definition-create"}
          disabled={busy}
          onClick={onCreate}
        >
          <Plus size={15} />
          {createLabel || "تعریف رکورد جدید"}
        </button>
      )}
      <ul className="definition-records" aria-label={title}>
        {branch(null)}
      </ul>
      {!visible.size && (
        <p className="p-3 text-sm text-slate-500">
          {items.length ? "موردی یافت نشد." : "هنوز رکوردی تعریف نشده است."}
        </p>
      )}
    </div>
  );
}
