const TaskComment = require("../../models/TaskComment");
const Task = require("../../models/Task");
const User = require("../../models/User");
const ProjectMember = require("../../models/ProjectMember");

// GET COMMENTS FOR A TASK
exports.getComments = async (req, res) => {
  try {
    const { task_id } = req.params;
    const task = await Task.findByPk(task_id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const membership = await ProjectMember.findOne({
      where: { project_id: task.project_id, user_id: req.user.id }
    });
    if (!membership) return res.status(403).json({ message: "Not a project member" });

    const comments = await TaskComment.findAll({
      where: { task_id },
      order: [["created_at", "ASC"]]
    });

    const userIds = [...new Set(comments.map((c) => c.user_id))];
    const users = userIds.length
      ? await User.findAll({ where: { id: userIds }, attributes: ["id", "name"] })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const enriched = comments.map((c) => ({
      ...c.toJSON(),
      user_name: userMap.get(c.user_id) || "Unknown"
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ADD COMMENT TO A TASK
exports.addComment = async (req, res) => {
  try {
    const { task_id } = req.params;
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const task = await Task.findByPk(task_id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const membership = await ProjectMember.findOne({
      where: { project_id: task.project_id, user_id: req.user.id }
    });
    if (!membership) return res.status(403).json({ message: "Not a project member" });

    const comment = await TaskComment.create({
      task_id: Number(task_id),
      user_id: req.user.id,
      content: content.trim()
    });

    const user = await User.findByPk(req.user.id, { attributes: ["id", "name"] });
    res.status(201).json({ ...comment.toJSON(), user_name: user?.name || "Unknown" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE A COMMENT (own comment only or project creator)
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await TaskComment.findByPk(id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    const task = await Task.findByPk(comment.task_id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isOwner = comment.user_id === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this comment" });
    }

    await comment.destroy();
    res.json({ message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
