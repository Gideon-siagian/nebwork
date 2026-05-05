const mongoose = require('mongoose');

const PasswordResetRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  resetToken: String,
  tokenExpire: Date,
}, {
  timestamps: true
});

module.exports = mongoose.model('PasswordResetRequest', PasswordResetRequestSchema);
