const TimeLog = require("../../models/TimeLog");
const Task = require("../../models/Task");
const User = require("../../models/User");
const ProjectMember = require("../../models/ProjectMember");
const sequelize = require("../../config/db");

let timeLogTableReady = false;
const ensureTimeLogTable = async () => {
  if (timeLogTableReady) return;
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS time_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      task_id INT NOT NULL,
      user_id INT NOT NULL,
      hours DECIMAL(6,2) NOT NULL,
      note VARCHAR(255),
      logged_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_time_logs_task_id (task_id),
      INDEX idx_time_logs_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  timeLogTableReady = true;
};

// GET TIME LOGS FOR A TASK
exports.getTimeLogsByTask = async (req, res) => {
  try {
    await ensureTimeLogTable();
    const { task_id } = req.params;
    const task = await Task.findByPk(task_id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const membership = await ProjectMember.findOne({
      where: { project_id: task.project_id, user_id: req.user.id }
    });
    if (!membership) return res.status(403).json({ message: "Not a project member" });

    const logs = await TimeLog.findAll({
      where: { task_id },
      order: [["logged_date", "DESC"], ["created_at", "DESC"]]
    });

    const userIds = [...new Set(logs.map((l) => l.user_id))];
    const users = userIds.length
      ? await User.findAll({ where: { id: userIds }, attributes: ["id", "name"] })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    const enriched = logs.map((l) => ({
      ...l.toJSON(),
      user_name: userMap.get(l.user_id) || "Unknown"
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET TIME LOGS FOR A PROJECT (summary per member)
exports.getTimeLogsByProject = async (req, res) => {
  try {
    await ensureTimeLogTable();
    const { project_id } = req.params;

    const membership = await ProjectMember.findOne({
      where: { project_id, user_id: req.user.id }
    });
    if (!membership) return res.status(403).json({ message: "Not a project member" });

    const [rows] = await sequelize.query(`
      SELECT tl.user_id, u.name AS user_name,
             ROUND(SUM(tl.hours), 2) AS total_hours,
             COUNT(DISTINCT tl.task_id) AS tasks_logged
      FROM time_logs tl
      JOIN tasks t ON tl.task_id = t.id
      JOIN users u ON tl.user_id = u.id
      WHERE t.project_id = ?
      GROUP BY tl.user_id, u.name
      ORDER BY total_hours DESC
    `, { replacements: [project_id] });

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LOG TIME FOR A TASK
exports.logTime = async (req, res) => {
  try {
    await ensureTimeLogTable();
    const { task_id } = req.params;
    const { hours, note, logged_date } = req.body;

    if (!hours || Number(hours) <= 0) {
      return res.status(400).json({ message: "Hours must be a positive number" });
    }

    const task = await Task.findByPk(task_id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const membership = await ProjectMember.findOne({
      where: { project_id: task.project_id, user_id: req.user.id }
    });
    if (!membership) return res.status(403).json({ message: "Not a project member" });

    const today = new Date().toISOString().split("T")[0];
    const log = await TimeLog.create({
      task_id: Number(task_id),
      user_id: req.user.id,
      hours: Number(hours),
      note: note || null,
      logged_date: logged_date || today
    });

    const user = await User.findByPk(req.user.id, { attributes: ["id", "name"] });
    res.status(201).json({ ...log.toJSON(), user_name: user?.name || "Unknown" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE A TIME LOG (own entry only or admin)
exports.deleteTimeLog = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await TimeLog.findByPk(id);
    if (!log) return res.status(404).json({ message: "Time log not found" });

    if (log.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await log.destroy();
    res.json({ message: "Time log deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
