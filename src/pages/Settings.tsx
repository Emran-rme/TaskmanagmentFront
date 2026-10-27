import { useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Bell,
  ShieldCheck,
  Mail,
  Users,
  Network,
  MessageSquare,
  Save,
  Send,
} from "lucide-react";
import {
  useWorkspaceQuery,
  useIntegrationsQuery,
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
import SettingsNavigation from "../components/SettingsNavigation";
import type {
  IntegrationOptions,
  IntegrationResponse,
} from "../lib/integrations";

export default function Settings() {
  const { data: w, error } = useWorkspaceQuery();
  const admin = useSelector((s: RootState) => s.auth.user?.role === "Admin");
  const integrations = useIntegrationsQuery(undefined, { skip: !admin });
  const modules = useModulesQuery(undefined, { skip: !admin });
  const [tab, setTab] = useState("workflow");
  if (error) return <ErrorBox message={errorText(error)} />;
  if (!w) return <Loading />;
  const tabs = [
    { id: "workflow", label: "گردش کار و اعلان‌ها", icon: Bell },
    ...(admin
      ? [
          { id: "ldap", label: "اتصال LDAP", icon: Network },
          { id: "email", label: "سرویس ایمیل", icon: Mail },
          { id: "sms", label: "درگاه پیامک", icon: MessageSquare },
          { id: "contacts", label: "گیرندگان", icon: Users },
        ]
      : []),
  ];
  return (
    <div className="space-y-6">
      <SettingsNavigation />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-sky-50">
            تنظیمات سامانه
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            مدیریت گردش کار، اتصال سازمانی و کانال‌های اطلاع‌رسانی
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-2xl border border-white/80 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 px-4 py-3 text-xs text-brand dark:text-sky-300">
          <ShieldCheck size={18} />{" "}
          {admin ? "دسترسی مدیر سیستم" : "مدیریت گردش کار"}
        </span>
      </div>
      <nav
        aria-label="بخش‌های تنظیمات"
        className="flex flex-wrap gap-2 rounded-md border border-white/70 dark:border-white/10 bg-white/35 dark:bg-slate-800/50 p-2"
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            aria-current={tab === id ? "page" : undefined}
            onClick={() => setTab(id)}
            className={tab === id ? button : secondary}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>
      {tab === "workflow" ? (
        <Workflow settings={w.settings} />
      ) : tab === "sms" ? (
        <Card title="ماژول‌های پیامک">
          <p className="mb-4 text-sm leading-8 text-slate-500 dark:text-slate-400">
            نواوران موج، کاوه‌نگار و درگاه عمومی از بخش مدیریت ماژول‌ها اضافه و تنظیم
            می‌شوند. ماژول فعال، پیامک‌های وظایف و یادآوری را از صف ارسال دریافت
            می‌کند.
          </p>
          <p className="mb-5 text-sm text-navy dark:text-sky-50">
            ماژول فعال:{" "}
            {modules.data?.catalog.find(
              (d) =>
                d.id === modules.data?.installed.find((m) => m.enabled)?.id,
            )?.name || "انتخاب نشده"}
          </p>
          <Link className={button} to="/modules">
            مدیریت ماژول‌ها و تنظیم نواوران موج
          </Link>
        </Card>
      ) : integrations.error ? (
        <ErrorBox message={errorText(integrations.error)} />
      ) : !integrations.data ? (
        <Loading />
      ) : (
        <Connections key={tab} data={integrations.data} tab={tab} />
      )}
      {!admin && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          تنظیمات اتصال و اطلاعات محرمانه فقط برای مدیر سیستم در دسترس است.
        </p>
      )}
    </div>
  );
}

