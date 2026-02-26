const express = require("express");
const router = express.Router();
const fileController = require("../controllers/file/fileController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../config/multer");

router.post("/", authMiddleware, upload.single("file"), fileController.uploadFile);
router.get("/trash/project/:project_id", authMiddleware, fileController.getDeletedFilesByProject);
router.post("/trash/:id/restore", authMiddleware, fileController.restoreFile);
router.delete("/trash/:id/permanent", authMiddleware, fileController.deleteFilePermanently);
router.get("/:project_id", authMiddleware, fileController.getFilesByProject);
router.get("/:id/download", authMiddleware, fileController.downloadFile);
router.delete("/:id", authMiddleware, fileController.deleteFile);

module.exports = router;
