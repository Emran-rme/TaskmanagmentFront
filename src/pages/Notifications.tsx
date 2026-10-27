import { useState } from "react";
import DeleteButton from "../components/DeleteButton";
import { useNoticesQuery, useMutateMutation, errorText, store } from "../store";
import { Card, button, secondary, Loading, ErrorBox } from "../components/ui";
import { jalali, fa } from "../lib/jalali";
export default function Notifications() {
  const { data: n, error } = useNoticesQuery(undefined, {
      pollingInterval: 30000,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
    }),
    [mutate] = useMutateMutation(),
    [channel, C] = useState(""),
    [actionError, setActionError] = useState("");
  const [browserStatus, setBrowserStatus] = useState("");
  const [enablingPush, setEnablingPush] = useState(false);
  if (error) return <ErrorBox message={errorText(error)} />;
  if (!n) return <Loading />;
  const channels = [...new Set(n.map((x) => x.channel))];
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-navy dark:text-sky-50">
        مرکز اعلان‌ها
      </h1>
      {!window.isSecureContext && (
        <ErrorBox message="اعلان گوشی و سیستم به اتصال HTTPS معتبر نیاز دارد؛ سامانه را با نشانی امن باز کنید." />
      )}
      <p className="text-sm text-slate-500">
        در هر دستگاه، اعلان مرورگر را یک بار فعال کنید. در آیفون (iOS 16.4 به
        بالا) ابتدا سامانه را با Add to Home Screen نصب و از آیکون آن باز کنید.
      </p>
      {typeof Notification !== "undefined" && (
        <button
          className={secondary}
          disabled={enablingPush}
          onClick={async () => {
            setEnablingPush(true);
            setBrowserStatus("");
            try {
              if (
                !window.isSecureContext ||
                !("serviceWorker" in navigator) ||
                !("PushManager" in window)
              )
                throw new Error(
                  "این مرورگر یا نشانی از اعلان پشتیبانی نمی‌کند؛ از HTTPS و مرورگر پشتیبانی‌شده استفاده کنید.",
                );
              const result = await Notification.requestPermission();
              if (result !== "granted")
                throw new Error(
                  "اعلان مرورگر مجاز نشد؛ مجوز را از تنظیمات مرورگر فعال کنید.",
                );
              await navigator.serviceWorker.register("/sw.js");
              const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise<never>((_, reject) =>
                  setTimeout(
                    () =>
                      reject(
                        new Error(
                          "فعال‌سازی سرویس اعلان طول کشید؛ صفحه را بازخوانی کنید.",
                        ),
                      ),
                    15000,
                  ),
                ),
              ]);
              const response = await fetch("/api/push/key", {
                headers: {
                  authorization: "Bearer " + store.getState().auth.token,
                },
              });
              if (!response.ok)
                throw new Error("دریافت کلید اعلان ناموفق بود.");
              const { publicKey } = await response.json();
              const key = Uint8Array.from(
                atob(
                  publicKey.replace(/-/g, "+").replace(/_/g, "/") +
                    "=".repeat((4 - (publicKey.length % 4)) % 4),
                ),
                (c) => c.charCodeAt(0),
              );
              let existing = await registration.pushManager.getSubscription();
              const previousKey = existing?.options.applicationServerKey;
              if (
                existing &&
                (!previousKey ||
                  Array.from(new Uint8Array(previousKey)).join() !==
                    Array.from(key).join())
              ) {
                await existing.unsubscribe();
                existing = null;
              }
              const subscription =
                existing ||
                (await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: key,
                }));
              const json = subscription.toJSON();
              await mutate({
                url: "push/subscribe",
                body: {
                  endpoint: json.endpoint,
                  p256dh: json.keys?.p256dh,
                  auth: json.keys?.auth,
                },
              }).unwrap();
              setActionError("");
              setBrowserStatus("اعلان مرورگر فعال شد.");
            } catch (err) {
              setActionError(
                err instanceof Error ? err.message : errorText(err),
              );
            } finally {
              setEnablingPush(false);
            }
          }}
        >
          {enablingPush ? "در حال فعال‌سازی…" : "فعال‌سازی اعلان مرورگر"}
        </button>
      )}
      {browserStatus && (
        <p role="status" className="text-sm text-emerald-600">
          {browserStatus}
        </p>
      )}
      {typeof Notification !== "undefined" && (
        <button
          className={secondary}
          onClick={async () => {
            try {
              const registration =
                await navigator.serviceWorker.getRegistration();
              const received = (await registration?.getNotifications()) || [];
              setBrowserStatus(
                received.length
                  ? `اعلان دریافت‌شده در مرورگر: ${received.length} — ${received.map((x) => x.tag).join("، ")}`
                  : "اعلان فعالی در مرورگر وجود ندارد؛ ممکن است بسته شده باشد.",
              );
            } catch {
              setActionError("بررسی اعلان‌های مرورگر ناموفق بود.");
            }
          }}
        >
          بررسی دریافت اعلان مرورگر
        </button>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        وضعیت واقعی صف ارسال، اجرای ماژول‌ها و خطاها هر ده ثانیه به‌روز می‌شود.
        پذیرش توسط سرویس به معنی تحویل قطعی به گیرنده نیست.
      </p>
      {actionError && <ErrorBox message={actionError} />}
      <div className="flex flex-wrap gap-2">
        {["", ...channels].map((c) => (
          <button
            className={channel === c ? button : secondary}
            key={c}
            onClick={() => C(c)}
          >
            {c || "همه اعلان‌ها"} ·{" "}
            {fa(n.filter((x) => !c || x.channel === c).length)}
          </button>
        ))}
      </div>
      <Card>
        <div className="divide-y dark:divide-slate-700">
          {n
            .filter((x) => !channel || x.channel === channel)
            .map((x) => (
              <div
                className={
                  "flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 " +
                  (!x.read ? "bg-sky-50/60 dark:bg-sky-950/60" : "")
                }
                key={x.id}
              >
                <div>
                  <p className="text-sm leading-8">{x.message}</p>
                  <DeleteButton
                    entity="notifications"
                    id={x.id}
                    label={x.message}
                    ownerId={x.recipientId}
                  />
                  <p className="text-[10px] text-slate-400">
                    {x.channel} · {jalali(x.createdAt)} · {x.status}
                    {x.moduleId && " · ماژول: " + x.moduleId}
                    {x.providerReference &&
                      " · شناسه سرویس: " + x.providerReference}
                  </p>
                </div>
                {x.status.startsWith("ناموفق") && (
                  <button
                    className={secondary}
                    onClick={async () => {
                      try {
                        await mutate({
                          url: "notifications/" + x.id + "/retry",
                        }).unwrap();
                        setActionError("");
                      } catch (e) {
                        setActionError(errorText(e));
                      }
                    }}
                  >
                    تلاش دوباره
                  </button>
                )}
                {!x.read && (
                  <button
                    className="text-xs text-brand dark:text-sky-300"
                    onClick={() =>
                      mutate({
                        url: "notifications/" + x.id + "/read",
                        method: "PUT",
                      })
                    }
                  >
                    خواندم
                  </button>
                )}
              </div>
            ))}
        </div>
        {!n.length && (
          <p className="text-sm text-slate-400">اعلانی وجود ندارد.</p>
        )}
      </Card>
    </div>
  );
}
