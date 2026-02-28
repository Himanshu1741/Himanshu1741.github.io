const Task = require("../../models/Task");
const ProjectMember = require("../../models/ProjectMember");
const Project = require("../../models/Project");
const Notification = require("../../models/Notification");
const User = require("../../models/User");
const sequelize = require("../../config/db");
const { sendTaskAssignedEmail } = require("../../services/emailService");
const { getIo } = require("../../config/socketInstance");

const emitToProject = (projectId, event, payload = {}) => {
  try {
    getIo()?.to(String(projectId)).emit(event, payload);
  } catch {}
};

let taskTrashTableReady = false;

const ensureTaskTrashTable = async () => {
  if (taskTrashTableReady) return;

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS task_trash (
      id INT AUTO_INCREMENT PRIMARY KEY,
      task_id INT NOT NULL,
      project_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      status VARCHAR(32) NOT NULL,
      assigned_to INT NULL,
      deleted_by INT NOT NULL,
      deleted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_task_trash_project_id (project_id),
      INDEX idx_task_trash_deleted_at (deleted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  taskTrashTableReady = true;
};

// CREATE TASK
exports.createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      project_id,
      assigned_to,
      due_date,
      priority,
      milestone_id,
      estimated_hours,
    } = req.body;

    const membership = await ProjectMember.findOne({
      where: { project_id, user_id: req.user.id },
    });

    if (!membership)
      return res.status(403).json({ message: "Not a project member" });
    if (!membership.can_manage_tasks)
      return res
        .status(403)
        .json({ message: "Task management permission denied" });

    const task = await Task.create({
      title,
      description: description || null,
      project_id,
      assigned_to: assigned_to || null,
      due_date: due_date || null,
      priority: priority || "medium",
      milestone_id: milestone_id || null,
      estimated_hours: estimated_hours || null,
    });

    if (assigned_to) {
      await Notification.create({
        message: `You have been assigned a new task: ${title}`,
        user_id: assigned_to,
      });
      // Send email notification
      try {
        const assignee = await User.findByPk(assigned_to, {
          attributes: ["id", "name", "email"],
        });
        const project = await Project.findByPk(project_id, {
          attributes: ["id", "title"],
        });
        if (assignee && project) {
          await sendTaskAssignedEmail({
            toEmail: assignee.email,
            toName: assignee.name,
            taskTitle: title,
            projectTitle: project.title,
            dueDate: due_date || null,
          });
        }
      } catch (emailErr) {
        console.error("Task assign email error:", emailErr.message);
      }
    }

    emitToProject(project_id, "taskCreated", { task });
    res.status(201).json({ message: "Task created successfully", task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET TASKS BY PROJECT
exports.getTasksByProject = async (req, res) => {
  try {
    const { project_id } = req.params;

    const membership = await ProjectMember.findOne({
      where: {
        project_id,
        user_id: req.user.id,
      },
    });

    if (!membership) {
      return res.status(403).json({ message: "Not a project member" });
    }
    const tasks = await Task.findAll({
      where: { project_id },
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE TASK (status, priority, due_date, assigned_to, description, title, milestone_id, estimated_hours)
exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      priority,
      due_date,
      assigned_to,
      title,
      description,
      milestone_id,
      estimated_hours,
    } = req.body;

    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const membership = await ProjectMember.findOne({
      where: { project_id: task.project_id, user_id: req.user.id },
    });
    if (!membership)
      return res.status(403).json({ message: "Not a project member" });
    if (!membership.can_manage_tasks)
      return res
        .status(403)
        .json({ message: "Task management permission denied" });

    const updates = {};
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (due_date !== undefined) updates.due_date = due_date || null;
    if (assigned_to !== undefined) updates.assigned_to = assigned_to || null;
    if (title !== undefined && title.trim()) updates.title = title.trim();
    if (description !== undefined) updates.description = description || null;
    if (milestone_id !== undefined) updates.milestone_id = milestone_id || null;
    if (estimated_hours !== undefined)
      updates.estimated_hours = estimated_hours || null;

    await Task.update(updates, { where: { id } });

    // Notify new assignee (if changed)
    if (
      assigned_to !== undefined &&
      assigned_to &&
      assigned_to !== task.assigned_to
    ) {
      const project = await Project.findByPk(task.project_id, {
        attributes: ["id", "title"],
      });
      await Notification.create({
        message: `You have been assigned a task: ${updates.title || task.title}`,
        user_id: assigned_to,
      });
      try {
        const assignee = await User.findByPk(assigned_to, {
          attributes: ["id", "name", "email"],
        });
        if (assignee && project) {
          await sendTaskAssignedEmail({
            toEmail: assignee.email,
            toName: assignee.name,
            taskTitle: updates.title || task.title,
            projectTitle: project.title,
            dueDate: updates.due_date || task.due_date,
          });
        }
      } catch (emailErr) {
        console.error("Task reassign email error:", emailErr.message);
      }
    }

    const updatedTask = await Task.findByPk(id);
    emitToProject(updatedTask.project_id, "taskUpdated", { task: updatedTask });
    res.json({ message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE TASK
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await Project.findByPk(task.project_id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.created_by !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the project creator can delete tasks" });
    }

    await ensureTaskTrashTable();

    await sequelize.query(
      `
        INSERT INTO task_trash
          (task_id, project_id, title, description, status, assigned_to, deleted_by)
        VALUES
          (?, ?, ?, ?, ?, ?, ?)
      `,
      {
        replacements: [
          task.id,
          task.project_id,
          task.title,
          task.description || null,
          task.status,
          task.assigned_to || null,
          req.user.id,
        ],
      },
    );

    const projectId = task.project_id;
    await Task.destroy({
      where: { id },
    });

    emitToProject(projectId, "taskDeleted", { taskId: id });
    res.json({ message: "Task moved to trash successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL TRASHED TASKS (for current user across all their projects)
exports.getAllTrashedTasks = async (req, res) => {
  try {
    await ensureTaskTrashTable();
    const [rows] = await sequelize.query(
      `SELECT tt.id, tt.task_id, tt.project_id, tt.title, tt.description,
              tt.status, tt.assigned_to, tt.deleted_by, tt.deleted_at,
              p.title AS project_title
       FROM task_trash tt
       JOIN projects p ON p.id = tt.project_id
       WHERE p.created_by = ?
       ORDER BY tt.deleted_at DESC`,
      { replacements: [req.user.id] },
    );
    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// GET DELETED TASKS BY PROJECT (TRASH)
exports.getDeletedTasksByProject = async (req, res) => {
  try {
    const { project_id } = req.params;

    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.created_by !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the project creator can view task trash" });
    }

    await ensureTaskTrashTable();

    const [rows] = await sequelize.query(
      `
        SELECT id, task_id, project_id, title, description, status, assigned_to, deleted_by, deleted_at
        FROM task_trash
        WHERE project_id = ?
        ORDER BY deleted_at DESC
      `,
      {
        replacements: [project_id],
      },
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// RESTORE TASK FROM TRASH
exports.restoreTask = async (req, res) => {
  try {
    const { id } = req.params;

    await ensureTaskTrashTable();

    const [rows] = await sequelize.query(
      `SELECT * FROM task_trash WHERE id = ? LIMIT 1`,
      { replacements: [id] },
    );

    const trashedTask = rows?.[0];
    if (!trashedTask) {
      return res.status(404).json({ message: "Trashed task not found" });
    }

    const project = await Project.findByPk(trashedTask.project_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.created_by !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the project creator can restore tasks" });
    }

    const restoredTask = await Task.create({
      title: trashedTask.title,
      description: trashedTask.description,
      status: trashedTask.status,
      project_id: trashedTask.project_id,
      assigned_to: trashedTask.assigned_to,
    });

    await sequelize.query(`DELETE FROM task_trash WHERE id = ?`, {
      replacements: [id],
    });

    emitToProject(restoredTask.project_id, "taskCreated", {
      task: restoredTask,
    });
    return res.json({
      message: "Task restored successfully",
      task: restoredTask,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// PERMANENT DELETE FROM TRASH (CANNOT RECOVER)
exports.deleteTaskPermanently = async (req, res) => {
  try {
    const { trash_id } = req.params;

    await ensureTaskTrashTable();

    const [rows] = await sequelize.query(
      `SELECT id, project_id FROM task_trash WHERE id = ? LIMIT 1`,
      { replacements: [trash_id] },
    );

    const trashedTask = rows?.[0];
    if (!trashedTask) {
      return res.status(404).json({ message: "Trashed task not found" });
    }

    const project = await Project.findByPk(trashedTask.project_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.created_by !== req.user.id) {
      return res.status(403).json({
        message:
          "Only the project creator can permanently delete trashed tasks",
      });
    }

    await sequelize.query(`DELETE FROM task_trash WHERE id = ?`, {
      replacements: [trash_id],
    });

    return res.json({ message: "Task permanently deleted from trash" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// GET ALL DEADLINES — tasks with due_date across all user's projects
exports.getDeadlines = async (req, res) => {
  try {
    const { Op } = require("sequelize");

    const memberships = await ProjectMember.findAll({
      where: { user_id: req.user.id },
      attributes: ["project_id"],
    });
    const projectIds = memberships.map((m) => m.project_id);
    if (!projectIds.length) return res.json([]);

    const tasks = await Task.findAll({
      where: {
        project_id: { [Op.in]: projectIds },
        due_date: { [Op.ne]: null },
      },
      order: [["due_date", "ASC"]],
    });

    const projects = await Project.findAll({
      where: { id: { [Op.in]: projectIds } },
      attributes: ["id", "title"],
    });
    const projMap = Object.fromEntries(projects.map((p) => [p.id, p.title]));

    const result = tasks.map((t) => ({
      ...t.toJSON(),
      project_title: projMap[t.project_id] || "Unknown",
    }));

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
