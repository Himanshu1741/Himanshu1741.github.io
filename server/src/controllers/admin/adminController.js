const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const sequelize = require("../../config/db");
const User = require("../../models/User");
const Project = require("../../models/Project");
const ProjectMember = require("../../models/ProjectMember");
const Task = require("../../models/Task");
const Notification = require("../../models/Notification");
const AdminLog = require("../../models/AdminLog");
const { sendEmail } = require("../../services/emailService");

// ─── Helper: log admin action ────────────────────────────────────────────────
async function log(req, action, targetType, targetId, targetLabel, details) {
  try {
    await AdminLog.create({
      admin_id: req.user.id,
      admin_name: req.user.name || req.user.email || "Admin",
      action,
      target_type: targetType,
      target_id: targetId || null,
      target_label: targetLabel || null,
      details: details || null,
    });
  } catch {
    /* non-critical */
  }
}

// ─── GET ALL USERS ─────────────────────────────────────────────────────────
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role", "is_suspended", "created_at"],
      order: [["created_at", "DESC"]],
      raw: true,
    });

    const counts = await sequelize.query(
      `SELECT user_id, COUNT(*) AS project_count FROM project_members GROUP BY user_id`,
      { type: sequelize.QueryTypes.SELECT },
    );
    const countMap = new Map(
      counts.map((r) => [r.user_id, Number(r.project_count)]),
    );

    return res.json(
      users.map((u) => ({ ...u, project_count: countMap.get(u.id) || 0 })),
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── DELETE USER ─────────────────────────────────────────────────────────────
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id == id)
      return res.status(400).json({ message: "Cannot delete yourself" });
    const user = await User.findByPk(id, {
      attributes: ["id", "name", "email"],
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    await User.destroy({ where: { id } });
    await log(
      req,
      "DELETE_USER",
      "user",
      id,
      user.name,
      `Email: ${user.email}`,
    );
    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── PROMOTE USER TO ADMIN ───────────────────────────────────────────────────
exports.promoteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, { attributes: ["id", "name"] });
    if (!user) return res.status(404).json({ message: "User not found" });
    await User.update({ role: "admin" }, { where: { id } });
    await log(req, "PROMOTE_USER", "user", id, user.name, "Promoted to admin");
    return res.json({ message: "User promoted to admin" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── DEMOTE USER TO MEMBER ───────────────────────────────────────────────────
exports.demoteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id == id)
      return res.status(400).json({ message: "Cannot demote yourself" });
    const user = await User.findByPk(id, { attributes: ["id", "name"] });
    if (!user) return res.status(404).json({ message: "User not found" });
    await User.update({ role: "member" }, { where: { id } });
    await log(req, "DEMOTE_USER", "user", id, user.name, "Demoted to member");
    return res.json({ message: "User demoted to member" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── SUSPEND USER ────────────────────────────────────────────────────────────
exports.suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id == id)
      return res.status(400).json({ message: "Cannot suspend yourself" });
    const user = await User.findByPk(id, { attributes: ["id", "name"] });
    if (!user) return res.status(404).json({ message: "User not found" });
    await User.update({ is_suspended: true }, { where: { id } });
    await log(req, "SUSPEND_USER", "user", id, user.name);
    return res.json({ message: "User suspended" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── UNSUSPEND USER ──────────────────────────────────────────────────────────
exports.unsuspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, { attributes: ["id", "name"] });
    if (!user) return res.status(404).json({ message: "User not found" });
    await User.update({ is_suspended: false }, { where: { id } });
    await log(req, "UNSUSPEND_USER", "user", id, user.name);
    return res.json({ message: "User unsuspended" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── FORCE PASSWORD RESET ────────────────────────────────────────────────────
exports.forcePasswordReset = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ["id", "name", "email"],
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
    await User.update(
      { reset_token: token, reset_token_expiry: expiry },
      { where: { id } },
    );

    const appBase = process.env.APP_URL || "http://localhost:3000";
    const resetLink = `${appBase}/forgot-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "StudentCollabHub — Password Reset Required",
      html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
        <h2 style="color:#22d3ee;">Password Reset Required</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>An administrator has requested a password reset for your account.</p>
        <a href="${resetLink}" style="display:inline-block;margin:16px 0;padding:10px 24px;background:#22d3ee;color:#0f172a;border-radius:8px;font-weight:600;text-decoration:none;">Reset My Password</a>
        <p style="color:#64748b;font-size:12px;">This link expires in 2 hours.</p>
      </div>`,
      text: `Hi ${user.name}, an admin has requested a password reset. Visit: ${resetLink}`,
    });

    await log(
      req,
      "FORCE_RESET",
      "user",
      id,
      user.name,
      `Reset email sent to ${user.email}`,
    );
    return res.json({ message: "Password reset email sent" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── BULK ACTION ──────────────────────────────────────────────────────────────
exports.bulkAction = async (req, res) => {
  try {
    const { action, userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "userIds array is required" });
    }
    const safeIds = userIds.filter((uid) => uid != req.user.id);
    if (safeIds.length === 0)
      return res
        .status(400)
        .json({ message: "Cannot apply bulk action to yourself" });

    const users = await User.findAll({
      where: { id: safeIds },
      attributes: ["id", "name"],
      raw: true,
    });
    const names = users.map((u) => u.name).join(", ");

    if (action === "delete") {
      await User.destroy({ where: { id: safeIds } });
      await log(
        req,
        "BULK_DELETE_USERS",
        "user",
        null,
        null,
        `Deleted: ${names}`,
      );
    } else if (action === "demote") {
      await User.update({ role: "member" }, { where: { id: safeIds } });
      await log(
        req,
        "BULK_DEMOTE_USERS",
        "user",
        null,
        null,
        `Demoted: ${names}`,
      );
    } else if (action === "suspend") {
      await User.update({ is_suspended: true }, { where: { id: safeIds } });
      await log(
        req,
        "BULK_SUSPEND_USERS",
        "user",
        null,
        null,
        `Suspended: ${names}`,
      );
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    return res.json({
      message: `Bulk ${action} completed for ${safeIds.length} user(s)`,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── GET ALL PROJECTS ─────────────────────────────────────────────────────────
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll({
      order: [["created_at", "DESC"]],
      raw: true,
    });
    if (projects.length === 0) return res.json([]);

    const projectIds = projects.map((p) => p.id);
    const creatorIds = [...new Set(projects.map((p) => p.created_by))];

    const [creators, memberCounts, taskCounts] = await Promise.all([
      User.findAll({
        where: { id: creatorIds },
        attributes: ["id", "name"],
        raw: true,
      }),
      sequelize.query(
        `SELECT project_id, COUNT(*) AS member_count FROM project_members WHERE project_id IN (:ids) GROUP BY project_id`,
        {
          replacements: { ids: projectIds },
          type: sequelize.QueryTypes.SELECT,
        },
      ),
      sequelize.query(
        `SELECT project_id, COUNT(*) AS task_count, SUM(status='completed') AS completed_count FROM tasks WHERE project_id IN (:ids) GROUP BY project_id`,
        {
          replacements: { ids: projectIds },
          type: sequelize.QueryTypes.SELECT,
        },
      ),
    ]);

    const creatorMap = new Map(creators.map((u) => [u.id, u.name]));
    const memberMap = new Map(
      memberCounts.map((r) => [r.project_id, Number(r.member_count)]),
    );
    const taskMap = new Map(
      taskCounts.map((r) => [
        r.project_id,
        { total: Number(r.task_count), completed: Number(r.completed_count) },
      ]),
    );

    return res.json(
      projects.map((p) => ({
        ...p,
        creator_name: creatorMap.get(p.created_by) || "Unknown",
        member_count: memberMap.get(p.id) || 0,
        task_count: taskMap.get(p.id)?.total || 0,
        completed_task_count: taskMap.get(p.id)?.completed || 0,
      })),
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── DELETE ANY PROJECT ───────────────────────────────────────────────────────
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id, { attributes: ["id", "title"] });
    if (!project) return res.status(404).json({ message: "Project not found" });
    await Project.destroy({ where: { id } });
    await log(req, "DELETE_PROJECT", "project", id, project.title);
    return res.json({ message: "Project deleted by admin" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── ANALYTICS ───────────────────────────────────────────────────────────────
exports.getAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProjects,
      totalCompletedProjects,
      totalTasks,
      totalCompletedTasks,
      suspendedUsers,
      adminUsers,
    ] = await Promise.all([
      User.count(),
      Project.count(),
      Project.count({ where: { status: "completed" } }),
      Task.count(),
      Task.count({ where: { status: "completed" } }),
      User.count({ where: { is_suspended: true } }),
      User.count({ where: { role: "admin" } }),
    ]);

    let totalMessages = 0;
    try {
      const [rows] = await sequelize.query(
        "SELECT COUNT(*) AS cnt FROM messages",
      );
      totalMessages = Number(rows[0].cnt);
    } catch {
      /* ignore */
    }

    const [userGrowth, projectGrowth, topProjects] = await Promise.all([
      sequelize.query(
        `SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS count FROM users WHERE created_at >= DATE_SUB(NOW(),INTERVAL 6 MONTH) GROUP BY month ORDER BY month ASC`,
        { type: sequelize.QueryTypes.SELECT },
      ),
      sequelize.query(
        `SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COUNT(*) AS count FROM projects WHERE created_at >= DATE_SUB(NOW(),INTERVAL 6 MONTH) GROUP BY month ORDER BY month ASC`,
        { type: sequelize.QueryTypes.SELECT },
      ),
      sequelize.query(
        `SELECT p.title, COUNT(t.id) AS task_count FROM projects p LEFT JOIN tasks t ON t.project_id=p.id GROUP BY p.id ORDER BY task_count DESC LIMIT 5`,
        { type: sequelize.QueryTypes.SELECT },
      ),
    ]);

    return res.json({
      totalUsers,
      totalProjects,
      totalActiveProjects: totalProjects - totalCompletedProjects,
      totalCompletedProjects,
      totalTasks,
      totalCompletedTasks,
      totalMessages,
      suspendedUsers,
      adminUsers,
      userGrowth,
      projectGrowth,
      topProjects,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────
exports.getAuditLog = async (req, res) => {
  try {
    const logs = await AdminLog.findAll({
      order: [["created_at", "DESC"]],
      limit: 200,
      raw: true,
    });
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ─── SEND ANNOUNCEMENT ────────────────────────────────────────────────────────
exports.sendAnnouncement = async (req, res) => {
  try {
    const { message } = req.body;
    const trimmed = (message || "").trim();
    if (!trimmed)
      return res.status(400).json({ message: "Message is required" });

    const allUsers = await User.findAll({ attributes: ["id"], raw: true });
    if (allUsers.length === 0)
      return res.json({ message: "No users to notify", count: 0 });

    await Notification.bulkCreate(
      allUsers.map((u) => ({
        user_id: u.id,
        message: `📢 Admin Announcement: ${trimmed}`,
        is_read: false,
      })),
    );

    await log(req, "ANNOUNCEMENT", "system", null, null, trimmed.slice(0, 200));
    return res.json({ message: "Announcement sent", count: allUsers.length });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// DELETE USER
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id == id) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }

    await User.destroy({ where: { id } });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// PROMOTE USER TO ADMIN
exports.promoteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await User.update({ role: "admin" }, { where: { id } });

    res.json({ message: "User promoted to admin" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DEMOTE USER TO MEMBER
exports.demoteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id == id) {
      return res.status(400).json({ message: "Cannot demote yourself" });
    }

    await User.update({ role: "member" }, { where: { id } });

    res.json({ message: "User demoted to member" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL PROJECTS
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.findAll();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE ANY PROJECT
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    await Project.destroy({ where: { id } });

    res.json({ message: "Project deleted by admin" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalProjects = await Project.count();
    const totalCompletedProjects = await Project.count({
      where: { status: "completed" },
    });
    const totalActiveProjects = totalProjects - totalCompletedProjects;

    res.json({
      totalUsers,
      totalProjects,
      totalActiveProjects,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
