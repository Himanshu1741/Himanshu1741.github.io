const Project = require("../../models/Project");
const ProjectMember = require("../../models/ProjectMember");
const User = require("../../models/User");
const Task = require("../../models/Task");
const File = require("../../models/File");
const Message = require("../../models/Message");
const Activity = require("../../models/Activity");
const Invitation = require("../../models/Invitation");
const crypto = require("crypto");
const { Op } = require("sequelize");
const sequelize = require("../../config/db");
const { sendMemberInvitedEmail } = require("../../services/emailService");

let projectTrashTableReady = false;

const ensureProjectTrashTable = async () => {
  if (projectTrashTableReady) return;

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS project_trash (
      id INT AUTO_INCREMENT PRIMARY KEY,
      original_project_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT NULL,
      github_repo VARCHAR(255) NULL,
      status VARCHAR(32) NOT NULL,
      created_by INT NOT NULL,
      deleted_by INT NOT NULL,
      deleted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_project_trash_created_by (created_by),
      INDEX idx_project_trash_deleted_at (deleted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  projectTrashTableReady = true;
};

// CREATE PROJECT
exports.createProject = async (req, res) => {
  try {
    const { title, description } = req.body;

    const project = await Project.create({
      title,
      description,
      status: "active",
      created_by: req.user.id,
    });

    // Automatically add creator as member
    await ProjectMember.create({
      project_id: project.id,
      user_id: req.user.id,
      can_manage_tasks: true,
      can_manage_files: true,
      can_chat: true,
      can_change_project_name: true,
      can_add_members: true,
      member_role: "creator",
    });

    await Activity.create({
      action: `Created project: ${title}`,
      user_id: req.user.id,
    });

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET ALL PROJECTS FOR LOGGED USER
exports.getProjects = async (req, res) => {
  try {
    const memberships = await ProjectMember.findAll({
      where: { user_id: req.user.id },
    });

    const projectIds = memberships.map((m) => m.project_id);

    const projects = await Project.findAll({
      where: { id: projectIds },
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET SINGLE PROJECT BY ID
exports.getProject = async (req, res) => {
  try {
    const { id } = req.params;
    const membership = await ProjectMember.findOne({
      where: { project_id: id, user_id: req.user.id },
    });
    if (!membership) {
      return res.status(403).json({ message: "Not a project member" });
    }
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    return res.json(project);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// DASHBOARD SUMMARY FOR LOGGED USER
exports.getDashboardSummary = async (req, res) => {
  try {
    const memberships = await ProjectMember.findAll({
      where: { user_id: req.user.id },
    });

    const projectIds = memberships.map((m) => m.project_id);
    if (projectIds.length === 0) {
      return res.json({
        totalProjects: 0,
        totalActiveProjects: 0,
        totalCompletedProjects: 0,
        totalTasks: 0,
        totalCompletedTasks: 0,
        totalInProgressTasks: 0,
        totalTodoTasks: 0,
        totalFiles: 0,
        totalMessages: 0,
      });
    }

    const [
      totalTasks,
      totalCompletedTasks,
      totalInProgressTasks,
      totalTodoTasks,
      totalFiles,
      totalMessages,
      ownedProjects,
    ] = await Promise.all([
      Task.count({ where: { project_id: { [Op.in]: projectIds } } }),
      Task.count({
        where: { project_id: { [Op.in]: projectIds }, status: "completed" },
      }),
      Task.count({
        where: { project_id: { [Op.in]: projectIds }, status: "in_progress" },
      }),
      Task.count({
        where: { project_id: { [Op.in]: projectIds }, status: "todo" },
      }),
      File.count({ where: { project_id: { [Op.in]: projectIds } } }),
      Message.count({ where: { project_id: { [Op.in]: projectIds } } }),
      Project.findAll({
        where: { id: { [Op.in]: projectIds }, created_by: req.user.id },
        attributes: ["id", "status"],
        raw: true,
      }),
    ]);
    const totalOwnedProjects = ownedProjects.length;
    const totalCompletedOwnedProjects = ownedProjects.filter(
      (project) => project.status === "completed",
    ).length;
    const totalActiveProjects =
      totalOwnedProjects - totalCompletedOwnedProjects;

    res.json({
      totalProjects: projectIds.length,
      totalOwnedProjects,
      totalActiveProjects,
      totalCompletedProjects: totalCompletedOwnedProjects,
      totalTasks,
      totalCompletedTasks,
      totalInProgressTasks,
      totalTodoTasks,
      totalFiles,
      totalMessages,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ADD MEMBER
exports.addMember = async (req, res) => {
  try {
    const {
      project_id,
      user_id,
      username,
      email,
      can_manage_tasks,
      can_manage_files,
      can_chat,
      can_change_project_name,
      can_add_members,
      member_role,
    } = req.body;
    const projectId = Number(project_id);
    const userId = user_id ? Number(user_id) : null;
    const identifier = (email || username || "").trim();

    if (!projectId) {
      return res.status(400).json({ message: "project_id is required" });
    }

    if (!userId && !identifier) {
      return res
        .status(400)
        .json({ message: "Provide user_id or username/email" });
    }

    const project = await Project.findByPk(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const requesterMembership = await ProjectMember.findOne({
      where: { project_id: projectId, user_id: req.user.id },
    });

    const canAddMembers = Boolean(
      project.created_by === req.user.id ||
      (requesterMembership && requesterMembership.can_add_members),
    );

    if (!canAddMembers) {
      return res.status(403).json({ message: "Add member permission denied" });
    }

    const isCreator = project.created_by === req.user.id;
    if (!isCreator) {
      return res.status(403).json({
        message:
          "Only project creator can add members because role and permissions are mandatory",
      });
    }

    const roleValue = typeof member_role === "string" ? member_role.trim() : "";
    const hasAllPermissionFlags =
      typeof can_manage_tasks === "boolean" &&
      typeof can_manage_files === "boolean" &&
      typeof can_chat === "boolean" &&
      typeof can_change_project_name === "boolean" &&
      typeof can_add_members === "boolean";

    if (!roleValue || !hasAllPermissionFlags) {
      return res.status(400).json({
        message: "member_role and all permission fields are mandatory",
      });
    }

    let memberUser = null;
    if (userId) {
      memberUser = await User.findByPk(userId);
    } else {
      memberUser = await User.findOne({ where: { email: identifier } });
      if (!memberUser) {
        memberUser = await User.findOne({ where: { name: identifier } });
      }
    }

    if (!memberUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingMembership = await ProjectMember.findOne({
      where: { project_id: projectId, user_id: memberUser.id },
    });
    if (existingMembership) {
      return res
        .status(409)
        .json({ message: "User is already a project member" });
    }

    await ProjectMember.create({
      project_id: projectId,
      user_id: memberUser.id,
      can_manage_tasks,
      can_manage_files,
      can_chat,
      can_change_project_name,
      can_add_members,
      member_role: roleValue,
    });

    // Send invitation email
    try {
      const inviterUser = await User.findByPk(req.user.id, {
        attributes: ["name"],
      });
      await sendMemberInvitedEmail({
        toEmail: memberUser.email,
        toName: memberUser.name,
        projectTitle: project.title,
        inviterName: inviterUser?.name || "A team member",
      });
    } catch (emailErr) {
      console.error("Member invite email error:", emailErr.message);
    }

    res.json({ message: "Member added successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE PROJECT (Only Creator)
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Only creator or admin
    if (project.created_by !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await ensureProjectTrashTable();

    await sequelize.query(
      `
        INSERT INTO project_trash
          (original_project_id, title, description, github_repo, status, created_by, deleted_by)
        VALUES
          (?, ?, ?, ?, ?, ?, ?)
      `,
      {
        replacements: [
          project.id,
          project.title,
          project.description || null,
          project.github_repo || null,
          project.status,
          project.created_by,
          req.user.id,
        ],
      },
    );

    await project.destroy();

    res.json({ message: "Project moved to trash successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET DELETED PROJECTS FOR DASHBOARD TRASH
exports.getDeletedProjects = async (req, res) => {
  try {
    await ensureProjectTrashTable();

    const whereClause =
      req.user.role === "admin" ? "" : "WHERE created_by = ? OR deleted_by = ?";
    const replacements =
      req.user.role === "admin" ? [] : [req.user.id, req.user.id];

    const [rows] = await sequelize.query(
      `
        SELECT id, original_project_id, title, description, github_repo, status, created_by, deleted_by, deleted_at
        FROM project_trash
        ${whereClause}
        ORDER BY deleted_at DESC
      `,
      { replacements },
    );

    return res.json(rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// RESTORE PROJECT FROM TRASH
exports.restoreDeletedProject = async (req, res) => {
  try {
    const { id } = req.params;
    await ensureProjectTrashTable();

    const [rows] = await sequelize.query(
      `SELECT * FROM project_trash WHERE id = ? LIMIT 1`,
      { replacements: [id] },
    );
    const trashedProject = rows?.[0];

    if (!trashedProject) {
      return res.status(404).json({ message: "Trashed project not found" });
    }

    const canManage =
      req.user.role === "admin" || req.user.id === trashedProject.created_by;
    if (!canManage) {
      return res.status(403).json({
        message: "Only project creator or admin can restore this project",
      });
    }

    const existingProject = await Project.findByPk(
      trashedProject.original_project_id,
    );
    let restoredProjectId = trashedProject.original_project_id;

    if (!existingProject) {
      await sequelize.query(
        `
          INSERT INTO projects (id, title, description, github_repo, status, created_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        {
          replacements: [
            trashedProject.original_project_id,
            trashedProject.title,
            trashedProject.description,
            trashedProject.github_repo,
            trashedProject.status === "completed" ? "completed" : "active",
            trashedProject.created_by,
          ],
        },
      );
    } else {
      const recreated = await Project.create({
        title: trashedProject.title,
        description: trashedProject.description,
        github_repo: trashedProject.github_repo,
        status: trashedProject.status === "completed" ? "completed" : "active",
        created_by: trashedProject.created_by,
      });
      restoredProjectId = recreated.id;
    }

    const creatorMembership = await ProjectMember.findOne({
      where: {
        project_id: restoredProjectId,
        user_id: trashedProject.created_by,
      },
    });

    if (!creatorMembership) {
      await ProjectMember.create({
        project_id: restoredProjectId,
        user_id: trashedProject.created_by,
        can_manage_tasks: true,
        can_manage_files: true,
        can_chat: true,
        can_change_project_name: true,
        can_add_members: true,
        member_role: "creator",
      });
    }

    await sequelize.query(`DELETE FROM project_trash WHERE id = ?`, {
      replacements: [id],
    });

    return res.json({
      message: "Project restored successfully",
      project_id: restoredProjectId,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// PERMANENT DELETE FROM TRASH (NOT RECOVERABLE)
exports.deleteTrashedProjectPermanently = async (req, res) => {
  try {
    const { id } = req.params;
    await ensureProjectTrashTable();

    const [rows] = await sequelize.query(
      `SELECT * FROM project_trash WHERE id = ? LIMIT 1`,
      { replacements: [id] },
    );
    const trashedProject = rows?.[0];

    if (!trashedProject) {
      return res.status(404).json({ message: "Trashed project not found" });
    }

    const canManage =
      req.user.role === "admin" || req.user.id === trashedProject.created_by;
    if (!canManage) {
      return res.status(403).json({
        message:
          "Only project creator or admin can permanently delete this project",
      });
    }

    const originalId = trashedProject.original_project_id;

    await Promise.all([
      Task.destroy({ where: { project_id: originalId } }),
      File.destroy({ where: { project_id: originalId } }),
      Message.destroy({ where: { project_id: originalId } }),
      ProjectMember.destroy({ where: { project_id: originalId } }),
      Invitation.destroy({ where: { project_id: originalId } }),
    ]);

    await Project.destroy({ where: { id: originalId } });

    await sequelize.query(`DELETE FROM project_trash WHERE id = ?`, {
      replacements: [id],
    });

    return res.json({ message: "Project permanently deleted from trash" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Helper: validate a github repo URL/slug against the GitHub API
// UPDATE PROJECT (CREATOR OR PERMITTED MEMBER)
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const membership = await ProjectMember.findOne({
      where: { project_id: id, user_id: req.user.id },
    });

    const canChangeName = Boolean(
      project.created_by === req.user.id ||
      (membership && membership.can_change_project_name),
    );

    if (!canChangeName) {
      return res
        .status(403)
        .json({ message: "Project name/description change permission denied" });
    }

    const nextTitle = (title || "").trim();
    const nextDescription =
      typeof description === "string"
        ? description.trim()
        : project.description;

    if (!nextTitle) {
      return res.status(400).json({ message: "Project title is required" });
    }

    project.title = nextTitle;
    project.description = nextDescription;
    await project.save();

    return res.json({ message: "Project updated successfully", project });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// UPDATE PROJECT STATUS (ONLY CREATOR)
exports.updateProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "completed"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be active or completed" });
    }

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.created_by !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only project creator can change project status" });
    }

    project.status = status;
    await project.save();

    return res.json({
      message: "Project status updated successfully",
      project,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// GET PROJECT MEMBERS (ONLY CREATOR)
exports.getProjectMembers = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.created_by !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only project creator can view member settings" });
    }

    const memberships = await ProjectMember.findAll({
      where: { project_id: id },
      attributes: [
        "user_id",
        "can_manage_tasks",
        "can_manage_files",
        "can_chat",
        "can_change_project_name",
        "can_add_members",
        "member_role",
      ],
    });

    const userIds = memberships.map((m) => m.user_id);

    const users = await User.findAll({
      where: { id: userIds },
      attributes: ["id", "name", "email", "role"],
    });

    const permissionMap = new Map(
      memberships.map((m) => [
        m.user_id,
        {
          can_manage_tasks: m.can_manage_tasks,
          can_manage_files: m.can_manage_files,
          can_chat: m.can_chat,
          can_change_project_name: m.can_change_project_name,
          can_add_members: m.can_add_members,
          member_role: m.member_role,
        },
      ]),
    );

    const members = users.map((u) => {
      const p = permissionMap.get(u.id) || {
        can_manage_tasks: false,
        can_manage_files: false,
        can_chat: false,
        can_change_project_name: false,
        can_add_members: false,
        member_role: "member",
      };
      return {
        ...u.toJSON(),
        is_creator: u.id === project.created_by,
        ...p,
      };
    });

    return res.json({ members });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// GET BASIC MEMBER LIST FOR ANY PROJECT MEMBER (used for @mention autocomplete, task assignees)
exports.getMemberList = async (req, res) => {
  try {
    const { id } = req.params;
    const membership = await ProjectMember.findOne({
      where: { project_id: id, user_id: req.user.id },
    });
    if (!membership)
      return res.status(403).json({ message: "Not a project member" });

    const memberships = await ProjectMember.findAll({
      where: { project_id: id },
      attributes: ["user_id", "member_role"],
      raw: true,
    });
    const roleByUserId = new Map(
      memberships.map((m) => [m.user_id, m.member_role]),
    );
    const userIds = memberships.map((m) => m.user_id);
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ["id", "name", "email"],
    });
    // Return with user_id alias so frontend is consistent
    const list = users.map((u) => ({
      user_id: u.id,
      id: u.id,
      name: u.name,
      email: u.email,
      member_role: roleByUserId.get(u.id) || null,
    }));
    return res.json(list);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// GET CURRENT USER PERMISSIONS IN A PROJECT
exports.getMyProjectPermissions = async (req, res) => {
  try {
    const { id } = req.params;

    const membership = await ProjectMember.findOne({
      where: { project_id: id, user_id: req.user.id },
      attributes: [
        "can_manage_tasks",
        "can_manage_files",
        "can_chat",
        "can_change_project_name",
        "can_add_members",
        "member_role",
      ],
    });

    if (!membership) {
      return res.status(403).json({ message: "Not a project member" });
    }

    return res.json({
      permissions: {
        can_manage_tasks: membership.can_manage_tasks,
        can_manage_files: membership.can_manage_files,
        can_chat: membership.can_chat,
        can_change_project_name: membership.can_change_project_name,
        can_add_members: membership.can_add_members,
        member_role: membership.member_role,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// AI PROJECT COPILOT (PER-PROJECT)
exports.getProjectCopilot = async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = Number(id);
    if (!projectId) {
      return res.status(400).json({ message: "Invalid project id" });
    }

    const membership = await ProjectMember.findOne({
      where: { project_id: projectId, user_id: req.user.id },
    });
    if (!membership) {
      return res.status(403).json({ message: "Not a project member" });
    }

    const project = await Project.findByPk(projectId, {
      attributes: ["id", "title", "status", "created_by"],
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalTasks,
      doneTasks,
      inProgressTasks,
      todoTasks,
      recentMessages,
      recentFiles,
      recentActivities,
    ] = await Promise.all([
      Task.count({ where: { project_id: projectId } }),
      Task.count({ where: { project_id: projectId, status: "completed" } }),
      Task.count({ where: { project_id: projectId, status: "in_progress" } }),
      Task.count({ where: { project_id: projectId, status: "todo" } }),
      Message.findAll({
        where: {
          project_id: projectId,
          created_at: { [Op.gte]: startOfToday },
        },
        attributes: ["id", "content", "sender_id", "created_at"],
        order: [["created_at", "DESC"]],
        limit: 5,
        raw: true,
      }),
      File.findAll({
        where: {
          project_id: projectId,
          created_at: { [Op.gte]: startOfToday },
        },
        attributes: ["id", "filename", "uploaded_by", "created_at"],
        order: [["created_at", "DESC"]],
        limit: 5,
        raw: true,
      }),
      Activity.findAll({
        where: {
          user_id: req.user.id,
          created_at: { [Op.gte]: startOfToday },
          action: { [Op.like]: `%${project.title}%` },
        },
        attributes: ["id", "action", "created_at"],
        order: [["created_at", "DESC"]],
        limit: 5,
        raw: true,
      }),
    ]);

    const actorIds = Array.from(
      new Set([
        ...recentMessages.map((m) => m.sender_id).filter(Boolean),
        ...recentFiles.map((f) => f.uploaded_by).filter(Boolean),
      ]),
    );

    const actors = actorIds.length
      ? await User.findAll({
          where: { id: actorIds },
          attributes: ["id", "name"],
          raw: true,
        })
      : [];

    const actorNameById = new Map(actors.map((u) => [u.id, u.name]));

    const lastMessage = await Message.findOne({
      where: { project_id: projectId },
      attributes: ["created_at"],
      order: [["created_at", "DESC"]],
      raw: true,
    });
    const lastFile = await File.findOne({
      where: { project_id: projectId },
      attributes: ["created_at"],
      order: [["created_at", "DESC"]],
      raw: true,
    });

    const whatChangedToday = [];
    whatChangedToday.push(`Messages today: ${recentMessages.length}`);
    whatChangedToday.push(`Files uploaded today: ${recentFiles.length}`);
    whatChangedToday.push(
      `Task board snapshot: ${doneTasks}/${totalTasks} tasks completed`,
    );

    if (recentMessages.length > 0) {
      const latestMessage = recentMessages[0];
      const messageAuthor =
        actorNameById.get(latestMessage.sender_id) || "A teammate";
      whatChangedToday.push(`Latest chat update from ${messageAuthor}`);
    }

    if (recentFiles.length > 0) {
      const latestFile = recentFiles[0];
      const fileAuthor =
        actorNameById.get(latestFile.uploaded_by) || "A teammate";
      whatChangedToday.push(
        `Latest upload: ${latestFile.filename || "file"} by ${fileAuthor}`,
      );
    }

    if (recentActivities.length > 0) {
      whatChangedToday.push(
        `Recent activity logged: ${recentActivities[0].action}`,
      );
    }

    const nextBestActions = [];
    if (totalTasks === 0) {
      nextBestActions.push(
        "Create initial tasks so the team can start execution.",
      );
    } else {
      const completionRate = Math.round((doneTasks / totalTasks) * 100);
      if (todoTasks > 0) {
        nextBestActions.push(
          `Prioritize ${Math.min(todoTasks, 3)} todo task(s) and assign owners.`,
        );
      }
      if (inProgressTasks > doneTasks) {
        nextBestActions.push(
          "Reduce work in progress by finishing in-progress tasks before adding new ones.",
        );
      }
      if (completionRate < 50) {
        nextBestActions.push(
          "Set a short milestone to push task completion above 50%.",
        );
      }
    }

    const now = new Date();
    if (
      !lastMessage ||
      (now - new Date(lastMessage.created_at)) / (1000 * 60 * 60) > 24
    ) {
      nextBestActions.push(
        "Post a brief status update in project chat to align members.",
      );
    }
    if (
      !lastFile ||
      (now - new Date(lastFile.created_at)) / (1000 * 60 * 60) > 72
    ) {
      nextBestActions.push(
        "Upload latest docs/assets so everyone works from current files.",
      );
    }
    if (
      project.status !== "completed" &&
      doneTasks > 0 &&
      doneTasks === totalTasks
    ) {
      nextBestActions.push(
        "All tasks are done; mark the project as completed.",
      );
    }
    if (nextBestActions.length === 0) {
      nextBestActions.push(
        "Keep current execution pace and review progress in the next standup.",
      );
    }

    return res.json({
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
      },
      generated_at: new Date().toISOString(),
      what_changed_today: whatChangedToday,
      next_best_actions: nextBestActions,
      signals: {
        total_tasks: totalTasks,
        completed_tasks: doneTasks,
        in_progress_tasks: inProgressTasks,
        todo_tasks: todoTasks,
        messages_today: recentMessages.length,
        files_today: recentFiles.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// REMOVE PROJECT MEMBER (ONLY CREATOR)
exports.removeMember = async (req, res) => {
  try {
    const { id, user_id } = req.params;
    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.created_by !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only project creator can remove members" });
    }

    const targetUserId = Number(user_id);
    if (!targetUserId) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (targetUserId === project.created_by) {
      return res
        .status(400)
        .json({ message: "Project creator cannot be removed" });
    }

    const removedCount = await ProjectMember.destroy({
      where: {
        project_id: id,
        user_id: targetUserId,
      },
    });

    if (!removedCount) {
      return res
        .status(404)
        .json({ message: "Member not found in this project" });
    }

    return res.json({ message: "Member removed successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// UPDATE MEMBER PERMISSIONS (ONLY CREATOR)
exports.updateMemberPermissions = async (req, res) => {
  try {
    const { id, user_id } = req.params;
    const {
      can_manage_tasks,
      can_manage_files,
      can_chat,
      can_change_project_name,
      can_add_members,
      member_role,
    } = req.body;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.created_by !== req.user.id) {
      return res.status(403).json({
        message: "Only project creator can update member permissions",
      });
    }

    const targetUserId = Number(user_id);
    if (!targetUserId) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (targetUserId === project.created_by) {
      return res
        .status(400)
        .json({ message: "Cannot change creator permissions" });
    }

    const membership = await ProjectMember.findOne({
      where: { project_id: id, user_id: targetUserId },
    });

    if (!membership) {
      return res
        .status(404)
        .json({ message: "Member not found in this project" });
    }

    await membership.update({
      can_manage_tasks:
        typeof can_manage_tasks === "boolean"
          ? can_manage_tasks
          : membership.can_manage_tasks,
      can_manage_files:
        typeof can_manage_files === "boolean"
          ? can_manage_files
          : membership.can_manage_files,
      can_chat: typeof can_chat === "boolean" ? can_chat : membership.can_chat,
      can_change_project_name:
        typeof can_change_project_name === "boolean"
          ? can_change_project_name
          : membership.can_change_project_name,
      can_add_members:
        typeof can_add_members === "boolean"
          ? can_add_members
          : membership.can_add_members,
      member_role:
        typeof member_role === "string" && member_role.trim()
          ? member_role.trim()
          : membership.member_role,
    });

    return res.json({ message: "Member permissions updated", membership });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// SEND INVITATION EMAIL (CREATOR OR ADMIN)
exports.sendInvitation = async (req, res) => {
  try {
    const { project_id, email } = req.body;
    const normalizedEmail = (email || "").trim();

    if (!project_id || !normalizedEmail) {
      return res
        .status(400)
        .json({ message: "project_id and email are required" });
    }

    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.created_by !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only project creator or admin can invite users" });
    }

    // Remove any stale invitation for the same email+project before creating a new one
    await Invitation.destroy({ where: { email: normalizedEmail, project_id } });

    const token = crypto.randomBytes(32).toString("hex");
    await Invitation.create({ email: normalizedEmail, project_id, token });

    const inviter = await User.findByPk(req.user.id, { attributes: ["name"] });
    const inviterName = inviter?.name || "A team member";
    const appBase = process.env.APP_URL || "http://localhost:3000";
    const inviteLink = `${appBase}/accept-invite/${token}`;

    const { sendEmail } = require("../../services/emailService");
    await sendEmail({
      to: normalizedEmail,
      subject: `[${project.title}] You've been invited to collaborate`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
          <h2 style="color:#22d3ee;">Project Invitation</h2>
          <p>Hi there,</p>
          <p><strong>${inviterName}</strong> has invited you to collaborate on
          <strong>${project.title}</strong> in StudentCollabHub.</p>
          <a href="${inviteLink}"
            style="display:inline-block;margin:16px 0;padding:10px 24px;
                   background:#22d3ee;color:#0f172a;border-radius:8px;
                   font-weight:600;text-decoration:none;">
            Accept Invitation
          </a>
          <p style="color:#64748b;font-size:12px;">
            Or copy this link: ${inviteLink}
          </p>
          <p style="color:#64748b;font-size:12px;">
            This invitation is single-use and will expire once accepted.
          </p>
        </div>
      `,
      text: `${inviterName} invited you to join "${project.title}" on StudentCollabHub. Accept here: ${inviteLink}`,
    });

    return res.json({ message: "Invitation sent successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ACCEPT INVITATION BY TOKEN
exports.acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ message: "Token is required" });

    const invitation = await Invitation.findOne({ where: { token } });
    if (!invitation) {
      return res
        .status(404)
        .json({ message: "Invitation not found or already used" });
    }

    const project = await Project.findByPk(invitation.project_id);
    if (!project) {
      await invitation.destroy();
      return res.status(404).json({ message: "Project no longer exists" });
    }

    // Check if the logged-in user's email matches the invitation
    const currentUser = await User.findByPk(req.user.id, {
      attributes: ["id", "email", "name"],
    });
    if (!currentUser) return res.status(401).json({ message: "Unauthorized" });

    if (currentUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return res.status(403).json({
        message: `This invitation was sent to ${invitation.email}. Log in with that account to accept.`,
      });
    }

    // Already a member?
    const existing = await ProjectMember.findOne({
      where: { project_id: invitation.project_id, user_id: req.user.id },
    });
    if (!existing) {
      await ProjectMember.create({
        project_id: invitation.project_id,
        user_id: req.user.id,
        can_manage_tasks: false,
        can_manage_files: false,
        can_chat: true,
        can_change_project_name: false,
        can_add_members: false,
        member_role: "member",
      });

      await Activity.create({
        action: `Joined project: ${project.title}`,
        user_id: req.user.id,
      });
    }

    // Consume the invitation token
    await invitation.destroy();

    return res.json({
      message: "Invitation accepted successfully",
      project_id: invitation.project_id,
      project_title: project.title,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// GET RECENT TEAM ACTIVITY (across all projects current user is a member of)
exports.getRecentActivity = async (req, res) => {
  try {
    const myMemberships = await ProjectMember.findAll({
      where: { user_id: req.user.id },
      attributes: ["project_id"],
      raw: true,
    });

    if (myMemberships.length === 0) return res.json([]);

    const projectIds = myMemberships.map((m) => m.project_id);

    // Get all teammates' user IDs
    const allMemberships = await ProjectMember.findAll({
      where: { project_id: projectIds },
      attributes: ["user_id"],
      raw: true,
    });
    const userIds = [...new Set(allMemberships.map((m) => m.user_id))];

    const activities = await Activity.findAll({
      where: { user_id: userIds },
      order: [["created_at", "DESC"]],
      limit: 30,
      raw: true,
    });

    if (activities.length === 0) return res.json([]);

    const actorIds = [...new Set(activities.map((a) => a.user_id))];
    const actors = await User.findAll({
      where: { id: actorIds },
      attributes: ["id", "name"],
      raw: true,
    });
    const nameById = new Map(actors.map((u) => [u.id, u.name]));

    const enriched = activities.map((a) => ({
      ...a,
      user_name: nameById.get(a.user_id) || "Unknown",
    }));

    return res.json(enriched);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
