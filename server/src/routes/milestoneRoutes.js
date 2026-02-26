const express = require("express");
const router = express.Router();
const milestoneController = require("../controllers/project/milestoneController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/:project_id", authMiddleware, milestoneController.getMilestones);
router.post("/", authMiddleware, milestoneController.createMilestone);
router.put("/:id", authMiddleware, milestoneController.updateMilestone);
router.delete("/:id", authMiddleware, milestoneController.deleteMilestone);

module.exports = router;
