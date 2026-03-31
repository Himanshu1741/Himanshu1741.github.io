const NotificationPreference = require("../../models/NotificationPreference");
const DoNotDisturbSchedule = require("../../models/DoNotDisturbSchedule");

// Get all preferences for user
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.query;

    let whereClause = { user_id: userId };
    if (projectId) {
      whereClause.$or = [{ project_id: projectId }, { project_id: null }];
    }

    const preferences = await NotificationPreference.findAll({
      where: whereClause,
    });

    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update preference
exports.updatePreference = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      enabled,
      frequency,
      channels,
      escalate_if_unread,
      escalation_delay_hours,
    } = req.body;

    const pref = await NotificationPreference.findOne({
      where: { id, user_id: userId },
    });

    if (!pref) {
      return res.status(404).json({ message: "Preference not found" });
    }

    await pref.update({
      enabled,
      frequency,
      channels,
      escalate_if_unread,
      escalation_delay_hours,
    });

    res.json(pref);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create default preferences for user
exports.createDefaultPreferences = async (userId) => {
  try {
    const notificationTypes = [
      "mention",
      "message",
      "task_assigned",
      "task_completed",
      "milestone",
      "file_shared",
      "project_update",
      "deadline_reminder",
    ];

    for (const type of notificationTypes) {
      const exists = await NotificationPreference.findOne({
        where: { user_id: userId, project_id: null, notification_type: type },
      });

      if (!exists) {
        await NotificationPreference.create({
          user_id: userId,
          project_id: null,
          notification_type: type,
          enabled: true,
          frequency: type === "mention" ? "instant" : "daily_digest",
          channels: ["in_app"],
          escalate_if_unread: type === "mention",
          escalation_delay_hours: 24,
        });
      }
    }
  } catch (error) {
    console.error("Error creating default preferences:", error);
  }
};

// Get DND schedule
exports.getDNDSchedule = async (req, res) => {
  try {
    const userId = req.user.id;

    const dnd = await DoNotDisturbSchedule.findOne({
      where: { user_id: userId },
    });

    if (!dnd) {
      return res.json({ message: "No DND schedule found" });
    }

    res.json(dnd);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create or update DND schedule
exports.setDNDSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      enabled,
      start_time,
      end_time,
      days_of_week,
      silence_all,
      allow_critical_only,
      timezone,
    } = req.body;

    let dnd = await DoNotDisturbSchedule.findOne({
      where: { user_id: userId },
    });

    if (!dnd) {
      dnd = await DoNotDisturbSchedule.create({
        user_id: userId,
        enabled,
        start_time,
        end_time,
        days_of_week,
        silence_all,
        allow_critical_only,
        timezone,
      });
    } else {
      await dnd.update({
        enabled,
        start_time,
        end_time,
        days_of_week,
        silence_all,
        allow_critical_only,
        timezone,
      });
    }

    res.json(dnd);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle DND
exports.toggleDND = async (req, res) => {
  try {
    const userId = req.user.id;

    let dnd = await DoNotDisturbSchedule.findOne({
      where: { user_id: userId },
    });

    if (!dnd) {
      dnd = await DoNotDisturbSchedule.create({
        user_id: userId,
        enabled: true,
        start_time: "18:00",
        end_time: "09:00",
      });
    } else {
      await dnd.update({ enabled: !dnd.enabled });
    }

    res.json(dnd);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
