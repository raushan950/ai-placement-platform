const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  progress: { type: Map, of: Boolean, default: {} },
  streak: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  weakAreas: { type: [String], default: [] }
});

module.exports = mongoose.model('User', UserSchema);
