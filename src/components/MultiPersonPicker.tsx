import { useId, useRef, useState } from "react";
import { Users, X } from "lucide-react";
import { Field, input } from "./ui";
import type { User } from "../lib/types";
import { fa } from "../lib/jalali";
import { matchesPerson } from "../lib/personSearch";

export default function MultiPersonPicker({
  users,
  defaultValue = [],
  label,
  name,
  emptyMessage = "هیچ کاربر فعال و مجازی برای این پروژه یافت نشد. انتساب افراد به شرکت پروژه را بررسی کنید.",
}: {
  users: User[];
  defaultValue?: number[];
  label: string;
  name: string;
  emptyMessage?: string;
}) {
  const [selected, setSelected] = useState(defaultValue);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const search = useRef<HTMLInputElement>(null);
  const listId = useId();
  const available = new Set(users.map((user) => user.id));
  const ids = selected.filter((id) => available.has(id));
  const matches = users.filter(
    (user) => !ids.includes(user.id) && matchesPerson(user, query),
  );
  return (
    <Field label={label}>
      <div
        className="multi-person"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node))
            setOpen(false);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            search.current?.focus();
          }
        }}
      >
        {ids.map((id) => (
          <input key={id} type="hidden" name={name} value={id} />
        ))}
        <div className="person-chips">
          <Users size={17} aria-hidden="true" />
          {ids.map((id) => (
            <span key={id} className="person-chip">
              {users.find((user) => user.id === id)?.name}
              <button
                type="button"
                aria-label={
                  "حذف از انتخاب: " + users.find((user) => user.id === id)?.name
                }
                onClick={() => {
                  setSelected(ids.filter((value) => value !== id));
                  search.current?.focus();
                }}
              >
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
        <input
          ref={search}
          className={input}
          value={query}
          required={!ids.length}
          autoComplete="off"
          aria-label={label}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          placeholder="جستجو با نام یا نام کاربری…"
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && open) {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
            }
            if (event.key === "Enter" && open) event.preventDefault();
            if (event.key === "ArrowDown") {
              event.preventDefault();
              document
                .getElementById(listId)
                ?.querySelector<HTMLButtonElement>("button")
                ?.focus();
            }
          }}
        />
        {open && (
          <div
            id={listId}
            role="listbox"
            aria-label="انجام‌دهندگان قابل انتخاب"
            aria-multiselectable="true"
            className="multi-person-options"
          >
            {matches.map((user) => (
              <button
                type="button"
                role="option"
                aria-selected={false}
                key={user.id}
                onClick={() => {
                  setSelected([...ids, user.id]);
                  setQuery("");
                  search.current?.focus();
                }}
                className="person-option"
              >
                <strong>{user.name}</strong>
                {user.username && <small dir="ltr">{user.username}</small>}
                <small>
                  {user.position || user.unit || user.companies?.join("، ")}
                </small>
              </button>
            ))}
            {!matches.length && (
              <p className="p-3 text-xs text-slate-500">
                {!users.length
                  ? emptyMessage
                  : ids.length === users.length
                    ? "همه افراد مجاز انتخاب شده‌اند."
                    : "فردی با این نام یا نام کاربری یافت نشد."}
              </p>
            )}
          </div>
        )}
        <small className="form-context">
          {!users.length
            ? emptyMessage
            : ids.length
              ? `${fa(ids.length)} نفر انتخاب شده`
              : "حداقل یک نفر را از فهرست انتخاب کنید."}
        </small>
      </div>
    </Field>
  );
}
