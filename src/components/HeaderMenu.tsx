import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Plus,
  Settings,
  UserRound,
} from "lucide-react";
import type { User } from "../lib/types";
import { iso, jalali } from "../lib/jalali";
import ThemeToggle from "./ThemeToggle";
import { canVisit } from "../lib/navigationAccess";

export default function HeaderMenu({
  user,
  logout,
}: {
  user: User | null;
  logout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname, location.search]);
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      if (!container.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const row =
    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right text-sm transition hover:bg-sky-50 focus-visible:bg-sky-50 focus-visible:outline-none dark:hover:bg-slate-800 dark:focus-visible:bg-slate-800";
  return (
    <div
      ref={container}
      className="relative"
      dir="rtl"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls="header-options"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/60 px-3 py-2.5 text-navy shadow-sm backdrop-blur-xl transition hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand dark:border-slate-700 dark:bg-slate-800/80 dark:text-sky-50 dark:hover:bg-slate-800"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-brand dark:bg-sky-950">
          <UserRound size={21} />
        </span>
        <span className="max-w-40 truncate text-xs font-bold sm:max-w-56">
          {user?.name || "حساب کاربری"}
        </span>
        <ChevronDown
          size={16}
          className={"transition-transform " + (open ? "rotate-180" : "")}
        />
      </button>
      {open && (
        <div
          onClick={(e) => {
            if ((e.target as Element).closest("a")) setOpen(false);
          }}
          id="header-options"
          className="absolute left-0 top-full z-50 mt-3 max-h-[75vh] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-sky-100 bg-white/95 p-2 text-navy shadow-xl shadow-sky-950/15 backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100"
        >
          <div className="mb-2 border-b border-slate-100 px-3 py-3 dark:border-slate-700">
            <p className="font-bold">{user?.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {({ Admin: "مدیر سامانه", Manager: "مدیر", Member: "کارشناس", Viewer: "مشاهده‌گر" } as Record<string, string>)[user?.role || ""]}
              {" · "}{user?.company === "*" ? "کل گروه" : user?.company}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {jalali(iso(new Date()))}
            </p>
          </div>
          <Link className={row} to="/select-context">
            <UserRound size={18} />
            تغییر نقش و شرکت
          </Link>
          {canVisit(user, "/tasks/new") && (
            <Link className={row + " font-bold text-brand"} to="/tasks/new">
              <Plus size={18} />
              وظیفه جدید
            </Link>
          )}
          {canVisit(user, "/notifications") && (
            <Link className={row} to="/notifications">
              <Bell size={18} />
              اعلان‌ها
            </Link>
          )}
          {canVisit(user, "/settings") && (
            <Link className={row} to="/settings">
              <Settings size={18} />
              تنظیمات
            </Link>
          )}
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-3 py-2 text-sm dark:border-slate-700">
            <span>حالت نمایش</span>
            <ThemeToggle />
          </div>
          <button
            type="button"
            className={row + " text-rose-600 dark:text-rose-400"}
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <LogOut size={18} />
            خروج از حساب
          </button>
        </div>
      )}
    </div>
  );
}
