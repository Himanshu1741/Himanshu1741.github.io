const { Op } = require("sequelize");
const Project = require("../../models/Project");
const Task = require("../../models/Task");
const Message = require("../../models/Message");
const File = require("../../models/File");
const ProjectMember = require("../../models/ProjectMember");

/**
 * Global search across projects, tasks, messages, and files
 * GET /api/search?q=query
 */
exports.globalSearch = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    // Find all project IDs the user is a member of
    const memberships = await ProjectMember.findAll({
      where: { user_id: req.user.id },
      attributes: ["project_id"]
    });
    const projectIds = memberships.map((m) => m.project_id);

    if (projectIds.length === 0) {
      return res.json({ projects: [], tasks: [], messages: [], files: [] });
    }

    const like = { [Op.like]: `%${q}%` };

    const [projects, tasks, messages, files] = await Promise.all([
      Project.findAll({
        where: {
          id: { [Op.in]: projectIds },
          [Op.or]: [{ title: like }, { description: like }]
        },
        attributes: ["id", "title", "description", "status"],
        limit: 10
      }),
      Task.findAll({
        where: {
          project_id: { [Op.in]: projectIds },
          [Op.or]: [{ title: like }, { description: like }]
        },
        attributes: ["id", "title", "status", "priority", "due_date", "project_id"],
        limit: 15
      }),
      Message.findAll({
        where: {
          project_id: { [Op.in]: projectIds },
          content: like
        },
        attributes: ["id", "content", "project_id", "sender_id", "created_at"],
        order: [["created_at", "DESC"]],
        limit: 10
      }),
      File.findAll({
        where: {
          project_id: { [Op.in]: projectIds },
          filename: like
        },
        attributes: ["id", "filename", "project_id", "created_at"],
        limit: 10
      })
    ]);

    res.json({
      projects: projects.map((p) => p.toJSON()),
      tasks: tasks.map((t) => t.toJSON()),
      messages: messages.map((m) => m.toJSON()),
      files: files.map((f) => f.toJSON())
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
