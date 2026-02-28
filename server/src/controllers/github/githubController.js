/**
 * githubController.js
 * Handles GitHub-related API endpoints for projects.
 */

const githubService = require("../../services/githubService");
const Project = require("../../models/Project");
const ProjectMember = require("../../models/ProjectMember");

/**
 * GET /api/projects/:id/github
 * Return aggregated GitHub data (commits, issues, branches, PRs) for a project's linked repo.
 * Any project member has access.
 */
exports.getGithubData = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify membership
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

    if (!project.github_repo) {
      return res
        .status(404)
        .json({ message: "No GitHub repository linked to this project" });
    }

    const summary = await githubService.getRepoSummary(project.github_repo);
    return res.json(summary);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message });
  }
};

/**
 * PUT /api/projects/:id/github
 * Link or update the GitHub repository URL for a project.
 * Only the project creator or a member with can_change_project_name permission can do this.
 */
exports.updateGithubRepo = async (req, res) => {
  try {
    const { id } = req.params;
    const { github_repo } = req.body;

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const membership = await ProjectMember.findOne({
      where: { project_id: id, user_id: req.user.id },
    });

    const canEdit =
      project.created_by === req.user.id ||
      (membership && membership.can_change_project_name);

    if (!canEdit) {
      return res
        .status(403)
        .json({ message: "Permission denied: cannot edit project settings" });
    }

    // Allow clearing the repo link
    if (!github_repo || github_repo.trim() === "") {
      project.github_repo = null;
      await project.save();
      return res.json({ message: "GitHub repo link removed", project });
    }

    // Validate the repo is reachable before persisting
    const slug = await githubService.validateRepo(github_repo.trim());

    project.github_repo = `https://github.com/${slug.owner}/${slug.repo}`;
    await project.save();

    return res.json({
      message: "GitHub repository linked successfully",
      project,
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message });
  }
};

/**
 * GET /api/projects/:id/github/commits
 * Return paginated commits from the project's linked repo.
 */
exports.getCommits = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, per_page = 20, branch } = req.query;

    const membership = await ProjectMember.findOne({
      where: { project_id: id, user_id: req.user.id },
    });
    if (!membership) {
      return res.status(403).json({ message: "Not a project member" });
    }

    const project = await Project.findByPk(id);
    if (!project || !project.github_repo) {
      return res
        .status(404)
        .json({ message: "No GitHub repository linked to this project" });
    }

    const slug = githubService.parseRepoSlug(project.github_repo);
    if (!slug) {
      return res
        .status(400)
        .json({ message: "Invalid GitHub repo URL stored" });
    }

    const commits = await githubService.getCommits(slug.owner, slug.repo, {
      perPage: Math.min(Number(per_page) || 20, 100),
      page: Number(page) || 1,
      branch: branch || undefined,
    });

    return res.json(commits);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message });
  }
};

/**
 * GET /api/projects/:id/github/issues
 * Return open issues from the project's linked repo.
 */
exports.getIssues = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, per_page = 20, state = "open" } = req.query;

    const membership = await ProjectMember.findOne({
      where: { project_id: id, user_id: req.user.id },
    });
    if (!membership) {
      return res.status(403).json({ message: "Not a project member" });
    }

    const project = await Project.findByPk(id);
    if (!project || !project.github_repo) {
      return res
        .status(404)
        .json({ message: "No GitHub repository linked to this project" });
    }

    const slug = githubService.parseRepoSlug(project.github_repo);
    if (!slug) {
      return res
        .status(400)
        .json({ message: "Invalid GitHub repo URL stored" });
    }

    const issues = await githubService.getIssues(slug.owner, slug.repo, {
      perPage: Math.min(Number(per_page) || 20, 100),
      page: Number(page) || 1,
      state: ["open", "closed", "all"].includes(state) ? state : "open",
    });

    return res.json(issues);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message });
  }
};

/**
 * GET /api/projects/:id/github/branches
 * Return branches from the project's linked repo.
 */
exports.getBranches = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, per_page = 30 } = req.query;

    const membership = await ProjectMember.findOne({
      where: { project_id: id, user_id: req.user.id },
    });
    if (!membership) {
      return res.status(403).json({ message: "Not a project member" });
    }

    const project = await Project.findByPk(id);
    if (!project || !project.github_repo) {
      return res
        .status(404)
        .json({ message: "No GitHub repository linked to this project" });
    }

    const slug = githubService.parseRepoSlug(project.github_repo);
    if (!slug) {
      return res
        .status(400)
        .json({ message: "Invalid GitHub repo URL stored" });
    }

    const branches = await githubService.getBranches(slug.owner, slug.repo, {
      perPage: Math.min(Number(per_page) || 30, 100),
      page: Number(page) || 1,
    });

    return res.json(branches);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message });
  }
};

/**
 * GET /api/projects/:id/github/pulls
 * Return pull requests from the project's linked repo.
 */
exports.getPullRequests = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, per_page = 20, state = "open" } = req.query;

    const membership = await ProjectMember.findOne({
      where: { project_id: id, user_id: req.user.id },
    });
    if (!membership) {
      return res.status(403).json({ message: "Not a project member" });
    }

    const project = await Project.findByPk(id);
    if (!project || !project.github_repo) {
      return res
        .status(404)
        .json({ message: "No GitHub repository linked to this project" });
    }

    const slug = githubService.parseRepoSlug(project.github_repo);
    if (!slug) {
      return res
        .status(400)
        .json({ message: "Invalid GitHub repo URL stored" });
    }

    const prs = await githubService.getPullRequests(slug.owner, slug.repo, {
      perPage: Math.min(Number(per_page) || 20, 100),
      page: Number(page) || 1,
      state: ["open", "closed", "all"].includes(state) ? state : "open",
    });

    return res.json(prs);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ error: error.message });
  }
};
