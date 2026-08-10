const mongoose = require('mongoose');

const MockTestSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  questions: [{
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, required: true },
    userCode: { type: String },
    language: { type: String },
    evaluation: {
      status: { type: String },
      feedback: { type: String },
      score: { type: Number }
    }
  }],
  score: { type: Number, required: true },
  elapsedTime: { type: Number, required: true }, // in seconds
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MockTestSession', MockTestSessionSchema);
