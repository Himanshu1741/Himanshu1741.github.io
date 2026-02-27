const express = require("express");
const router = express.Router();
const projectController = require("../controllers/project/projectController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, projectController.createProject);
router.get("/", authMiddleware, projectController.getProjects);
router.get("/summary", authMiddleware, projectController.getDashboardSummary);
router.get("/trash", authMiddleware, projectController.getDeletedProjects);
router.post(
  "/trash/:id/restore",
  authMiddleware,
  projectController.restoreDeletedProject,
);
router.delete(
  "/trash/:id/permanent",
  authMiddleware,
  projectController.deleteTrashedProjectPermanently,
);
router.get("/:id/detail", authMiddleware, projectController.getProject);
// router.get("/:id/dependency-graph", authMiddleware, projectController.getDependencyGraph);
router.get("/:id/copilot", authMiddleware, projectController.getProjectCopilot);
router.get(
  "/:id/permissions",
  authMiddleware,
  projectController.getMyProjectPermissions,
);
router.get("/:id/members", authMiddleware, projectController.getProjectMembers);
router.get("/:id/member-list", authMiddleware, projectController.getMemberList);
router.post("/add-member", authMiddleware, projectController.addMember);
router.delete(
  "/:id/members/:user_id",
  authMiddleware,
  projectController.removeMember,
);
router.put(
  "/:id/members/:user_id/permissions",
  authMiddleware,
  projectController.updateMemberPermissions,
);
router.put("/:id", authMiddleware, projectController.updateProject);
router.put(
  "/:id/status",
  authMiddleware,
  projectController.updateProjectStatus,
);
router.post("/invite", authMiddleware, projectController.sendInvitation);
router.delete("/:id", authMiddleware, projectController.deleteProject);

module.exports = router;
