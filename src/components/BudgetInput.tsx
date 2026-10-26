import { useState } from "react";
import { input } from "./ui";
const ones = [
  "",
  "یک",
  "دو",
  "سه",
  "چهار",
  "پنج",
  "شش",
  "هفت",
  "هشت",
  "نه",
  "ده",
  "یازده",
  "دوازده",
  "سیزده",
  "چهارده",
  "پانزده",
  "شانزده",
  "هفده",
  "هجده",
  "نوزده",
];
const tens = [
  "",
  "",
  "بیست",
  "سی",
  "چهل",
  "پنجاه",
  "شصت",
  "هفتاد",
  "هشتاد",
  "نود",
];
const hundreds = [
  "",
  "صد",
  "دویست",
  "سیصد",
  "چهارصد",
  "پانصد",
  "ششصد",
  "هفتصد",
  "هشتصد",
  "نهصد",
];
export function amountWords(value: string): string {
  let n = BigInt(value || "0");
  if (!n) return "صفر ریال";
  const parts: string[] = [];
  const scales = ["", "هزار", "میلیون", "میلیارد", "تریلیون", "کوادریلیون"];
  let i = 0;
  while (n > 0n) {
    const group = Number(n % 1000n),
      rest = group % 100;
    if (group)
      parts.unshift(
        [
          hundreds[Math.floor(group / 100)],
          rest < 20
            ? ones[rest]
            : [tens[Math.floor(rest / 10)], ones[rest % 10]]
                .filter(Boolean)
                .join(" و "),
        ]
          .filter(Boolean)
          .join(" و ") + (scales[i] ? " " + scales[i] : ""),
      );
    n /= 1000n;
    i++;
  }
  return parts.join(" و ") + " ریال";
}
export default function BudgetInput({
  defaultValue = 0,
}: {
  defaultValue?: number;
}) {
  const [value, setValue] = useState(String(defaultValue));
  return (
    <>
      <input type="hidden" name="budget" value={value || "0"} />
      <input
        className={input}
        aria-label="بودجه (ریال)"
        inputMode="numeric"
        dir="ltr"
        value={value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        onChange={(e) => {
          const digits = e.target.value
            .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776))
            .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
            .replace(/[,٬\s]/g, "");
          if (/^\d{0,15}$/.test(digits))
            setValue(digits.replace(/^0+(?=\d)/, ""));
        }}
      />
      <small className="form-context" aria-live="polite">
        {amountWords(value)}
      </small>
    </>
  );
}
