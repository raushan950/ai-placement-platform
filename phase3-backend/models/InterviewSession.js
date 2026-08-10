const mongoose = require('mongoose');

const InterviewSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true },
  type: { type: String, enum: ['DSA', 'Technical', 'HR'], required: true },
  difficulty: { type: String, required: true },
  elapsedTime: { type: Number, required: true }, // in seconds
  score: { type: Number },
  conversation: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  questions: [{
    question: { type: String, required: true },
    answer: { type: String, required: true },
    language: { type: String }, // for DSA
    evaluation: {
      scores: {
        understanding: Number,
        approach: Number,
        clarity: Number,
        overall: Number
      },
      feedback: [String],
      ideal_answer: {
        approach_summary: String,
        key_idea: String,
        time_complexity: String
      },
      code_solution: String,
      key_takeaways: [String],
      improvement_suggestion: String
    }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema);
