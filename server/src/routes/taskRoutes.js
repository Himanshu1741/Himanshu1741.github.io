const express = require("express");
const router = express.Router();
const taskController = require("../controllers/task/taskController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, taskController.createTask);
router.get("/trash/:project_id", authMiddleware, taskController.getDeletedTasksByProject);
router.post("/:id/restore", authMiddleware, taskController.restoreTask);
router.delete("/trash/:trash_id/permanent", authMiddleware, taskController.deleteTaskPermanently);
router.get("/:project_id", authMiddleware, taskController.getTasksByProject);
router.put("/:id", authMiddleware, taskController.updateTaskStatus);
router.delete("/:id", authMiddleware, taskController.deleteTask);

module.exports = router;
