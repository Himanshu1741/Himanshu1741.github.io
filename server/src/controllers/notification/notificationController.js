const Notification = require("../../models/Notification");
const NotificationPreference = require("../../models/NotificationPreference");
const DoNotDisturbSchedule = require("../../models/DoNotDisturbSchedule");
const User = require("../../models/User");

// Check if user is in DND period
const isInDND = async (userId) => {
  try {
    const dnd = await DoNotDisturbSchedule.findOne({
      where: { user_id: userId, enabled: true },
    });
    if (!dnd) return false;

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

    // Check if today is in allowed days
    if (!dnd.days_of_week.includes(currentDay)) {
      return false; // Not a DND day
    }

    // Check if current time is within DND range
    const startStr = dnd.start_time;
    const endStr = dnd.end_time;

    if (startStr < endStr) {
      // Normal case: e.g., 18:00 - 09:00 (doesn't cross midnight)
      return currentTime >= startStr && currentTime < endStr;
    } else {
      // Crosses midnight: e.g., 22:00 - 06:00
      return currentTime >= startStr || currentTime < endStr;
    }
  } catch (error) {
    console.error("DND check error:", error);
    return false;
  }
};

// Get user preferences for notification type
const getPreferences = async (userId, projectId, notificationType) => {
  try {
    // Check project-specific preference first
    if (projectId) {
      const pref = await NotificationPreference.findOne({
        where: {
          user_id: userId,
          project_id: projectId,
          notification_type: notificationType,
        },
      });
      if (pref) return pref;
    }

    // Fall back to global preference
    const globalPref = await NotificationPreference.findOne({
      where: {
        user_id: userId,
        project_id: null,
        notification_type: notificationType,
      },
    });

    return (
      globalPref || {
        enabled: true,
        frequency: "instant",
        channels: ["in_app"],
      }
    );
  } catch (error) {
    console.error("Preference error:", error);
    return { enabled: true, frequency: "instant", channels: ["in_app"] };
  }
};

// Create notification with smart routing
exports.createNotification = async (userId, data) => {
  try {
    const {
      message,
      type = "project_update",
      severity = "medium",
      mentionedUsers = [],
      relatedResource,
      actionUrl,
      projectId,
    } = data;

    // Get user preferences
    const preferences = await getPreferences(userId, projectId, type);

    if (!preferences.enabled) return null; // User disabled this notification type

    const isInDndPeriod = await isInDND(userId);
    let inDigest = false;

    // Handle DND and frequency settings
    if (isInDndPeriod && !preferences.allow_critical_only) {
      if (preferences.silence_all || severity !== "critical") {
        inDigest = true; // Queue for digest instead
      }
    } else if (
      preferences.frequency === "daily_digest" ||
      preferences.frequency === "weekly_digest"
    ) {
      inDigest = true;
    }

    const notification = await Notification.create({
      user_id: userId,
      message,
      type,
      severity,
      mentioned_users: mentionedUsers,
      related_resource: relatedResource,
      action_url: actionUrl,
      in_digest: inDigest,
      escalated: false,
    });

    return notification;
  } catch (error) {
    console.error("Notification creation error:", error);
    return null;
  }
};

// Get notifications with smart filtering
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { includeRead = false, type, severity } = req.query;

    let whereClause = { user_id: userId, in_digest: false };

    if (!includeRead) whereClause.is_read = false;
    if (type) whereClause.type = type;
    if (severity) whereClause.severity = severity;

    const notifications = await Notification.findAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
      limit: 50,
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get smart digest
exports.getDigest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = "daily" } = req.query; // daily or weekly

    // Get all digest notifications
    const digestNotifications = await Notification.findAll({
      where: { user_id: userId, in_digest: true, is_read: false },
      order: [
        ["severity", "DESC"],
        ["created_at", "DESC"],
      ],
      limit: 100,
    });

    // Group by type and severity for better digest
    const grouped = {};
    digestNotifications.forEach((notif) => {
      const key = `${notif.type}_${notif.severity}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(notif);
    });

    res.json({
      period,
      summary: {
        total: digestNotifications.length,
        critical: digestNotifications.filter((n) => n.severity === "critical")
          .length,
        high: digestNotifications.filter((n) => n.severity === "high").length,
      },
      notifications: grouped,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark as read with timestamp
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, user_id: req.user.id },
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await notification.update({
      is_read: true,
      is_read_at: new Date(),
    });

    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.update(
      { is_read: true, is_read_at: new Date() },
      { where: { user_id: userId, is_read: false } },
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get mention notifications
exports.getMentions = async (req, res) => {
  try {
    const userId = req.user.id;

    const mentions = await Notification.findAll({
      where: {
        user_id: userId,
        type: "mention",
        is_read: false,
      },
      order: [["created_at", "DESC"]],
    });

    res.json(mentions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get notification stats
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Notification.count({
      where: { user_id: userId, is_read: false, in_digest: false },
    });

    const unreadMentions = await Notification.count({
      where: { user_id: userId, is_read: false, type: "mention" },
    });

    const escalatedCount = await Notification.count({
      where: { user_id: userId, escalated: true, is_read: false },
    });

    res.json({
      unread: unreadCount,
      mentions: unreadMentions,
      escalated: escalatedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
