import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Puzzle,
  Plus,
  Save,
  Send,
  Settings2,
  CheckCircle2,
} from "lucide-react";
import {
  useModulesQuery,
  useMutateMutation,
  errorText,
  type RootState,
} from "../store";
import {
  Card,
  Field,
  input,
  button,
  secondary,
  ErrorBox,
  Loading,
} from "../components/ui";
import { SettingsToggle } from "../components/SettingsToggle";
import type { ModuleDefinition, ModuleInstallation } from "../lib/modules";

export default function Modules() {
  const admin = useSelector((s: RootState) => s.auth.user?.role === "Admin");
  const { data, error } = useModulesQuery(undefined, { skip: !admin });
  const [mutate, { isLoading }] = useMutateMutation();
  const [feedback, setFeedback] = useState({ error: "", message: "" });
  if (!admin)
    return (
      <ErrorBox message="مدیریت ماژول‌ها فقط برای مدیر سیستم در دسترس است." />
    );
  if (error) return <ErrorBox message={errorText(error)} />;
  if (!data) return <Loading />;
  const active = data.installed.find(
    (m) =>
      m.enabled &&
      data.catalog.find((d) => d.id === m.id)?.capability === "sms",
  );
  const activeDefinition = data.catalog.find((m) => m.id === active?.id);
  async function action(url: string, method = "POST", body?: unknown) {
    setFeedback({ error: "", message: "" });
    try {
      const result = await mutate({
        url: "settings/modules/" + url,
        method,
        body,
      }).unwrap();
      setFeedback({
        error: "",
        message:
          (result?.message || "ماژول حذف شد و قابل بازیابی است.") +
          (result?.reference ? " شناسه پیام: " + result.reference : ""),
      });
      return true;
    } catch (e) {
      setFeedback({ error: errorText(e), message: "" });
      return false;
    }
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-navy dark:text-sky-50">
            <Puzzle className="text-brand dark:text-sky-300" />
            مدیریت ماژول‌ها
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            افزودن قابلیت‌ها و اتصال آن‌ها به گردش کار سازمان
          </p>
        </div>
        <Link to="/settings" className={secondary}>
          <Settings2 size={17} />
          تنظیمات اعلان و گیرندگان
        </Link>
      </div>
      <Card title="مسیر اجرای پیامک در گردش کار">
        <div className="grid gap-3 md:grid-cols-3">
          {[
            "۱ · رویداد وظیفه یا یادآوری مهلت",
            "۲ · ثبت اعلان در صف SQL",
            "۳ · " + (activeDefinition?.name || "ماژول فعالی انتخاب نشده"),
          ].map((t) => (
            <div
              key={t}
              className="rounded-2xl border border-white/80 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 p-4 text-sm text-navy dark:text-sky-50"
            >
              {t}
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs leading-7 text-slate-500 dark:text-slate-400">
          {activeDefinition
            ? data.smsWorkflowEnabled
              ? "ماژول فعال به اعلان‌های گردش کار متصل است."
              : "ماژول فعال است اما کانال پیامک در تنظیمات گردش کار خاموش است."
            : "ماژول را از کاتالوگ اضافه کنید، تنظیمات را تکمیل و فعال کنید."}{" "}
          فعال‌سازی، کانال پیامک گردش کار را روشن می‌کند. هر بار یک ماژول پیامکی
          فعال است؛ در صورت خطا، ارسال به ارائه‌دهنده دیگری منتقل نمی‌شود.
        </p>
      </Card>
      <div aria-live="polite">
        {feedback.error && <ErrorBox message={feedback.error} />}{" "}
        {feedback.message && (
          <p className="flex gap-2 rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/70 p-4 text-sm leading-7 text-sky-700 dark:text-sky-200">
            <CheckCircle2 className="shrink-0" size={20} />
            {feedback.message}
          </p>
        )}
      </div>
      <Card title="ماژول‌های گردش کار">
        <p className="text-sm leading-8 text-slate-600 dark:text-slate-300">
          ماژول‌های آماده را از کاتالوگ اضافه کنید. برای هر ماژول گردش کار،
          تنظیمات و رویدادهای دلخواه را انتخاب کنید؛ چند ماژول گردش کار
          می‌توانند هم‌زمان فعال باشند. نتیجه اجرا و تلاش مجدد در مرکز اعلان‌ها
          قابل پیگیری است. ماژول‌های جدید پس از پیاده‌سازی و استقرار، خودکار به
          این کاتالوگ اضافه می‌شوند.
        </p>
      </Card>
      <div>
        <h2 className="mb-4 text-lg font-bold text-navy dark:text-sky-50">
          کاتالوگ ماژول‌ها
        </h2>
        <div className="grid gap-5 lg:grid-cols-2">
          {data.catalog.map((def) => {
            const installed = data.installed.find((m) => m.id === def.id);
            const deleted = data.deleted?.some((m) => m.id === def.id);
            return (
              <Card
                key={def.id}
                title={def.name}
                action={
                  <span className="rounded-lg bg-white/70 dark:bg-slate-800/70 px-2 py-1 text-xs text-brand dark:text-sky-300">
                    نسخه {def.version}
                  </span>
                }
              >
                <p className="mb-5 text-sm leading-8 text-slate-500 dark:text-slate-400">
                  {def.description}
                </p>
                <p className="mb-4 text-xs text-brand dark:text-sky-300">
                  {def.capability === "workflow"
                    ? "اتصال به رویدادهای گردش کار"
                    : "ارائه‌دهنده پیامک"}
                </p>
                <button
                  disabled={!!installed || isLoading}
                  className={installed ? secondary : button}
                  onClick={() =>
                    void action(def.id + (deleted ? "/restore" : ""))
                  }
                >
                  <Plus size={16} />
                  {installed
                    ? "به سامانه اضافه شده"
                    : deleted
                      ? "بازیابی ماژول"
                      : "افزودن ماژول"}
                </button>
              </Card>
            );
          })}
        </div>
      </div>
      <div>
        <h2 className="mb-4 text-lg font-bold text-navy dark:text-sky-50">
          ماژول‌های اضافه‌شده
        </h2>
        {!data.installed.length ? (
          <Card>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              هنوز ماژولی اضافه نشده است.
            </p>
          </Card>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-2">
            {data.installed.map((installed) => {
              const def = data.catalog.find((d) => d.id === installed.id);
              return def ? (
                <ModuleForm
                  key={JSON.stringify(installed)}
                  definition={def}
                  installed={installed}
                  eventNames={data.events}
                  busy={isLoading}
                  action={action}
                />
              ) : null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ModuleForm({
  definition,
  installed,
  eventNames,
  busy,
  action,
}: {
  definition: ModuleDefinition;
  installed: ModuleInstallation;
  eventNames: { id: string; name: string }[];
  busy: boolean;
  action: (url: string, method?: string, body?: unknown) => Promise<boolean>;
}) {
  const [enabled, setEnabled] = useState(installed.enabled);
  const [values, setValues] = useState(installed.values);
  const [events, setEvents] = useState(installed.events || []);
  const [phone, setPhone] = useState("");
  const [dirty, setDirty] = useState(false);
  const ready = definition.fields.every(
    (f) =>
      !f.required || !!installed.values[f.key] || !!installed.secrets[f.key],
  );
  return (
    <Card
      title={definition.name}
      action={
        <span
          className={
            installed.enabled
              ? "rounded-lg bg-sky-50 dark:bg-sky-950/70 px-3 py-1 text-xs text-brand dark:text-sky-300"
              : "rounded-lg bg-slate-100 dark:bg-slate-700 px-3 py-1 text-xs text-slate-500 dark:text-slate-400"
          }
        >
          {installed.enabled ? "فعال در گردش کار" : "غیرفعال"}
        </span>
      }
    >
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          if (
            await action(installed.id, "PUT", {
              id: installed.id,
              enabled,
              values,
              events,
            })
          )
            setDirty(false);
        }}
      >
        {definition.fields.map((f) => (
          <div key={f.key}>
            <Field label={f.label}>
              <input
                className={input}
                dir="ltr"
                type={f.type}
                value={values[f.key] || ""}
                autoComplete={f.type === "password" ? "new-password" : "off"}
                required={enabled && f.required && !installed.secrets[f.key]}
                placeholder={
                  installed.secrets[f.key]
                    ? "ذخیره شده؛ خالی یعنی حفظ مقدار قبلی"
                    : ""
                }
                onChange={(e) => {
                  setValues((v) => ({ ...v, [f.key]: e.target.value }));
                  setDirty(true);
                }}
              />
            </Field>
            {f.hint && (
              <p className="mt-2 text-xs leading-6 text-slate-500 dark:text-slate-400">
                {f.hint}
              </p>
            )}
          </div>
        ))}
        {definition.capability === "workflow" && (
          <fieldset className="space-y-3 rounded-2xl border border-white/70 dark:border-white/10 bg-white/30 dark:bg-slate-800/50 p-4">
            <legend className="px-2 text-sm font-bold text-navy dark:text-sky-50">
              رویدادهای اجرای ماژول
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {definition.events?.map((id) => (
                <label key={id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-sky-600"
                    checked={events.includes(id)}
                    onChange={(e) => {
                      setEvents((old) =>
                        e.target.checked
                          ? [...old, id]
                          : old.filter((x) => x !== id),
                      );
                      setDirty(true);
                    }}
                  />
                  {eventNames.find((e) => e.id === id)?.name || id}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <SettingsToggle
          label="فعال در گردش کار"
          description={
            definition.capability === "workflow"
              ? "این ماژول برای رویدادهای انتخاب‌شده اجرا می‌شود؛ مستقل از کانال پیامک."
              : "این ماژول برای پیامک‌های وظایف و یادآوری‌ها استفاده می‌شود."
          }
          checked={enabled}
          onChange={(v) => {
            setEnabled(v);
            setDirty(true);
          }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button className={button} disabled={busy}>
            <Save size={16} />
            ذخیره ماژول
          </button>
          {dirty && (
            <span className="text-xs text-amber-700 dark:text-amber-300">
              تغییرات ذخیره نشده است.
            </span>
          )}
          <button
            type="button"
            disabled={busy}
            className="mr-auto rounded-xl px-3 py-2 text-xs text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/70"
            onClick={() => {
              if (
                confirm("این ماژول حذف شود؟ تنظیمات برای بازیابی حفظ می‌شود.")
              )
                void action(installed.id, "DELETE");
            }}
          >
            حذف ماژول
          </button>
        </div>
      </form>
      {definition.capability === "sms" ? (
        <div className="mt-6 space-y-3 border-t border-white/80 dark:border-white/10 pt-5">
          <Field label="موبایل گیرنده آزمایشی">
            <input
              className={input}
              dir="ltr"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0912…"
            />
          </Field>
          <button
            className={secondary}
            disabled={busy || dirty || !ready || !phone}
            onClick={() =>
              void action(installed.id + "/test", "POST", { to: phone })
            }
          >
            <Send size={16} />
            ارسال پیامک آزمایشی
          </button>
          <p className="text-xs leading-7 text-slate-500 dark:text-slate-400">
            ارسال آزمایشی واقعی است و ممکن است هزینه داشته باشد؛ ابتدا تنظیمات
            را ذخیره کنید. موبایل کاربران را در تنظیمات ← گیرندگان ثبت کنید.
          </p>
        </div>
      ) : (
        <p className="mt-5 text-xs leading-7 text-slate-500 dark:text-slate-400">
          پس از ذخیره و فعال‌سازی، با انجام یکی از رویدادهای انتخاب‌شده اجرا
          می‌شود. گزارش اجرا با عنوان این ماژول در مرکز اعلان‌ها ثبت می‌شود.
        </p>
      )}
    </Card>
  );
}
