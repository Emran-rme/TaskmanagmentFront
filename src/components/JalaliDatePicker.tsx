import { useState } from "react";
import Modal from "./Modal";
import { toJalaali } from "jalaali-js";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  months,
  weekdays,
  iso,
  parse,
  jalali,
  fa,
  gregorian,
  monthDays,
  shiftMonth,
} from "../lib/jalali";
export default function JalaliDatePicker({
  name,
  required = false,
  defaultValue = "",
  label = "انتخاب تاریخ شمسی",
}: {
  name: string;
  required?: boolean;
  defaultValue?: string;
  label?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [cursor, setCursor] = useState(
    defaultValue ? parse(defaultValue) : new Date(),
  );
  const j = toJalaali(cursor);
  const days = monthDays(cursor);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        className="flex w-full min-h-11 cursor-pointer items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-xs"
      >
        <span>
          {value ? jalali(value) : label}
          {required && !value ? " *" : ""}
        </span>
        <CalendarDays size={16} className="text-sky-600 dark:text-sky-300" />
      </button>
      {open && (
        <Modal
          title={label}
          onClose={() => setOpen(false)}
          compact
          className="jalali-picker-dialog"
        >
          <div>
            <div className="mb-3 flex items-center gap-1">
              <button
                aria-label="ماه قبل"
                type="button"
                className="p-2 text-sky-700 dark:text-sky-200"
                onClick={() => setCursor(shiftMonth(cursor, -1))}
              >
                <ChevronRight size={16} />
              </button>
              <select
                aria-label="ماه شمسی"
                className="min-w-0 flex-1 rounded-lg bg-sky-50 dark:bg-sky-950/70 p-1 text-xs"
                value={j.jm}
                onChange={(e) =>
                  setCursor(gregorian(j.jy, Number(e.target.value), 1))
                }
              >
                {months.map((m, i) => (
                  <option key={m} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                aria-label="سال شمسی"
                className="rounded-lg bg-sky-50 dark:bg-sky-950/70 p-1 text-xs"
                value={j.jy}
                onChange={(e) =>
                  setCursor(gregorian(Number(e.target.value), j.jm, 1))
                }
              >
                {Array.from({ length: 201 }, (_, i) => 1300 + i).map((y) => (
                  <option value={y} key={y}>
                    {fa(y)}
                  </option>
                ))}
              </select>
              <button
                aria-label="ماه بعد"
                type="button"
                className="p-2 text-sky-700 dark:text-sky-200"
                onClick={() => setCursor(shiftMonth(cursor, 1))}
              >
                <ChevronLeft size={16} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {weekdays.map((w) => (
                <span
                  className="text-center text-[10px] text-slate-400"
                  key={w}
                >
                  {w[0]}
                </span>
              ))}
              {Array.from({ length: (days[0].getDay() + 1) % 7 }, (_, i) => (
                <span key={`b${i}`} />
              ))}
              {days.map((d) => (
                <button
                  type="button"
                  key={iso(d)}
                  aria-label={jalali(iso(d))}
                  className={`h-8 rounded-lg text-xs ${value === iso(d) ? "bg-sky-600 text-white" : "hover:bg-sky-50 dark:hover:bg-sky-950/70"}`}
                  onClick={() => {
                    setValue(iso(d));
                    setOpen(false);
                  }}
                >
                  {fa(toJalaali(d).jd)}
                </button>
              ))}
            </div>
            <div className="mt-3 flex justify-between">
              <button
                type="button"
                className="text-xs text-sky-600 dark:text-sky-300"
                onClick={() => {
                  setValue(iso(new Date()));
                  setCursor(new Date());
                  setOpen(false);
                }}
              >
                امروز
              </button>
              {!required && (
                <button
                  type="button"
                  className="text-xs text-slate-500 dark:text-slate-400"
                  onClick={() => setValue("")}
                >
                  پاک کردن
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