function Workflow({
  settings,
}: {
  settings: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
    approval: boolean;
    reminder: number;
  };
}) {
  const admin = useSelector((s: RootState) => s.auth.user?.role === "Admin");
  const [mutate, { isLoading }] = useMutateMutation();
  const [feedback, setFeedback] = useState({ error: "", message: "" });
  return (
    <form
      key={JSON.stringify(settings)}
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setFeedback({ error: "", message: "" });
        try {
          await mutate({
            url: "settings",
            method: "PUT",
            body: {
              email: f.has("email"),
              sms: admin ? f.has("sms") : settings.sms,
              inApp: f.has("inApp"),
              approval: f.has("approval"),
              reminder: Number(f.get("reminder")),
            },
          }).unwrap();
          setFeedback({ error: "", message: "تنظیمات گردش کار ذخیره شد." });
        } catch (err) {
          setFeedback({ error: errorText(err), message: "" });
        }
      }}
      className="grid items-start gap-5 xl:grid-cols-3"
    >
      <Card title="کانال‌های اطلاع‌رسانی" className="xl:col-span-2">
        <p className="mb-5 text-xs leading-7 text-slate-500 dark:text-slate-400">
          اعلان‌ها هنگام ارجاع، تغییر وضعیت و یادآوری مهلت ایجاد می‌شوند. برای
          ارسال بیرونی، سرویس اتصال و اطلاعات گیرندگان را تکمیل کنید.
        </p>
        <div className="space-y-3">
          {[
            ["inApp", "اعلان درون‌برنامه‌ای", "نمایش در مرکز اعلان‌های سامانه"],
            ["email", "اعلان ایمیلی", "ارسال از طریق سرور SMTP تنظیم‌شده"],
            ["sms", "اعلان پیامکی", "ارسال از طریق درگاه HTTPS تنظیم‌شده"],
          ]
            .filter(([name]) => name !== "sms" || admin)
            .map(([name, label, description]) => (
              <SettingsToggle
                key={name}
                name={name}
                label={label}
                description={description}
                defaultChecked={settings[name as "email" | "sms" | "inApp"]}
              />
            ))}
        </div>
      </Card>
      <Card title="قواعد ارزیابی و یادآوری">
        <div className="space-y-5">
          <SettingsToggle
            name="approval"
            label="تأیید تکمیل توسط مدیر"
            description="پیش از بستن وظیفه، نتیجه توسط مدیر بررسی شود."
            defaultChecked={settings.approval}
          />
          <Field label="یادآوری پیش از مهلت (روز)">
            <input
              className={input}
              name="reminder"
              type="number"
              min="0"
              max="30"
              defaultValue={settings.reminder}
              required
            />
          </Field>
          <p className="text-xs leading-7 text-slate-500 dark:text-slate-400">
            بین صفر تا ۳۰ روز؛ یادآوری‌ها هر پنج دقیقه بررسی می‌شوند.
          </p>
          <Feedback {...feedback} />
          <button disabled={isLoading} className={button}>
            <Save size={16} />
            {isLoading ? "در حال ذخیره…" : "ذخیره تنظیمات"}
          </button>
        </div>
      </Card>
    </form>
  );
}

function Feedback({ error, message }: { error: string; message: string }) {
  return (
    <div aria-live="polite">
      {error && <ErrorBox message={error} />}{" "}
      {message && (
        <p className="rounded-2xl bg-sky-50 dark:bg-sky-950/70 p-3 text-sm leading-7 text-sky-700 dark:text-sky-200">
          {message}
        </p>
      )}
    </div>
  );
}

