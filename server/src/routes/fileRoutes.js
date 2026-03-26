const express = require("express");
const router = express.Router();
const fileController = require("../controllers/file/fileController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../config/multer");

// Multer error handler middleware
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error("❌ Multer error:", err.message);
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  next();
};

// Request logging middleware
const logUploadRequest = (req, res, next) => {
  console.log("\n📨 Incoming file upload request");
  console.log("Headers:", {
    contentType: req.headers["content-type"],
    contentLength: req.headers["content-length"],
  });
  next();
};

router.post(
  "/",
  authMiddleware,
  logUploadRequest,
  upload.array("files", 100),
  handleMulterError,
  fileController.uploadFiles,
);
router.get(
  "/trash/project/:project_id",
  authMiddleware,
  fileController.getDeletedFilesByProject,
);
router.post("/trash/:id/restore", authMiddleware, fileController.restoreFile);
router.delete(
  "/trash/:id/permanent",
  authMiddleware,
  fileController.deleteFilePermanently,
);
router.get("/:project_id", authMiddleware, fileController.getFilesByProject);
router.get("/:id/download", authMiddleware, fileController.downloadFile);
router.delete("/:id", authMiddleware, fileController.deleteFile);

module.exports = router;
