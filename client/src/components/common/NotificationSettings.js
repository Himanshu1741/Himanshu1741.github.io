import { useEffect, useState } from "react";
import API from "../../services/api";

const NotificationSettings = () => {
  const [preferences, setPreferences] = useState([]);
  const [dnd, setDnd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("preferences");

  useEffect(() => {
    loadPreferences();
    loadDND();
  }, []);

  const loadPreferences = async () => {
    try {
      const res = await API.get("/notifications/preferences/list");
      setPreferences(res.data);
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const loadDND = async () => {
    try {
      const res = await API.get("/notifications/dnd/schedule");
      setDnd(res.data);
    } catch (error) {
      console.error("Error loading DND:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (id, updates) => {
    try {
      const res = await API.put(`/notifications/preferences/${id}`, updates);
      setPreferences(preferences.map((p) => (p.id === id ? res.data : p)));
    } catch (error) {
      console.error("Error updating preference:", error);
    }
  };

  const updateDND = async (updates) => {
    try {
      const res = await API.post("/notifications/dnd/schedule", updates);
      setDnd(res.data);
    } catch (error) {
      console.error("Error updating DND:", error);
    }
  };

  const toggleDND = async () => {
    try {
      const res = await API.patch("/notifications/dnd/toggle");
      setDnd(res.data);
    } catch (error) {
      console.error("Error toggling DND:", error);
    }
  };

  if (loading)
    return <div className="notification-settings-loading">Loading...</div>;

  const colors = {
    bg1: "#13141b",
    bg2: "#1a1c25",
    cyan: "#00d4ff",
    mint: "#1de9b6",
    amber: "#f6a623",
    rose: "#ff5c7c",
  };

  return (
    <div className="notification-settings">
      <style>{`
        .notification-settings {
          max-width: 800px;
          margin: 0 auto;
        }
        .settings-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }
        .settings-tab {
          padding: 12px 16px;
          background: none;
          border: none;
          color: #8890aa;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .settings-tab.active {
          color: ${colors.cyan};
          border-bottom-color: ${colors.cyan};
        }
        .settings-section {
          background: ${colors.bg2};
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
        }
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
        }
        .setting-item:last-child {
          border-bottom: none;
        }
        .setting-label {
          flex: 1;
        }
        .setting-title {
          font-weight: 600;
          color: #eef0f8;
          margin-bottom: 4px;
          text-transform: capitalize;
        }
        .setting-desc {
          font-size: 12px;
          color: #484f66;
        }
        .setting-control {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .select-control, .input-control {
          background: ${colors.bg1};
          border: 1px solid rgba(255, 255, 255, 0.07);
          color: #eef0f8;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
        }
        .input-control {
          width: 100px;
        }
        .toggle-switch {
          width: 44px;
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        .toggle-switch.active {
          background: ${colors.cyan};
          border-color: ${colors.cyan};
        }
        .toggle-switch::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 10px;
          top: 2px;
          left: 2px;
          transition: left 0.2s;
        }
        .toggle-switch.active::after {
          left: 22px;
        }
        .dnd-section {
          background: rgba(0, 212, 255, 0.05);
          border: 1px solid rgba(0, 212, 255, 0.15);
          border-radius: 12px;
          padding: 20px;
        }
        .dnd-time-inputs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 12px;
        }
        .time-input-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .time-input-label {
          font-size: 12px;
          color: #8890aa;
          font-weight: 500;
        }
        .time-input {
          background: ${colors.bg1};
          border: 1px solid rgba(255, 255, 255, 0.07);
          color: #eef0f8;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
        }
        .days-selector {
          display: flex;
          gap: 4px;
          margin-top: 12px;
          flex-wrap: wrap;
        }
        .day-btn {
          background: ${colors.bg1};
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #8890aa;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        .day-btn.active {
          background: ${colors.cyan};
          color: #000;
          border-color: ${colors.cyan};
        }
        .save-btn {
          background: ${colors.mint};
          border: none;
          color: #000;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          margin-top: 12px;
        }
        .save-btn:hover {
          opacity: 0.9;
        }
      `}</style>

      {/* Tabs */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === "preferences" ? "active" : ""}`}
          onClick={() => setActiveTab("preferences")}
        >
          Notification Preferences
        </button>
        <button
          className={`settings-tab ${activeTab === "dnd" ? "active" : ""}`}
          onClick={() => setActiveTab("dnd")}
        >
          Do Not Disturb
        </button>
      </div>

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <div>
          <div className="settings-section">
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "16px",
                color: "#eef0f8",
              }}
            >
              Notification Type Preferences
            </h3>
            {preferences
              .filter((p) => p.project_id === null)
              .map((pref) => (
                <div key={pref.id} className="setting-item">
                  <div className="setting-label">
                    <div className="setting-title">
                      {pref.notification_type}
                    </div>
                    <div className="setting-desc">
                      Manage how you receive {pref.notification_type}{" "}
                      notifications
                    </div>
                  </div>
                  <div className="setting-control">
                    <select
                      className="select-control"
                      value={pref.frequency}
                      onChange={(e) =>
                        updatePreference(pref.id, { frequency: e.target.value })
                      }
                    >
                      <option value="instant">Instant</option>
                      <option value="daily_digest">Daily Digest</option>
                      <option value="weekly_digest">Weekly Digest</option>
                      <option value="never">Never</option>
                    </select>
                    <div
                      className={`toggle-switch ${pref.enabled ? "active" : ""}`}
                      onClick={() =>
                        updatePreference(pref.id, { enabled: !pref.enabled })
                      }
                    />
                  </div>
                </div>
              ))}
          </div>

          <div className="settings-section">
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "16px",
                color: "#eef0f8",
              }}
            >
              Escalation Settings
            </h3>
            {preferences
              .filter(
                (p) =>
                  p.project_id === null && p.notification_type === "mention",
              )
              .map((pref) => (
                <div key={pref.id}>
                  <div className="setting-item">
                    <div className="setting-label">
                      <div className="setting-title">
                        Auto-escalate Unread Mentions
                      </div>
                      <div className="setting-desc">
                        Get reminded about unread mentions after a delay
                      </div>
                    </div>
                    <div
                      className={`toggle-switch ${pref.escalate_if_unread ? "active" : ""}`}
                      onClick={() =>
                        updatePreference(pref.id, {
                          escalate_if_unread: !pref.escalate_if_unread,
                        })
                      }
                    />
                  </div>
                  {pref.escalate_if_unread && (
                    <div className="setting-item">
                      <div className="setting-label">
                        <div className="setting-desc">
                          Escalate after (hours)
                        </div>
                      </div>
                      <input
                        type="number"
                        className="input-control"
                        value={pref.escalation_delay_hours}
                        onChange={(e) =>
                          updatePreference(pref.id, {
                            escalation_delay_hours: parseInt(e.target.value),
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* DND Tab */}
      {activeTab === "dnd" && (
        <div className="dnd-section">
          <div className="setting-item">
            <div className="setting-label">
              <div className="setting-title">Do Not Disturb</div>
              <div className="setting-desc">
                Silence notifications during your quiet hours
              </div>
            </div>
            <div
              className={`toggle-switch ${dnd?.enabled ? "active" : ""}`}
              onClick={toggleDND}
            />
          </div>

          {dnd && (
            <div style={{ marginTop: "20px" }}>
              <div className="dnd-time-inputs">
                <div className="time-input-group">
                  <label className="time-input-label">Start Time</label>
                  <input
                    type="time"
                    className="time-input"
                    value={dnd.start_time || "18:00"}
                    onChange={(e) =>
                      updateDND({ ...dnd, start_time: e.target.value })
                    }
                  />
                </div>
                <div className="time-input-group">
                  <label className="time-input-label">End Time</label>
                  <input
                    type="time"
                    className="time-input"
                    value={dnd.end_time || "09:00"}
                    onChange={(e) =>
                      updateDND({ ...dnd, end_time: e.target.value })
                    }
                  />
                </div>
              </div>

              <div style={{ marginTop: "16px" }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "500",
                    color: "#8890aa",
                    marginBottom: "8px",
                  }}
                >
                  Days
                </div>
                <div className="days-selector">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day, idx) => (
                      <button
                        key={day}
                        className={`day-btn ${dnd.days_of_week.includes(idx + 1) ? "active" : ""}`}
                        onClick={() => {
                          const days = [...dnd.days_of_week];
                          const dayNum = idx + 1;
                          if (days.includes(dayNum)) {
                            days.splice(days.indexOf(dayNum), 1);
                          } else {
                            days.push(dayNum);
                          }
                          updateDND({ ...dnd, days_of_week: days });
                        }}
                      >
                        {day}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="setting-item" style={{ marginTop: "16px" }}>
                <div className="setting-label">
                  <div className="setting-title">
                    Allow Critical Notifications
                  </div>
                  <div className="setting-desc">
                    Still show mentions and critical alerts during quiet hours
                  </div>
                </div>
                <div
                  className={`toggle-switch ${dnd.allow_critical_only ? "active" : ""}`}
                  onClick={() =>
                    updateDND({
                      ...dnd,
                      allow_critical_only: !dnd.allow_critical_only,
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;
