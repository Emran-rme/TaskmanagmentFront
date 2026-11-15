import { useState } from "react";
import { List, CalendarDays, Briefcase, ShoppingBasket, Lightbulb, Star, Flag, Heart, Inbox, Pencil, Trash2 } from "lucide-react";
import type { TodoList } from "../store";
import Modal from "./Modal";
import { button, input, secondary } from "./ui";

const icons = { list: List, calendar: CalendarDays, briefcase: Briefcase, shopping: ShoppingBasket, lightbulb: Lightbulb, star: Star, flag: Flag, heart: Heart };
export function TodoListsSidebar({ lists, selected, select, add, edit, remove }: { lists: TodoList[]; selected: string | null; select: (id: string | null) => void; add: () => void; edit: (l: TodoList) => void; remove: (l: TodoList) => void }) {
  return <aside className="space-y-2 rounded border border-slate-200 p-3 dark:border-slate-700" aria-label="فهرست‌های شخصی">
    <div className="flex items-center justify-between"><strong>فهرست‌ها</strong><button type="button" className={secondary} onClick={add}>+ فهرست</button></div>
    <button type="button" onClick={() => select(null)} aria-pressed={selected === null} className={`flex w-full items-center gap-2 rounded p-2 text-right ${selected === null ? "bg-sky-100 dark:bg-slate-700" : ""}`}><Inbox size={18} /> صندوق ورودی</button>
    {lists.map(l => { const Icon = icons[l.icon as keyof typeof icons] || List; return <div key={l.id} className={`flex items-center rounded ${selected === l.id ? "bg-sky-100 dark:bg-slate-700" : ""}`}>
      <button type="button" onClick={() => select(l.id)} aria-pressed={selected === l.id} className="flex min-w-0 flex-1 items-center gap-2 p-2 text-right"><Icon size={18} style={{ color: l.color }} /><span className="truncate">{l.name}</span></button>
      <button type="button" className="p-2" disabled={l.id.startsWith("pending-")} aria-label={`ویرایش ${l.name}`} onClick={() => edit(l)}><Pencil size={15} /></button>
      <button type="button" className="p-2" disabled={l.id.startsWith("pending-")} aria-label={`حذف ${l.name}`} onClick={() => remove(l)}><Trash2 size={15} /></button>
    </div>; })}
  </aside>;
}

export function TodoListForm({ list, close, save }: { list: TodoList | null; close: () => void; save: (value: { name: string; color: string; icon: string }) => void }) {
  const [color, setColor] = useState(list?.color || "#0284c7");
  const [icon, setIcon] = useState(list?.icon || "list");
  return <Modal title={list ? "ویرایش فهرست" : "فهرست جدید"} onClose={close} compact>
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); const name = String(new FormData(e.currentTarget).get("name") || "").trim(); if (name) save({ name, color, icon }); }}>
      <label className="block">نام فهرست<input name="name" className={input} defaultValue={list?.name} maxLength={100} required autoFocus /></label>
      <fieldset><legend>آیکون</legend><div className="flex flex-wrap gap-2">{Object.entries(icons).map(([name, Icon]) => <button key={name} type="button" title={name} aria-label={name} aria-pressed={icon === name} className={`${secondary} ${icon === name ? "ring-2 ring-sky-500" : ""}`} onClick={() => setIcon(name)}><Icon size={18} /></button>)}</div></fieldset>
      <fieldset><legend>رنگ</legend><div className="flex flex-wrap items-center gap-2">{["#0284c7", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"].map(c => <button key={c} type="button" aria-label={`رنگ ${c}`} aria-pressed={color === c} onClick={() => setColor(c)} className={`h-7 w-7 rounded-full ${color === c ? "ring-2 ring-offset-2 ring-sky-500" : ""}`} style={{ background: c }} />)}<input type="color" aria-label="رنگ دلخواه" value={color} onChange={e => setColor(e.target.value)} /></div></fieldset>
      <div className="flex gap-2"><button className={button}>ذخیره</button><button type="button" className={secondary} onClick={close}>انصراف</button></div>
    </form>
  </Modal>;
}
