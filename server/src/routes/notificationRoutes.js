const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const notificationController = require("../controllers/notification/notificationController");
const preferenceController = require("../controllers/notification/preferenceController");

// Notification routes
router.get("/", authMiddleware, notificationController.getNotifications);
router.put("/:id", authMiddleware, notificationController.markAsRead);
router.put("/", authMiddleware, notificationController.markAllAsRead); // Mark all as read
router.get("/stats", authMiddleware, notificationController.getStats);
router.get("/mentions", authMiddleware, notificationController.getMentions);
router.get("/digest", authMiddleware, notificationController.getDigest);

// Preference routes
router.get(
  "/preferences/list",
  authMiddleware,
  preferenceController.getPreferences,
);
router.put(
  "/preferences/:id",
  authMiddleware,
  preferenceController.updatePreference,
);

// DND (Do Not Disturb) routes
router.get(
  "/dnd/schedule",
  authMiddleware,
  preferenceController.getDNDSchedule,
);
router.post(
  "/dnd/schedule",
  authMiddleware,
  preferenceController.setDNDSchedule,
);
router.patch("/dnd/toggle", authMiddleware, preferenceController.toggleDND);

module.exports = router;
