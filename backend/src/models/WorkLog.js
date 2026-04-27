const mongoose = require("mongoose");

const workLogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  privacyLevel: { type: String, enum: ["public", "team", "private"], default: "team" },
  project: { type: String, default: "" },
  department: { type: String, default: "" },
  summary: { type: String, default: "" },
  tag: [{ type: String }],
  // Supports both legacy string URLs and object format { url, type, name, size }
  // url can be a base64 data URI (for local dev) or a public URL (for production)
  media: [{ type: mongoose.Schema.Types.Mixed }],
  collaborators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  collaboratorMeta: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: { type: String, enum: ["editor", "commenter", "viewer"], default: "editor" },
    addedAt: { type: Date, default: Date.now },
  }],
  meeting: {
    roomName: { type: String, default: "" },
    url: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedAt: { type: Date },
  },
  datetime: { type: Date, default: Date.now },
  publishedAt: { type: Date, default: null },
  viewCount: { type: Number, default: 0 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  log_history: [{ type: mongoose.Schema.Types.ObjectId, ref: "LogHistory" }],
  embedding: {
    type: [Number],
    select: false // Don't return by default
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

workLogSchema.index({ title: 'text', content: 'text' });
workLogSchema.index({ user: 1, updatedAt: -1 });   // main feed query
workLogSchema.index({ datetime: -1 });              // date range filter
workLogSchema.index({ tag: 1 });                    // tag filter
workLogSchema.index({ status: 1, updatedAt: -1 });

module.exports = mongoose.model("WorkLog", workLogSchema);
