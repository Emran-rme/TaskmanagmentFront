export function SettingsToggle({
  label,
  description,
  checked,
  onChange,
  name,
  defaultChecked,
}: {
  label: string;
  description?: string;
  checked?: boolean;
  onChange?: (value: boolean) => void;
  name?: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-white/70 dark:border-white/10 bg-white/45 dark:bg-slate-800/50 p-4 transition hover:bg-white/80 dark:hover:bg-slate-800/80">
      <span>
        <span className="block text-sm font-bold text-navy dark:text-sky-50">
          {label}
        </span>
        {description && (
          <span className="mt-1 block text-xs leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </span>
        )}
      </span>
      <span className="relative shrink-0">
        <input
          className="peer sr-only"
          type="checkbox"
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
        />
        <span className="block h-6 w-11 rounded-full bg-slate-300 dark:bg-slate-600 transition peer-checked:bg-brand peer-focus-visible:ring-4 peer-focus-visible:ring-sky-200" />
        <span className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-white dark:bg-slate-100 shadow transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}