function Connections({
  data,
  tab,
}: {
  data: IntegrationResponse;
  tab: string;
}) {
  const [options, setOptions] = useState<IntegrationOptions>(() =>
    structuredClone(data.options),
  );
  const [mutate, { isLoading }] = useMutateMutation();
  const [feedback, setFeedback] = useState({ error: "", message: "" });
  const [testTo, setTestTo] = useState("");
  const [dirty, setDirty] = useState(false);
  const [secretFlags, setSecretFlags] = useState(data.secrets);
  function change(
    section: "ldap" | "email" | "sms",
    key: string,
    value: string | number | boolean,
  ) {
    setOptions((o) => ({ ...o, [section]: { ...o[section], [key]: value } }));
    setDirty(true);
    setFeedback({ error: "", message: "" });
  }
  async function action(test?: string) {
    setFeedback({ error: "", message: "" });
    try {
      const result = await mutate(
        test
          ? { url: "settings/integrations/test-" + test, body: { to: testTo } }
          : { url: "settings/integrations", method: "PUT", body: options },
      ).unwrap();
      if (!test) {
        setDirty(false);
        setSecretFlags({
          ldapPassword: secretFlags.ldapPassword || !!options.ldap.bindPassword,
          emailPassword: secretFlags.emailPassword || !!options.email.password,
          smsToken: secretFlags.smsToken || !!options.sms.token,
        });
        setOptions((o) => ({
          ...o,
          ldap: { ...o.ldap, bindPassword: "" },
          email: { ...o.email, password: "" },
          sms: { ...o.sms, token: "" },
        }));
      }
      setFeedback({ error: "", message: result.message });
    } catch (err) {
      setFeedback({ error: errorText(err), message: "" });
    }
  }
  function text(
    section: "ldap" | "email" | "sms",
    key: string,
    label: string,
    type = "text",
    placeholder = "",
  ) {
    const value = (
      options[section] as unknown as Record<string, string | number>
    )[key];
    return (
      <Field label={label}>
        <input
          className={input}
          dir="ltr"
          type={type}
          autoComplete={type === "password" ? "new-password" : "off"}
          value={value}
          onChange={(e) =>
            change(
              section,
              key,
              type === "number" ? Number(e.target.value) : e.target.value,
            )
          }
          placeholder={placeholder}
          min={type === "number" ? 1 : undefined}
          max={type === "number" ? 65535 : undefined}
        />
      </Field>
    );
  }
  const titles: Record<string, string> = {
    ldap: "اتصال به دایرکتوری سازمان",
    email: "تنظیمات سرور ایمیل",
    sms: "اتصال به درگاه پیامک",
    contacts: "اطلاعات تماس گیرندگان",
  };
  return (
    <div className="grid items-start gap-5 xl:grid-cols-3">
      <Card title={titles[tab]} className="xl:col-span-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void action();
          }}
          className="space-y-5"
        >
          {tab === "ldap" && (
            <>
              <SettingsToggle
                label="فعال‌سازی ورود LDAP"
                description="OpenLDAP یا Active Directory؛ کاربران و دسترسی‌ها در بخش کاربران تعریف می‌شوند."
                checked={options.ldap.enabled}
                onChange={(v) => change("ldap", "enabled", v)}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                {text("ldap", "host", "آدرس سرور")}
                {text("ldap", "port", "پورت", "number")}
                {text("ldap", "baseDn", "Base DN")}
                {text("ldap", "bindDn", "Bind DN / حساب اتصال")}
                {text(
                  "ldap",
                  "bindPassword",
                  "رمز حساب اتصال",
                  "password",
                  secretFlags.ldapPassword
                    ? "رمز ذخیره شده؛ خالی یعنی حفظ رمز"
                    : "رمز حساب سرویس",
                )}
                {text(
                  "ldap",
                  "userAttribute",
                  "ویژگی نام کاربری (uid یا sAMAccountName)",
                )}
              </div>
              <SettingsToggle
                label="اتصال امن LDAPS"
                checked={options.ldap.useSsl}
                onChange={(v) => change("ldap", "useSsl", v)}
              />
              <SettingsToggle
                label="مجوز اتصال بدون TLS در محیط آزمایشی"
                description="فقط برای OpenLDAP محلی؛ در محیط سازمانی LDAPS را فعال کنید."
                checked={options.ldap.allowInsecureDevelopment}
                onChange={(v) => change("ldap", "allowInsecureDevelopment", v)}
              />
            </>
          )}
          {tab === "email" && (
            <>
              <SettingsToggle
                label="فعال‌سازی ارسال ایمیل"
                checked={options.email.enabled}
                onChange={(v) => change("email", "enabled", v)}
              />
              <div className="grid gap-5 sm:grid-cols-2">
                {text("email", "host", "سرور SMTP")}
                {text("email", "port", "پورت SMTP", "number")}
                {text("email", "username", "نام کاربری SMTP (در صورت نیاز)")}
                {text(
                  "email",
                  "password",
                  "رمز SMTP",
                  "password",
                  secretFlags.emailPassword
                    ? "رمز ذخیره شده؛ خالی یعنی حفظ رمز"
                    : "برای Mailpit خالی بگذارید",
                )}
                {text("email", "fromAddress", "ایمیل فرستنده", "email")}
                {text("email", "fromName", "نام فرستنده")}
              </div>
              <SettingsToggle
                label="رمزنگاری STARTTLS"
                description="برای سرویس واقعی معمولاً پورت ۵۸۷؛ Mailpit محلی بدون TLS و پورت ۱۰۲۵."
                checked={options.email.startTls}
                onChange={(v) => change("email", "startTls", v)}
              />
            </>
          )}
          {tab === "sms" && (
            <>
              <SettingsToggle
                label="فعال‌سازی درگاه پیامک"
                checked={options.sms.enabled}
                onChange={(v) => change("sms", "enabled", v)}
              />
              {text(
                "sms",
                "url",
                "نشانی HTTPS درگاه",
                "url",
                "https://sms.example.com/send",
              )}
              {text(
                "sms",
                "token",
                "توکن درگاه",
                "password",
                secretFlags.smsToken
                  ? "توکن ذخیره شده؛ خالی یعنی حفظ توکن"
                  : "Bearer token",
              )}
              <p className="rounded-2xl bg-white/60 dark:bg-slate-800/60 p-4 text-xs leading-7 text-slate-500 dark:text-slate-400">
                درگاه باید درخواست POST با بدنه JSON شامل to و message و هدر
                Authorization: Bearer را بپذیرد. برای سرویس‌دهنده‌های دیگر، یک
                مبدل مطابق این قرارداد لازم است.
              </p>
            </>
          )}
          {tab === "contacts" && (
            <>
              <p className="text-xs leading-7 text-slate-500 dark:text-slate-400">
                آدرس واقعی کاربران برای ارسال اعلان استفاده می‌شود. نبود اطلاعات
                تماس به‌صورت خطای ارسال در مرکز اعلان‌ها نمایش داده می‌شود.
              </p>
              {data.users.map((user) => {
                const contact = options.contacts.find(
                  (c) => c.userId === user.id,
                );
                function update(key: "email" | "phone", value: string) {
                  setDirty(true);
                  setOptions((o) => ({
                    ...o,
                    contacts: [
                      ...o.contacts.filter((c) => c.userId !== user.id),
                      {
                        userId: user.id,
                        email: contact?.email || "",
                        phone: contact?.phone || "",
                        [key]: value,
                      },
                    ],
                  }));
                }
                return (
                  <div
                    className="rounded-2xl border border-white/80 dark:border-white/10 bg-white/40 dark:bg-slate-800/50 p-4"
                    key={user.id}
                  >
                    <p className="mb-4 text-sm font-bold text-navy dark:text-sky-50">
                      {user.name}
                      {!user.enabled && " · غیرفعال"}
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="ایمیل">
                        <input
                          dir="ltr"
                          className={input}
                          type="email"
                          value={contact?.email || ""}
                          onChange={(e) => update("email", e.target.value)}
                        />
                      </Field>
                      <Field label="شماره موبایل">
                        <input
                          dir="ltr"
                          className={input}
                          type="tel"
                          value={contact?.phone || ""}
                          onChange={(e) => update("phone", e.target.value)}
                        />
                      </Field>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          <Feedback {...feedback} />
          <div className="flex flex-wrap items-center gap-3">
            <button className={button} disabled={isLoading}>
              <Save size={16} />
              {isLoading ? "در حال پردازش…" : "ذخیره تنظیمات اتصال"}
            </button>
            {dirty && (
              <span className="text-xs text-amber-700 dark:text-amber-300">
                تغییرات ذخیره نشده است.
              </span>
            )}
          </div>
        </form>
      </Card>
      <div className="space-y-5">
        <Card title="راهنمای اتصال">
          <div className="space-y-3 text-xs leading-8 text-slate-500 dark:text-slate-400">
            <p>
              اطلاعات محرمانه رمزنگاری می‌شوند؛ برای حفظ رمز فعلی، فیلد رمز را
              خالی بگذارید.
            </p>
            <p>
              ابتدا تنظیمات را ذخیره کنید، سپس اتصال یا ارسال آزمایشی را بررسی
              کنید.
            </p>
            {tab === "ldap" && (
              <p>
                محیط محلی: سرور ldap، پورت 389، ویژگی uid و Base DN برابر
                dc=taskmanagement,dc=local است. حساب آزمایشی ldaptest در بخش
                کاربران موجود است.
              </p>
            )}
            {tab === "email" && (
              <>
                <p>
                  برای تست محلی، پروفایل mail-test را اجرا کنید؛ سرور mailpit با
                  پورت 1025 و بدون رمز و STARTTLS کار می‌کند.
                </p>
                <a
                  className="inline-flex text-brand dark:text-sky-300 underline"
                  href="http://localhost:8025"
                  target="_blank"
                  rel="noreferrer"
                >
                  مشاهده صندوق آزمایشی Mailpit
                </a>
                <p>
                  پورت ۴۶۵ با TLS ضمنی پشتیبانی نمی‌شود؛ از STARTTLS پورت ۵۸۷
                  استفاده کنید.
                </p>
              </>
            )}
          </div>
        </Card>
        {tab !== "contacts" && (
          <Card title={tab === "ldap" ? "بررسی اتصال" : "ارسال آزمایشی"}>
            <div className="space-y-4">
              {tab !== "ldap" && (
                <Field
                  label={
                    tab === "email"
                      ? "ایمیل گیرنده آزمایشی"
                      : "موبایل گیرنده آزمایشی"
                  }
                >
                  <input
                    className={input}
                    dir="ltr"
                    type={tab === "email" ? "email" : "tel"}
                    value={testTo}
                    onChange={(e) => setTestTo(e.target.value)}
                    placeholder={tab === "email" ? "you@example.com" : "0912…"}
                  />
                </Field>
              )}
              <button
                type="button"
                className={secondary}
                disabled={isLoading || dirty || (tab !== "ldap" && !testTo)}
                onClick={() => void action(tab)}
              >
                <Send size={16} />
                {tab === "ldap" ? "تست اتصال LDAP" : "ارسال پیام آزمایشی"}
              </button>
              <p className="text-xs leading-7 text-slate-500 dark:text-slate-400">
                {tab === "ldap"
                  ? "حساب سرویس و دسترسی به Base DN بررسی می‌شود."
                  : "این دکمه یک پیام واقعی به گیرنده واردشده ارسال می‌کند؛ ذخیره تنظیمات به‌تنهایی پیامی نمی‌فرستد."}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
