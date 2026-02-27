const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const adminController = require("../controllers/admin/adminController");

const AM = [authMiddleware, adminMiddleware];

router.get("/users", ...AM, adminController.getAllUsers);
router.delete("/users/:id", ...AM, adminController.deleteUser);
router.put("/users/promote/:id", ...AM, adminController.promoteUser);
router.put("/users/demote/:id", ...AM, adminController.demoteUser);
router.put("/users/suspend/:id", ...AM, adminController.suspendUser);
router.put("/users/unsuspend/:id", ...AM, adminController.unsuspendUser);
router.post(
  "/users/:id/force-reset",
  ...AM,
  adminController.forcePasswordReset,
);
router.post("/users/bulk-action", ...AM, adminController.bulkAction);

router.get("/projects", ...AM, adminController.getAllProjects);
router.delete("/projects/:id", ...AM, adminController.deleteProject);

router.get("/analytics", ...AM, adminController.getAnalytics);
router.get("/audit-log", ...AM, adminController.getAuditLog);
router.post("/announcement", ...AM, adminController.sendAnnouncement);

module.exports = router;
