const Notification = require("../models/Notification");
const WorkLog = require("../models/WorkLog");

const normalizeRole = (role) => {
  const normalized = String(role || "").toLowerCase();
  return ["editor", "commenter", "viewer"].includes(normalized) ? normalized : "editor";
};

const serializeNotification = (notification) => ({
  id: String(notification._id),
  type: notification.type,
  title: notification.title || "",
  message: notification.message || "",
  isRead: Boolean(notification.isRead),
  createdAt: notification.createdAt,
  updatedAt: notification.updatedAt,
  actor: notification.actor
    ? {
        id: String(notification.actor._id || notification.actor.id || ""),
        name: notification.actor.name || "Unknown user",
        email: notification.actor.email || "",
        division: notification.actor.division || "",
      }
    : null,
  worklog: notification.worklog
    ? {
        id: String(notification.worklog._id || notification.worklog.id || ""),
        title: notification.worklog.title || "Untitled worklog",
      }
    : null,
  invite: {
    role: normalizeRole(notification.invite?.role),
    channel: notification.invite?.channel || "email",
    identifier: notification.invite?.identifier || "",
    status: notification.invite?.status || "pending",
    respondedAt: notification.invite?.respondedAt || null,
  },
});

const loadNotification = async (id, userId) =>
  Notification.findOne({ _id: id, recipient: userId })
    .populate("actor", "name email division")
    .populate("worklog", "title collaborators collaboratorMeta user");

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("actor", "name email division")
      .populate("worklog", "title")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
      "invite.status": "pending",
    });

    res.json({
      unreadCount,
      notifications: notifications.map(serializeNotification),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.acceptNotificationInvite = async (req, res) => {
  try {
    const notification = await loadNotification(req.params.id, req.user._id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.type !== "worklog_invite") {
      return res.status(400).json({ message: "This notification cannot be accepted" });
    }

    if (notification.invite?.status !== "pending") {
      return res.status(400).json({ message: "This invite has already been handled" });
    }

    if (!notification.worklog) {
      return res.status(404).json({ message: "Worklog for this invite was not found" });
    }

    const worklog = await WorkLog.findById(notification.worklog._id);
    if (!worklog) {
      return res.status(404).json({ message: "Worklog for this invite was not found" });
    }

    const recipientId = String(req.user._id);
    if (!worklog.collaborators.some((entry) => String(entry) === recipientId)) {
      worklog.collaborators.push(req.user._id);
    }

    const role = normalizeRole(notification.invite?.role);
    const existingMeta = (worklog.collaboratorMeta || []).find(
      (entry) => String(entry.user) === recipientId
    );

    if (existingMeta) {
      existingMeta.role = role;
    } else {
      worklog.collaboratorMeta.push({
        user: req.user._id,
        role,
      });
    }

    await worklog.save();

    notification.invite.status = "accepted";
    notification.invite.respondedAt = new Date();
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("actor", "name email division")
      .populate("worklog", "title")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
      "invite.status": "pending",
    });

    res.json({
      message: "Invite accepted",
      worklogId: String(worklog._id),
      unreadCount,
      notifications: notifications.map(serializeNotification),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.rejectNotificationInvite = async (req, res) => {
  try {
    const notification = await loadNotification(req.params.id, req.user._id);

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.type !== "worklog_invite") {
      return res.status(400).json({ message: "This notification cannot be rejected" });
    }

    if (notification.invite?.status !== "pending") {
      return res.status(400).json({ message: "This invite has already been handled" });
    }

    notification.invite.status = "rejected";
    notification.invite.respondedAt = new Date();
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    const notifications = await Notification.find({ recipient: req.user._id })
      .populate("actor", "name email division")
      .populate("worklog", "title")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
      "invite.status": "pending",
    });

    res.json({
      message: "Invite rejected",
      unreadCount,
      notifications: notifications.map(serializeNotification),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
