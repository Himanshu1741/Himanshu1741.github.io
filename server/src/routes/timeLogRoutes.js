const express = require("express");
const router = express.Router();
const timeLogController = require("../controllers/task/timeLogController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/task/:task_id", authMiddleware, timeLogController.getTimeLogsByTask);
router.get("/project/:project_id", authMiddleware, timeLogController.getTimeLogsByProject);
router.post("/task/:task_id", authMiddleware, timeLogController.logTime);
router.delete("/:id", authMiddleware, timeLogController.deleteTimeLog);

module.exports = router;
