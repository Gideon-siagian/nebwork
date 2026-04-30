const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["worklog_invite"],
      default: "worklog_invite",
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      default: "",
    },
    worklog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkLog",
      required: true,
      index: true,
    },
    invite: {
      role: {
        type: String,
        enum: ["editor", "commenter", "viewer"],
        default: "editor",
      },
      channel: {
        type: String,
        enum: ["email", "username"],
        default: "email",
      },
      identifier: {
        type: String,
        default: "",
      },
      status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
      respondedAt: {
        type: Date,
        default: null,
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, type: 1, worklog: 1, "invite.status": 1 });

module.exports = mongoose.model("Notification", notificationSchema);
