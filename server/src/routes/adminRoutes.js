const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const adminController = require("../controllers/admin/adminController");

router.get("/users", authMiddleware, adminMiddleware, adminController.getAllUsers);
router.delete("/users/:id", authMiddleware, adminMiddleware, adminController.deleteUser);
router.put("/users/promote/:id", authMiddleware, adminMiddleware, adminController.promoteUser);
router.put("/users/demote/:id", authMiddleware, adminMiddleware, adminController.demoteUser);

router.get("/projects", authMiddleware, adminMiddleware, adminController.getAllProjects);
router.delete("/projects/:id", authMiddleware, adminMiddleware, adminController.deleteProject);
router.get("/analytics", authMiddleware, adminMiddleware, adminController.getAnalytics);

module.exports = router;
