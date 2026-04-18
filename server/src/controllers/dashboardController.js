/**
 * Dashboard Controller
 *
 * Copyright © 2026 Himanshu Kumar. All rights reserved.
 * Developed by Himanshu Kumar
 */

const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const Task = require("../models/Task");
const User = require("../models/User");
const Activity = require("../models/Activity");
const Notification = require("../models/Notification");
const { Op } = require("sequelize");
const sequelize = require("../config/db");

// GET DASHBOARD DATA
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's project memberships
    const memberships = await ProjectMember.findAll({
      where: { user_id: userId },
      attributes: ["project_id"],
    });

    const projectIds = memberships.map((m) => m.project_id);

    if (projectIds.length === 0) {
      return res.json({
        totalProjects: 0,
        activeTasks: 0,
        upcomingDeadlines: 0,
        taskCompletion: { completed: 0, total: 0 },
        recentProjects: [],
        recentActivity: [],
        deadlines: [],
        activityTrend: [],
      });
    }

    // Fetch all data in parallel
    const [
      projects,
      tasks,
      completedTasks,
      activeTasks,
      upcomingDeadlines,
      recentActivity,
      activityTrend,
    ] = await Promise.all([
      // Recent projects
      Project.findAll({
        where: { id: { [Op.in]: projectIds } },
        attributes: [
          "id",
          "title",
          "description",
          "status",
          "created_at",
          "updated_at",
        ],
        order: [["updated_at", "DESC"]],
        limit: 6,
        include: [
          {
            model: ProjectMember,
            as: "members",
            attributes: ["user_id"],
            where: { project_id: { [Op.in]: projectIds } },
            raw: true,
            duplicating: false,
          },
          {
            model: Task,
            as: "tasks",
            attributes: ["id"],
            raw: true,
            duplicating: false,
          },
        ],
      }),

      // Total tasks
      Task.count({
        where: { project_id: { [Op.in]: projectIds } },
      }),

      // Completed tasks
      Task.count({
        where: {
          project_id: { [Op.in]: projectIds },
          status: "completed",
        },
      }),

      // Active tasks
      Task.count({
        where: {
          project_id: { [Op.in]: projectIds },
          status: { [Op.ne]: "completed" },
        },
      }),

      // Upcoming deadlines
      Task.findAll({
        where: {
          project_id: { [Op.in]: projectIds },
          due_date: {
            [Op.between]: [
              new Date(),
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            ],
          },
        },
        attributes: ["id", "title", "due_date", "project_id", "status"],
        order: [["due_date", "ASC"]],
        limit: 10,
        include: [
          {
            model: Project,
            as: "project",
            attributes: ["title"],
          },
        ],
      }),

      // Recent activity
      Activity.findAll({
        where: { user_id: userId },
        attributes: ["id", "action", "user_id", "created_at"],
        order: [["created_at", "DESC"]],
        limit: 20,
      }),

      // Activity trend (last 7 days)
      sequelize.query(
        `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM activities
        WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
        {
          replacements: [userId],
          type: sequelize.QueryTypes.SELECT,
        },
      ),
    ]);

    // Process recent projects with member and task counts
    const processedProjects = projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      created_at: p.created_at,
      updated_at: p.updated_at,
      member_count: new Set(p.members ? p.members.map((m) => m.user_id) : [])
        .size,
      task_count: p.tasks ? p.tasks.length : 0,
    }));

    // Process recent activity
    const processedActivity = recentActivity.map((a) => {
      const actionStr = a.action || "";
      const target = actionStr.includes(":")
        ? actionStr.split(":")[1]?.trim()
        : null;
      const action = actionStr.includes("Created")
        ? "CREATED_PROJECT"
        : actionStr.includes("Updated")
          ? "UPDATED_PROJECT"
          : actionStr.includes("Completed")
            ? "COMPLETED_TASK"
            : actionStr.includes("Added")
              ? "ADDED_COMMENT"
              : "OTHER_ACTION";

      return {
        id: a.id,
        action,
        target,
        created_at: a.created_at,
      };
    });

    // Process deadlines
    const processedDeadlines = upcomingDeadlines.map((d) => ({
      id: d.id,
      title: d.title,
      deadline: d.due_date,
      project: d.project?.title || "Unknown",
      status: d.status,
    }));

    // Calculate upcoming deadline count
    const upcomingCount = upcomingDeadlines.filter(
      (d) => new Date(d.due_date) > new Date(),
    ).length;

    return res.json({
      totalProjects: projectIds.length,
      activeTasks,
      upcomingDeadlines: upcomingCount,
      taskCompletion: {
        completed: completedTasks,
        total: tasks,
      },
      recentProjects: processedProjects,
      recentActivity: processedActivity.slice(0, 10),
      deadlines: processedDeadlines.slice(0, 5),
      activityTrend: activityTrend.map((a) => ({
        date: a.date,
        count: a.count,
      })),
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ error: error.message });
  }
};
