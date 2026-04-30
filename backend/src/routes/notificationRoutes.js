const express = require("express");

const router = express.Router();
const {
  getNotifications,
  acceptNotificationInvite,
  rejectNotificationInvite,
} = require("../controllers/notificationController");
const { protect } = require("../middlewares/authMiddleware");

router.get("/", protect, getNotifications);
router.post("/:id/accept", protect, acceptNotificationInvite);
router.post("/:id/reject", protect, rejectNotificationInvite);

module.exports = router;
