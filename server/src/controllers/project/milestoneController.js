const Milestone = require("../../models/Milestone");
const Task = require("../../models/Task");
const ProjectMember = require("../../models/ProjectMember");
const Project = require("../../models/Project");
const User = require("../../models/User");
const { sendMilestoneCompletedEmail } = require("../../services/emailService");

// ensure milestones table exists
const sequelize = require("../../config/db");
let milestoneTableReady = false;
const ensureMilestoneTable = async () => {
  if (milestoneTableReady) return;
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS milestones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      due_date DATE,
      status ENUM('open','completed') DEFAULT 'open',
      created_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_milestones_project_id (project_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  milestoneTableReady = true;
};

// GET MILESTONES FOR A PROJECT
exports.getMilestones = async (req, res) => {
  try {
    await ensureMilestoneTable();
    const { project_id } = req.params;
    const membership = await ProjectMember.findOne({
      where: { project_id, user_id: req.user.id }
    });
    if (!membership) return res.status(403).json({ message: "Not a project member" });

    const milestones = await Milestone.findAll({
      where: { project_id },
      order: [["due_date", "ASC"], ["created_at", "ASC"]]
    });

    // Attach task counts per milestone (tasks linked by milestone_id)
    const milestoneIds = milestones.map((m) => m.id);
    let taskCounts = {};
    if (milestoneIds.length > 0) {
      const [rows] = await sequelize.query(
        `SELECT milestone_id, COUNT(*) AS total, SUM(status='completed') AS done
         FROM tasks WHERE milestone_id IN (${milestoneIds.join(",")}) GROUP BY milestone_id`
      );
      rows.forEach((r) => {
        taskCounts[r.milestone_id] = { total: Number(r.total), done: Number(r.done) };
      });
    }

    const result = milestones.map((m) => ({
      ...m.toJSON(),
      task_count: taskCounts[m.id]?.total || 0,
      done_count: taskCounts[m.id]?.done || 0
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CREATE MILESTONE
exports.createMilestone = async (req, res) => {
  try {
    await ensureMilestoneTable();
    const { project_id, title, description, due_date } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: "Title is required" });

    const membership = await ProjectMember.findOne({
      where: { project_id, user_id: req.user.id }
    });
    if (!membership) return res.status(403).json({ message: "Not a project member" });
    if (!membership.can_manage_tasks) return res.status(403).json({ message: "Task management permission required" });

    const milestone = await Milestone.create({
      project_id,
      title: title.trim(),
      description: description || null,
      due_date: due_date || null,
      created_by: req.user.id
    });

    res.status(201).json(milestone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE MILESTONE
exports.updateMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, due_date, status } = req.body;

    const milestone = await Milestone.findByPk(id);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });

    const membership = await ProjectMember.findOne({
      where: { project_id: milestone.project_id, user_id: req.user.id }
    });
    if (!membership) return res.status(403).json({ message: "Not a project member" });
    if (!membership.can_manage_tasks) return res.status(403).json({ message: "Task management permission required" });

    const wasOpen = milestone.status === "open";
    if (title) milestone.title = title.trim();
    if (description !== undefined) milestone.description = description;
    if (due_date !== undefined) milestone.due_date = due_date || null;
    if (status) milestone.status = status;
    await milestone.save();

    // Send emails when milestone is completed
    if (wasOpen && milestone.status === "completed") {
      try {
        const project = await Project.findByPk(milestone.project_id);
        const members = await ProjectMember.findAll({ where: { project_id: milestone.project_id } });
        const userIds = members.map((m) => m.user_id);
        const users = await User.findAll({ where: { id: userIds }, attributes: ["id", "name", "email"] });
        for (const user of users) {
          await sendMilestoneCompletedEmail({
            toEmail: user.email,
            toName: user.name,
            milestoneTitle: milestone.title,
            projectTitle: project?.title || "Project"
          });
        }
      } catch (emailErr) {
        console.error("Milestone email error:", emailErr.message);
      }
    }

    res.json(milestone);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE MILESTONE
exports.deleteMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const milestone = await Milestone.findByPk(id);
    if (!milestone) return res.status(404).json({ message: "Milestone not found" });

    const project = await Project.findByPk(milestone.project_id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.created_by !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only project creator can delete milestones" });
    }

    await milestone.destroy();
    res.json({ message: "Milestone deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
