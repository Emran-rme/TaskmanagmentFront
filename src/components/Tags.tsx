import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { useCreateTagMutation, useTagsQuery, taskTagIndex, type Tag } from "../lib/tags";

function textColor(hex: string) {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const light = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  return light > 0.179 ? "#000000" : "#ffffff";
}
export function TagBadges({ taskId }: { taskId: string }) {
  const { data } = useTagsQuery();
  const ids = data ? taskTagIndex(data.taskTags).get(taskId) : undefined;
  return <span className="flex flex-wrap gap-1">{data?.tags.filter(t => ids?.has(t.id)).map(t => <TagBadge key={t.id} tag={t}/>)}</span>;
}
export function TagBadge({tag}: {tag: Tag}) { return <span className="inline-block rounded-full px-2 py-1 text-xs" style={{backgroundColor: tag.color, color: textColor(tag.color)}}>{tag.name}</span> }
export function TagPicker({ value, onChange, create = false }: {value: string[]; onChange: (ids: string[]) => void; create?: boolean}) {
  const { data, isLoading, isError } = useTagsQuery();
  const [createTag, result] = useCreateTagMutation();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#64748b");
  const normalized = (s: string) => s.normalize("NFKC").trim().replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/\s+/g, " ").toUpperCase();
  const matching = data?.tags.filter(t => normalized(t.name).includes(normalized(name))) || [];
  const exact = data?.tags.find(t => normalized(t.name) === normalized(name));
  async function add() {
    if (!name.trim()) return;
    try {
      const tag = exact || await createTag({name, color}).unwrap();
      if (!value.includes(tag.id)) onChange([...value, tag.id]);
      setName("");
    } catch { /* API errors are shown by the shared request handler. */ }
  }
  const selected = data?.tags.filter(t => value.includes(t.id)) || [];
  const available = matching.filter(t => !value.includes(t.id));
  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5" aria-label="برچسب‌های انتخاب‌شده">
          {selected.map(t => (
            <button key={t.id} type="button" onClick={() => onChange(value.filter(id => id !== t.id))}
              aria-label={`حذف ${t.name}`} style={{ backgroundColor: t.color, color: textColor(t.color) }}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
              {t.name}<X size={13} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
      <div className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 transition focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/10 dark:border-slate-700 dark:bg-slate-900/40">
        <Search size={17} className="shrink-0 text-slate-400" aria-hidden="true" />
        <input className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100" value={name} onChange={e => setName(e.target.value)} placeholder={create ? "جست‌وجو یا ساخت برچسب" : "جست‌وجوی برچسب"} aria-label="جست‌وجوی تگ" onKeyDown={e => {if (e.key === "Enter") {e.preventDefault(); if (create && !isLoading && !isError && !result.isLoading) void add();}}} />
        {create && (
          <label className="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 transition hover:border-slate-400 focus-within:ring-2 focus-within:ring-sky-500 dark:border-slate-600" title="انتخاب رنگ تگ">
            <span className="h-4 w-4 rounded-full border border-black/10" style={{ backgroundColor: color }} aria-hidden="true" />
            <input type="color" value={color} onChange={e => setColor(e.target.value)} aria-label="رنگ تگ" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
          </label>
        )}
      </div>
      {isError && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">دریافت تگ‌ها انجام نشد.</p>}
      {(available.length > 0 || (create && !!name.trim() && !exact && !isLoading && !isError)) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {available.map(t => <button key={t.id} type="button" onClick={() => onChange([...value, t.id])} className="rounded-full transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"><TagBadge tag={t}/></button>)}
          {create && !!name.trim() && !exact && !isLoading && !isError && (
            <button type="button" disabled={result.isLoading} onClick={() => void add()} className="inline-flex items-center gap-1 rounded-full border border-dashed border-sky-300 px-2.5 py-1 text-xs font-medium text-sky-700 transition hover:bg-sky-50 disabled:opacity-50 dark:border-sky-700 dark:text-sky-300 dark:hover:bg-sky-950/50">
              <Plus size={13} aria-hidden="true" /> ساخت «{name.trim()}»
            </button>
          )}
        </div>
      )}
    </div>
  );
}
