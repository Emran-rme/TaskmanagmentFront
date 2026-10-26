import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState, useNoticesQuery, can } from "../store";
export default function NotificationListener() {
  const user = useSelector((s: RootState) => s.auth.user);
  const { data: notices } = useNoticesQuery(undefined, {
    skip: !can(user, "notifications.read"),
    pollingInterval: 30000,
    skipPollingIfUnfocused: true,
    refetchOnFocus: true,
  });
  const seen = useRef(new Set<string>());
  const initialized = useRef(false);
  useEffect(() => {
    seen.current.clear();
    initialized.current = false;
  }, [user?.id]);
  useEffect(() => {
    if (!notices) return;
    const fresh = notices.filter(
      (n) =>
        n.recipientId === user?.id &&
        !n.read &&
        n.channel === "درون‌برنامه‌ای" &&
        !seen.current.has(n.id),
    );
    for (const n of notices) seen.current.add(n.id);
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    if (
      typeof Notification !== "undefined" &&
      Notification.permission === "granted"
    ) {
      navigator.serviceWorker?.ready
        .then(async (r) => {
          if (await r.pushManager.getSubscription()) return;
          for (const n of fresh)
            await r.showNotification("میز کار", {
              body: "اعلان جدید دارید؛ برای مشاهده وارد سامانه شوید.",
              tag: n.id,
              icon: "/app-icon.svg",
              data: { url: "/notifications" },
            });
        })
        .catch(console.error);
    }
  }, [notices, user?.id]);
  return null;
}
