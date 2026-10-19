import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      let preference: string | null = null;
      try {
        preference = localStorage.getItem("tm-theme");
      } catch {
        /* Storage may be unavailable. */
      }
      const next =
        preference === "dark" || (preference !== "light" && media.matches);
      document.documentElement.classList.toggle("dark", next);
      setDark(next);
    };
    media.addEventListener("change", sync);
    window.addEventListener("storage", sync);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const label = dark ? "فعال‌سازی حالت روشن" : "فعال‌سازی حالت تیره";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={dark}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/40 text-sky-800 shadow-sm transition hover:bg-white/80 dark:border-white/10 dark:bg-slate-800/80 dark:text-sky-200 dark:hover:bg-slate-700"
      onClick={() => {
        const next = !dark;
        document.documentElement.classList.toggle("dark", next);
        setDark(next);
        try {
          localStorage.setItem("tm-theme", next ? "dark" : "light");
        } catch {
          /* Keep the current session preference. */
        }
      }}
    >
      {dark ? <Sun size={21} /> : <Moon size={21} />}
    </button>
  );
}
