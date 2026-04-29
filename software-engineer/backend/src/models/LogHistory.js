const mongoose = require("mongoose");

const logHistorySchema = new mongoose.Schema({
  message: { type: String, required: true },
  datetime: { type: Date, default: Date.now },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // Snapshot of the content at this version
  snapshot: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Track what fields were changed
  changedFields: [{
    fieldName: { type: String },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed }
  }]
});

module.exports = mongoose.model("LogHistory", logHistorySchema);
