/**
 * Dashboard Controller
 *
 * Copyright © 2026 Himanshu Kumar. All rights reserved.
 * Developed by Himanshu Kumar
 */

const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const Task = require("../models/Task");
const { Op } = require("sequelize");
const sequelize = require("../config/db");

// GET DASHBOARD DATA
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      console.error("❌ Dashboard: No user ID in request");
      return res.status(401).json({ error: "Unauthorized: No user ID" });
    }

    console.log(`🔍 Loading dashboard for user ${userId}...`);

    // Get user's project memberships
    const memberships = await ProjectMember.findAll({
      where: { user_id: userId },
      attributes: ["project_id"],
      raw: true,
    });

    console.log(`📊 Found ${memberships.length} projects for user`);

    const projectIds = memberships.map((m) => m.project_id);

    // If no projects, return empty dashboard
    if (projectIds.length === 0) {
      console.log("ℹ️ No projects - returning empty dashboard");
      return res.json({
        totalProjects: 0,
        activeTasks: 0,
        upcomingDeadlines: 0,
        taskCompletion: { completed: 0, total: 0 },
        recentProjects: [],
      });
    }

    // Fetch projects
    const projects = await Project.findAll({
      where: { id: { [Op.in]: projectIds } },
      attributes: ["id", "title", "description", "status", "created_at"],
      order: [["created_at", "DESC"]],
      limit: 6,
      raw: true,
    });

    // Get member counts for each project
    const projectMemberCounts = await ProjectMember.findAll({
      where: { project_id: { [Op.in]: projectIds } },
      attributes: [
        "project_id",
        [sequelize.fn("COUNT", sequelize.col("user_id")), "member_count"],
      ],
      group: ["project_id"],
      raw: true,
      subQuery: false,
    });

    const memberCountMap = {};
    projectMemberCounts.forEach((m) => {
      memberCountMap[m.project_id] = parseInt(m.member_count) || 0;
    });

    // Get task counts for each project
    const projectTaskCounts = await Task.findAll({
      where: { project_id: { [Op.in]: projectIds } },
      attributes: [
        "project_id",
        [sequelize.fn("COUNT", sequelize.col("id")), "task_count"],
      ],
      group: ["project_id"],
      raw: true,
      subQuery: false,
    });

    const taskCountMap = {};
    projectTaskCounts.forEach((t) => {
      taskCountMap[t.project_id] = parseInt(t.task_count) || 0;
    });

    // Process projects
    const processedProjects = projects.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      status: p.status,
      created_at: p.created_at,
      member_count: memberCountMap[p.id] || 0,
      task_count: taskCountMap[p.id] || 0,
    }));

    // Get task statistics
    const totalTasks = await Task.count({
      where: { project_id: { [Op.in]: projectIds } },
    });

    const completedTasks = await Task.count({
      where: {
        project_id: { [Op.in]: projectIds },
        status: "completed",
      },
    });

    const activeTasks = await Task.count({
      where: {
        project_id: { [Op.in]: projectIds },
        status: { [Op.ne]: "completed" },
      },
    });

    // Get upcoming deadlines count (simple query)
    const upcomingDeadlines = await Task.count({
      where: {
        project_id: { [Op.in]: projectIds },
        due_date: {
          [Op.gte]: new Date(),
        },
      },
    });

    return res.json({
      totalProjects: projectIds.length,
      activeTasks,
      upcomingDeadlines,
      taskCompletion: {
        completed: completedTasks,
        total: totalTasks,
      },
      recentProjects: processedProjects,
    });
  } catch (error) {
    console.error("❌ Dashboard error:", error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};
