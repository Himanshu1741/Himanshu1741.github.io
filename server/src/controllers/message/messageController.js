const Message = require("../../models/Message");
const ProjectMember = require("../../models/ProjectMember");
const User = require("../../models/User");

exports.getMessagesByProject = async (req, res) => {
  try {
    const { project_id } = req.params;

    const membership = await ProjectMember.findOne({
      where: {
        project_id,
        user_id: req.user.id
      }
    });

    if (!membership) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const messages = await Message.findAll({
      where: { project_id },
      order: [["created_at", "ASC"]]
    });

    const senderIds = [...new Set(messages.map((m) => m.sender_id))];
    const users = senderIds.length
      ? await User.findAll({
          where: { id: senderIds },
          attributes: ["id", "name"]
        })
      : [];

    const userMap = new Map(users.map((u) => [u.id, u.name]));
    const enrichedMessages = messages.map((m) => ({
      ...m.toJSON(),
      sender_name: userMap.get(m.sender_id) || "Unknown"
    }));

    res.json(enrichedMessages);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
