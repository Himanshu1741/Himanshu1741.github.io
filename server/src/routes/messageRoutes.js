const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message/messageController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/:project_id", authMiddleware, messageController.getMessagesByProject);

module.exports = router;
