import { APP_NAME } from "../lib/branding";

export default function Brand({ large = false }: { large?: boolean }) {
  return (
    <div className={large ? "flex flex-col items-center gap-3 w-full text-center" : "flex items-center gap-3"}>
      <img
        src="/branding/fanaone-logo.webp"
        alt="نشان سامانه"
        className={
          large
            ? "h-32 w-52 rounded-3xl object-cover"
            : "h-14 w-24 rounded-2xl object-cover"
        }
      />
        <div>
          <p className="font-bold text-navy dark:text-white">
            {APP_NAME}
          </p>
          <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
            پروژه‌ها · تیم‌ها · دستاوردها
          </p>
        </div>
    </div>
  );
}
