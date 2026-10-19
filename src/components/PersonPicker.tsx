import { useEffect, useId, useRef, useState } from "react";
import type { User } from "../lib/types";
import { Field, input } from "./ui";
import {
  matchesPerson,
  normalizePersonSearch as normalize,
} from "../lib/personSearch";
export default function PersonPicker({
  users,
  name,
  label,
  defaultValue,
  required = true,
  onChange,
}: {
  users: User[];
  name: string;
  label: string;
  defaultValue?: number;
  required?: boolean;
  onChange?: (id: number) => void;
}) {
  const initial = users.find((u) => u.id === defaultValue);
  const [selected, setSelected] = useState(initial?.id);
  const [query, setQuery] = useState(initial?.name || "");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const id = useId();
  const person = users.find((u) => u.id === selected);
  useEffect(() => {
    ref.current?.setCustomValidity(
      required && !person ? "یک شخص را از نتایج جستجو انتخاب کنید." : "",
    );
  }, [person, required]);
  const matches =
    normalize(query).length >= 1 && !person
      ? users.filter((u) => matchesPerson(u, query)).slice(0, 30)
      : users.slice(0, 30);
  const details = (u: User) =>
    [
      u.position || "سمت ثبت نشده",
      u.unit,
      u.companies?.join("، ") || "شرکت ثبت نشده",
      u.roleNames?.join("، "),
    ]
      .filter(Boolean)
      .join(" · ");
  return (
    <Field label={label}>
      <div className="relative">
        <input type="hidden" name={name} value={person?.id || ""} />
        <input
          ref={ref}
          className={input}
          value={query}
          required={required}
          autoComplete="off"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={id}
          placeholder="جستجو با نام یا نام کاربری…"
          onFocus={() => setOpen(true)}
          onBlur={(e) => {
            if (
              !e.currentTarget.parentElement?.contains(e.relatedTarget as Node)
            )
              setOpen(false);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(undefined);
            setOpen(true);
            onChange?.(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape" && open) {
              e.preventDefault();
              e.stopPropagation();
              setOpen(false);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              document
                .getElementById(id)
                ?.querySelector<HTMLButtonElement>("button")
                ?.focus();
            }
          }}
        />
        {person && (
          <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
            {details(person)}
          </p>
        )}
        {open && (
          <div
            id={id}
            role="listbox"
            className="relative z-30 mt-2 max-h-64 overflow-auto rounded-xl border border-sky-200 bg-white p-2 shadow-xl dark:border-slate-600 dark:bg-slate-900"
          >
            {matches.map((u) => (
              <button
                key={u.id}
                type="button"
                role="option"
                aria-selected={person?.id === u.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSelected(u.id);
                  setQuery(u.name);
                  setOpen(false);
                  onChange?.(u.id);
                }}
                className="block w-full rounded-lg p-3 text-right hover:bg-sky-50 focus:bg-sky-50 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
              >
                <span className="font-semibold">{u.name}</span>
                {u.username && (
                  <span dir="ltr" className="block text-xs text-slate-500">
                    {u.username}
                  </span>
                )}
                <span className="mt-1 block text-xs leading-6 text-slate-500">
                  {details(u)}
                </span>
              </button>
            ))}
            {!matches.length && (
              <p className="p-3 text-xs text-slate-500">
                {normalize(query).length < 2
                  ? "حداقل دو حرف وارد کنید."
                  : "شخص مجازی با این نام یافت نشد."}
              </p>
            )}
          </div>
        )}
      </div>
    </Field>
  );
}
