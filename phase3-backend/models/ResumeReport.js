const mongoose = require('mongoose');

const ResumeReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetCompany: { type: String },
  jobDescription: { type: String },
  scores: {
    overall: { type: Number, required: true },
    skills: { type: Number, required: true },
    projects: { type: Number, required: true },
    ats: { type: Number, required: true }
  },
  quick_evaluation: {
    overall: { type: String },
    ready_for_placements: { type: String }
  },
  strengths: [String],
  weaknesses: [String],
  missing_skills: [String],
  suggestions: [String],
  ats_optimization: {
    missing_keywords: [String],
    formatting_issues: [String],
    suggestions: [String]
  },
  jd_match: {
    score: { type: Number },
    missing_keywords: [String],
    suggestions: [String]
  },
  company_readiness: {
    score: { type: Number },
    missing_skills: [String]
  },
  bullet_rewrites: [{
    original: { type: String },
    rewritten: { type: String }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ResumeReport', ResumeReportSchema);
