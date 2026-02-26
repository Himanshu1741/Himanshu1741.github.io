const User = require("../../models/User");
const Project = require("../../models/Project");

// GET ALL USERS
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "name", "email", "role"]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
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

    await User.update(
      { role: "admin" },
      { where: { id } }
    );

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

    await User.update(
      { role: "member" },
      { where: { id } }
    );

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
    const totalCompletedProjects = await Project.count({ where: { status: "completed" } });
    const totalActiveProjects = totalProjects - totalCompletedProjects;

    res.json({
      totalUsers,
      totalProjects,
      totalActiveProjects
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
