import { useEffect, useRef, useState } from "react";
export function SelectionToggle({
  values,
  selected,
  onChange,
  label = "انتخاب همه",
  disabled = false,
}: {
  values: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  label?: string;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const count = values.filter((value) => selected.includes(value)).length;
  useEffect(() => {
    if (ref.current)
      ref.current.indeterminate = count > 0 && count < values.length;
  }, [count, values.length]);
  return (
    <label className="selection-toggle">
      <input
        ref={ref}
        type="checkbox"
        disabled={disabled || !values.length}
        checked={!!values.length && count === values.length}
        onChange={(event) =>
          onChange(
            event.target.checked
              ? Array.from(new Set([...selected, ...values]))
              : selected.filter((value) => !values.includes(value)),
          )
        }
      />
      <span>{label}</span>
      <small>
        {count.toLocaleString("fa-IR")} /{" "}
        {values.length.toLocaleString("fa-IR")}
      </small>
    </label>
  );
}
export default function CheckboxList({
  name,
  items,
  defaultValues = [],
  disabled = false,
}: {
  name: string;
  items: { value: string; label: string }[];
  defaultValues?: string[];
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState(defaultValues);
  return (
    <div className="checkbox-list">
      <SelectionToggle
        values={items.map((item) => item.value)}
        selected={selected}
        onChange={setSelected}
        disabled={disabled}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <label key={item.value} className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              name={name}
              value={item.value}
              disabled={disabled}
              checked={selected.includes(item.value)}
              onChange={(event) =>
                setSelected((previous) =>
                  event.target.checked
                    ? [...previous, item.value]
                    : previous.filter((value) => value !== item.value),
                )
              }
            />
            {item.label}
          </label>
        ))}
      </div>
    </div>
  );
}
