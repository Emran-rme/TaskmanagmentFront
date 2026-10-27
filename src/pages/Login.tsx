import { safeReturnTo, authDestination } from "../lib/returnTo";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { api, useMutateMutation, signedIn, errorText } from "../store";
import { Card, Field, input, button, ErrorBox } from "../components/ui";
import ThemeToggle from "../components/ThemeToggle";
import Brand from "../components/Brand";
export default function Login() {
  const demo = import.meta.env.VITE_DEMO_MODE === "true";
  const [login, { isLoading }] = useMutateMutation(),
    [error, setError] = useState("");
  const location = useLocation();
  const returnTo = safeReturnTo(
    new URLSearchParams(location.search).get("returnTo"),
  );
  const dispatch = useDispatch(),
    navigate = useNavigate();
  return (
    <div className="login-screen relative flex min-h-screen items-center justify-center bg-gradient-to-br from-[#e4f5ff] dark:from-[#081426] via-[#f2f7ff] dark:via-slate-900 to-[#dceaff] dark:to-slate-950 p-4 pt-24 font-sans sm:pt-4">
      <div className="absolute left-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="login-card w-full max-w-md">
        <div className="login-brand mb-6 flex">
          <Brand large />
        </div>
        <h1 className="mb-3 text-2xl font-bold text-navy dark:text-sky-50">
          خوش آمدید
        </h1>
        <p className="mb-8 text-sm text-slate-400">
          برای ورود، حساب کاربری و رمز عبور خود را وارد کنید.
        </p>
        <form
          className="space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const f = new FormData(e.currentTarget);
            try {
              const result = await login({
                url: "auth/login",
                body: Object.fromEntries(f),
              }).unwrap();
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
          <Field label="نام کاربری">
            <input
              className={input}
              name="username"
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
          {error && <ErrorBox message={error} />}
          <button disabled={isLoading} className={button + " w-full"}>
            ورود به فضای کار
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
    </div>
  );
}
