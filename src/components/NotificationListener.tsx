import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState, useNoticesQuery, useWorkspaceQuery, can } from "../store";
import { notificationTarget } from "../lib/notificationTarget";
import { notificationContent } from "../lib/notificationContent";
export default function NotificationListener() {
  const user = useSelector((s: RootState) => s.auth.user);
  const { data: workspace } = useWorkspaceQuery(undefined, { skip: !user });
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
          for (const n of fresh) {
            const { title, body } = notificationContent(n, workspace?.tasks.find(task => task.id === n.taskId)?.title);
            await r.showNotification(title, {
              body,
              tag: n.id,
              icon: "/branding/hamrah-symbol.png",
              data: { url: notificationTarget(n) || "/notifications" },
            });
          }
        })
        .catch(console.error);
    }
  }, [notices, user?.id, workspace]);
  return null;
}
