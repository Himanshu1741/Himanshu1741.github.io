const Notification = require("../../models/Notification");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [["created_at", "DESC"]]
    });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const [updatedCount] = await Notification.update(
      { is_read: true },
      { where: { id, user_id: req.user.id } }
    );

    if (!updatedCount) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
