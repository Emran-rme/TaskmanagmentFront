import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { can, type RootState, useNoticesQuery, useMutateMutation } from "../store";
import { fa } from "../lib/jalali";
import { notificationTarget } from "../lib/notificationTarget";

export default function NotificationBell() {
  const user = useSelector((state: RootState) => state.auth.user);
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const [markRead] = useMutateMutation();
  const allowed = can(user, "notifications.read");
  const { data } = useNoticesQuery(undefined, {
    skip: !allowed,
    pollingInterval: 30000,
    skipPollingIfUnfocused: true,
    refetchOnFocus: true,
  });
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  if (!allowed) return null;
  const notices = (data || []).filter(item => item.recipientId === user?.id && item.channel === "درون‌برنامه‌ای");
  const unread = notices.filter(item => !item.read).length;
  const label = unread ? `اعلان‌ها، ${fa(unread)} اعلان خوانده‌نشده` : "اعلان‌ها";
  return <div className="header-notification-container" ref={container}>
  <button type="button" className="header-notification-bell" aria-label={label} title={label} aria-expanded={open} aria-controls="notification-popover" onClick={() => setOpen(value => !value)}>
    <Bell size={20} aria-hidden="true" />
    {unread > 0 && <span className="header-notification-count" aria-hidden="true">{unread > 99 ? "+۹۹" : fa(unread)}</span>}
  </button>
  {open && <div id="notification-popover" className="header-notification-popover" aria-label="اعلان‌های درون‌برنامه‌ای">
    <div className="header-notification-heading"><strong>اعلان‌ها</strong><Link to="/notifications" onClick={() => setOpen(false)}>مشاهده همه</Link></div>
    <div className="header-notification-items">
      {notices.length === 0 ? <p className="header-notification-empty">اعلانی وجود ندارد.</p> : notices.slice(0, 10).map(item => {
        const target = notificationTarget(item);
        return <Link key={item.id} to={target || "/notifications"} className={`header-notification-item${item.read ? "" : " is-unread"}`} onClick={() => { setOpen(false); if (!item.read) void markRead({url:`notifications/${item.id}/read`,method:"PUT"}); }}>
          <span>{item.message}</span><small>{item.read ? "خوانده‌شده" : "خوانده‌نشده"}</small>
        </Link>;
      })}
    </div>
  </div>}
  </div>;
}
