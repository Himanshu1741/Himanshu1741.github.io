import { useEffect, useState } from "react";
import API from "../../services/api";

const NotificationBellAdvanced = () => {
  const [notifications, setNotifications] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [stats, setStats] = useState({ unread: 0, mentions: 0, escalated: 0 });
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const [notRes, mentRes, statsRes] = await Promise.all([
        API.get("/notifications?limit=10"),
        API.get("/notifications/mentions"),
        API.get("/notifications/stats"),
      ]);

      setNotifications(notRes.data);
      setMentions(mentRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}`);
      loadNotifications();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications");
      loadNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getNotificationColor = (severity) => {
    switch (severity) {
      case "critical":
        return "#ff5c7c"; // rose
      case "high":
        return "#f6a623"; // amber
      case "medium":
        return "#00d4ff"; // cyan
      default:
        return "#1de9b6"; // mint
    }
  };

  const colors = {
    bg1: "#13141b",
    bg2: "#1a1c25",
    cyan: "#00d4ff",
  };

  const filteredNotifications =
    activeFilter === "mentions"
      ? mentions
      : activeFilter === "urgent"
        ? notifications.filter(
            (n) => n.severity === "critical" || n.severity === "high",
          )
        : notifications;

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        .notification-bell-btn {
          position: relative;
          background: none;
          border: none;
          color: ${colors.cyan};
          font-size: 20px;
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .notification-badge {
          position: absolute;
          top: 0;
          right: 0;
          background: #ff5c7c;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        }
        .notification-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: ${colors.bg1};
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          width: 400px;
          max-height: 500px;
          overflow-y: auto;
          z-index: 1000;
          box-shadow: 0 20px 25px rgba(0, 0, 0, 0.3);
        }
        .notification-header {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .notification-title {
          font-weight: 600;
          color: #eef0f8;
        }
        .notification-filters {
          display: flex;
          gap: 6px;
          padding: 8px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }
        .filter-btn {
          padding: 4px 10px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          border-radius: 4px;
          color: #8890aa;
          cursor: pointer;
          font-size: 11px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .filter-btn.active {
          background: ${colors.cyan};
          color: #000;
        }
        .notification-item {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          gap: 10px;
        }
        .notification-item:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .notification-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 4px;
        }
        .notification-content {
          flex: 1;
          min-width: 0;
        }
        .notification-message {
          font-size: 12px;
          color: #eef0f8;
          line-height: 1.3;
        }
        .notification-meta {
          font-size: 10px;
          color: #484f66;
          margin-top: 4px;
        }
        .notification-empty {
          padding: 32px 16px;
          text-align: center;
          color: #484f66;
          font-size: 12px;
        }
        .notification-footer {
          padding: 12px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.07);
          display: flex;
          gap: 8px;
        }
        .footer-btn {
          flex: 1;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          border-radius: 6px;
          color: #8890aa;
          cursor: pointer;
          font-size: 11px;
          font-weight: 500;
        }
        .footer-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }
      `}</style>

      {/* Bell Button */}
      <button
        className="notification-bell-btn"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        🔔
        {stats.unread > 0 && (
          <div className="notification-badge">
            {stats.unread > 99 ? "99+" : stats.unread}
          </div>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <div className="notification-title">Notifications</div>
            {stats.unread > 0 && (
              <button
                style={{
                  background: "none",
                  border: "none",
                  color: colors.cyan,
                  cursor: "pointer",
                  fontSize: "11px",
                  textDecoration: "underline",
                }}
                onClick={markAllAsRead}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-filters">
            <button
              className={`filter-btn ${activeFilter === "all" ? "active" : ""}`}
              onClick={() => setActiveFilter("all")}
            >
              All ({stats.unread})
            </button>
            <button
              className={`filter-btn ${activeFilter === "mentions" ? "active" : ""}`}
              onClick={() => setActiveFilter("mentions")}
            >
              @Mentions ({stats.mentions})
            </button>
            <button
              className={`filter-btn ${activeFilter === "urgent" ? "active" : ""}`}
              onClick={() => setActiveFilter("urgent")}
            >
              Urgent ({stats.escalated})
            </button>
          </div>

          <div>
            {filteredNotifications.length === 0 ? (
              <div className="notification-empty">
                {activeFilter === "mentions"
                  ? "No mentions"
                  : activeFilter === "urgent"
                    ? "No urgent notifications"
                    : "All caught up!"}
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="notification-item"
                  onClick={() => markAsRead(notif.id)}
                >
                  <div
                    className="notification-dot"
                    style={{ background: getNotificationColor(notif.severity) }}
                  />
                  <div className="notification-content">
                    <div className="notification-message">
                      {notif.message.slice(0, 80)}
                      {notif.message.length > 80 ? "..." : ""}
                    </div>
                    <div className="notification-meta">
                      {notif.type} ·{" "}
                      {new Date(notif.created_at).toRelativeTime?.()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {filteredNotifications.length > 0 && (
            <div className="notification-footer">
              <button
                className="footer-btn"
                onClick={() => setShowDropdown(false)}
              >
                View All
              </button>
              <button className="footer-btn" onClick={markAllAsRead}>
                Mark All
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBellAdvanced;
