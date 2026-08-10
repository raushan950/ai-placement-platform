const mongoose = require('mongoose');

const CodeSubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: String, required: true }, // unique URL/title slug
  title: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  status: { type: String, required: true }, // 'Accepted', 'Wrong Answer', 'Compile Error'
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CodeSubmission', CodeSubmissionSchema);
