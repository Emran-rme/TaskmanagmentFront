import { toGregorian, toJalaali, jalaaliMonthLength } from "jalaali-js";
export const months = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];
export const weekdays = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];
export const fa = (n: number) =>
  n.toLocaleString("fa-IR", { useGrouping: false });
export const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const parse = (s: string) => new Date(`${s.slice(0, 10)}T12:00:00`);
export const jalali = (s: string) => {
  const j = toJalaali(parse(s));
  return `${fa(j.jy)}/${fa(j.jm).padStart(2, "۰")}/${fa(j.jd).padStart(2, "۰")}`;
};
export function gregorian(jy: number, jm: number, jd: number) {
  const g = toGregorian(jy, jm, jd);
  return new Date(g.gy, g.gm - 1, g.gd, 12);
}
export function shiftMonth(d: Date, n: number) {
  const j = toJalaali(d);
  const monthIndex = j.jy * 12 + j.jm - 1 + n;
  const y = Math.floor(monthIndex / 12),
    m = (((monthIndex % 12) + 12) % 12) + 1;
  return gregorian(y, m, Math.min(j.jd, jalaaliMonthLength(y, m)));
}
export function monthDays(d: Date) {
  const j = toJalaali(d);
  return Array.from({ length: jalaaliMonthLength(j.jy, j.jm) }, (_, i) =>
    gregorian(j.jy, j.jm, i + 1),
  );
}
export function weekDays(d: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const n = new Date(d);
    n.setDate(n.getDate() - ((n.getDay() + 1) % 7) + i);
    return n;
  });
}
