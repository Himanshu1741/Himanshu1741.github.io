const express = require("express");
const router = express.Router();
const taskCommentController = require("../controllers/task/taskCommentController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/:task_id", authMiddleware, taskCommentController.getComments);
router.post("/:task_id", authMiddleware, taskCommentController.addComment);
router.delete("/:id", authMiddleware, taskCommentController.deleteComment);

module.exports = router;
