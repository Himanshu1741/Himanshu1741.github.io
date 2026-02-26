import { useEffect, useState } from "react";
import API from "../../services/api";
import socket from "../../services/socket";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data);
    } catch {
      setNotifications([]);
    }
  };

  const markUnreadAsRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;

    try {
      await Promise.all(unread.map((n) => API.put(`/notifications/${n.id}`)));
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // No-op: if mark-read fails, keep current state and retry on next action.
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initNotifications = async () => {
      try {
        let user = typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("user") || "null")
          : null;

        if (!user?.id) {
          const meRes = await API.get("/auth/me");
          user = meRes.data?.user || null;
          if (user?.id && typeof window !== "undefined") {
            localStorage.setItem("user", JSON.stringify(user));
          }
        }

        if (!user?.id || !isMounted) return;

        socket.emit("registerUser", user.id);

        await loadNotifications();
      } catch {
        if (isMounted) {
          setNotifications([]);
        }
      }
    };

    initNotifications();

    const handleReceiveNotification = (data) => {
      setNotifications((prev) => [data, ...prev]);
    };

    const handleRefreshNotifications = () => {
      loadNotifications();
    };

    socket.on("receiveNotification", handleReceiveNotification);
    window.addEventListener("notifications:refresh", handleRefreshNotifications);

    return () => {
      isMounted = false;
      socket.off("receiveNotification", handleReceiveNotification);
      window.removeEventListener("notifications:refresh", handleRefreshNotifications);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleBellEnter = async () => {
    setOpen(true);
    await markUnreadAsRead();
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleBellEnter}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/70 text-slate-100 transition hover:border-cyan-400/70 hover:bg-slate-800"
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
          <path d="M9 17a3 3 0 0 0 6 0" />
        </svg>
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1.5 py-0.5 text-[10px] font-bold text-slate-900">
          {unreadCount}
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-2xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
              Notifications
            </p>
            <span className="text-[11px] text-cyan-300">{unreadCount} unread</span>
          </div>
          <div className="max-h-72 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <p className="rounded-lg border border-slate-800 bg-slate-800/60 px-3 py-2 text-sm text-slate-400">
                No notifications
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    n.is_read
                      ? "border-slate-800 bg-slate-800/60 text-slate-300"
                      : "border-cyan-500/40 bg-cyan-500/10 text-slate-100"
                  }`}
                >
                  {n.message}
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
