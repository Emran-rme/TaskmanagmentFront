import { safeReturnTo, authDestination } from "../lib/returnTo";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { api, useMutateMutation, signedIn, errorText } from "../store";
import { Card, Field, input, button, ErrorBox } from "../components/ui";
import ThemeToggle from "../components/ThemeToggle";
import Brand from "../components/Brand";
import { ArrowLeft, KeyRound, MessageSquare, LoaderCircle } from "lucide-react";
export default function Login() {
  const demo = import.meta.env.VITE_DEMO_MODE === "true";
  const [login, { isLoading }] = useMutateMutation(),
    [error, setError] = useState("");
  const [mode, setMode] = useState<"password" | "sms">("password");
  const [identifier, setIdentifier] = useState("");
  const [challenge, setChallenge] = useState<{
    id: string;
    expires: number;
    retry: number;
    message: string;
  } | null>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!challenge) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [challenge]);
  async function requestCode() {
    const result = await login({
      url: "auth/otp/request",
      body: { identifier },
    }).unwrap();
    const time = Date.now();
    setNow(time);
    setChallenge({
      id: result.challengeId,
      expires: time + result.expiresInSeconds * 1000,
      retry: time + result.retryAfterSeconds * 1000,
      message: result.message,
    });
  }
  const remaining = challenge
    ? Math.max(0, Math.ceil((challenge.expires - now) / 1000))
    : 0;
  const retryIn = challenge
    ? Math.max(0, Math.ceil((challenge.retry - now) / 1000))
    : 0;
  const location = useLocation();
  const returnTo = safeReturnTo(
    new URLSearchParams(location.search).get("returnTo"),
  );
  const dispatch = useDispatch(),
    navigate = useNavigate();
  return (
    <div className="login-screen">
      <div className="login-theme">
        <ThemeToggle />
      </div>
      <Card className="login-card">
        <div className="login-brand">
          <Brand large />
        </div>
        <h1 className="login-title">
          خوش آمدید
        </h1>
        <p className="login-description">
          {mode === "sms"
            ? "ورود به حساب داخلی با نام کاربری یا شماره موبایل ثبت‌شده و کد پیامکی."
            : "برای ورود، حساب کاربری و رمز عبور خود را وارد کنید."}
        </p>
        {!demo && (
          <div
            className="login-methods"
            role="group"
            aria-label="روش احراز هویت"
          >
            {(["password", "sms"] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={mode === value}
                disabled={isLoading}
                className="login-method"
                onClick={() => {
                  setMode(value);
                  setChallenge(null);
                  setError("");
                }}
              >
                {value === "sms" ? <MessageSquare size={17} aria-hidden="true" /> : <KeyRound size={17} aria-hidden="true" />}
                {value === "sms" ? "کد پیامکی" : "رمز عبور"}
              </button>
            ))}
          </div>
        )}
        <form
          className="login-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const f = new FormData(e.currentTarget);
            try {
              if (mode === "sms" && !challenge) {
                await requestCode();
                return;
              }
              const result = await login(
                mode === "sms"
                  ? {
                      url: "auth/otp/verify",
                      body: {
                        challengeId: challenge!.id,
                        code: String(f.get("code") || ""),
                      },
                    }
                  : { url: "auth/login", body: Object.fromEntries(f) },
              ).unwrap();
              dispatch(api.util.resetApiState());
              dispatch(signedIn(result));
              navigate(
                result.user.contextRequired
                  ? authDestination("/select-context", returnTo)
                  : returnTo,
                { replace: true },
              );
            } catch (err) {
              setError(errorText(err));
            }
          }}
        >
          {mode === "password" ? (
            <>
              <Field label="نام کاربری">
                <input
                  className={input}
                  name="username"
                  dir="ltr"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="نام کاربری خود را وارد کنید"
                  defaultValue={demo ? "admin" : ""}
                  autoComplete="username"
                  required
                />
              </Field>
              <Field label="رمز عبور">
                <input
                  className={input}
                  name="password"
                  type="password"
                  dir="ltr"
                  placeholder="رمز عبور خود را وارد کنید"
                  defaultValue={demo ? "1234" : ""}
                  autoComplete="current-password"
                  required
                />
              </Field>
              <Field label="روش ورود">
                <select name="authSource" className={input}>
                  <option value="local">حساب داخلی</option>
                  <option value="ldap">LDAP</option>
                </select>
              </Field>
            </>
          ) : challenge ? (
            <>
              <p
                className="text-sm leading-7 text-slate-500 dark:text-slate-300"
                role="status"
              >
                {challenge.message}
              </p>
              <Field label="کد ورود شش‌رقمی">
                <input
                  key={challenge.id}
                  className={input}
                  name="code"
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9۰-۹٠-٩]{6}"
                  minLength={6}
                  maxLength={6}
                  required
                  autoFocus
                />
              </Field>
              <p className="text-xs text-slate-500 dark:text-slate-300">
                {remaining > 0
                  ? `اعتبار باقی‌مانده: ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
                  : "کد منقضی شده است؛ کد جدید دریافت کنید."}
              </p>
              <div className="flex gap-4 text-sm">
                <button
                  type="button"
                  disabled={isLoading || retryIn > 0}
                  onClick={async () => {
                    setError("");
                    try {
                      await requestCode();
                    } catch (err) {
                      setError(errorText(err));
                    }
                  }}
                >
                  {retryIn > 0
                    ? `ارسال مجدد پس از ${Math.floor(retryIn / 60)}:${String(retryIn % 60).padStart(2, "0")}`
                    : "ارسال مجدد کد"}
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setChallenge(null);
                    setError("");
                  }}
                >
                  اصلاح نام کاربری / شماره
                </button>
              </div>
            </>
          ) : (
            <Field label="نام کاربری یا شماره موبایل">
              <input
                className={input}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                name="identifier"
                dir="ltr"
                placeholder="نام کاربری یا 09123456789"
                autoComplete="username"
                maxLength={200}
                required
              />
            </Field>
          )}
          {error && <ErrorBox message={error} />}
          <button
            disabled={
              isLoading || (mode === "sms" && !!challenge && remaining === 0)
            }
            className={button + " login-submit"}
            aria-busy={isLoading}
          >
            {isLoading ? <LoaderCircle size={18} className="login-spinner" aria-hidden="true" /> : null}
            {isLoading ? "در حال بررسی…" : mode === "sms" && !challenge
              ? "دریافت کد ورود"
              : "ورود به فضای کار"}
            {!isLoading && <ArrowLeft size={18} aria-hidden="true" />}
          </button>
        </form>
        {demo && (
          <div className="mt-6 rounded-xl bg-slate-50 dark:bg-slate-900/70 p-3 text-xs leading-7 text-slate-500 dark:text-slate-400">
            {import.meta.env.VITE_USE_MOCK === "true"
              ? "حساب‌های نمایشی: admin، sara، ali، maryam"
              : "حساب‌های نمونه: admin، kazemi، radmanesh"}
            <br />
            رمز حساب‌های داخلی: 1234
            <br />
            {import.meta.env.VITE_USE_MOCK === "true"
              ? "نسخه طراحی با داده ماک؛ اتصال‌ها و ارسال‌ها شبیه‌سازی می‌شوند."
              : "LDAP: ldaptest / LdapTest123!"}
          </div>
        )}
      </Card>
      <p className="login-footer">همراه فن‌آوا · مدیریت یکپارچه پروژه‌ها و وظایف</p>
    </div>
  );
}
