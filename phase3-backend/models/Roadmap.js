const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetCompany: { type: String, required: true },
  targetDays: { type: Number, required: true },
  level: { type: String, required: true },
  plan: [
    {
      day: Number,
      week: Number,
      topic: String,
      task: String,
      practice: Number,
      questions: Array
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Roadmap', RoadmapSchema);
