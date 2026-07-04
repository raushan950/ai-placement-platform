const mongoose = require('mongoose');

// 1. Define the blueprint for a Roadmap
const roadmapSchema = new mongoose.Schema({
  // Link this roadmap to a specific user using their ID
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  company: { 
    type: String, 
    required: true 
  },
  // The 'data' array will hold the AI-generated daily tasks
  data: { 
    type: Array, 
    default: [] 
  }
}, { timestamps: true });

// 2. Create and export the Model
module.exports = mongoose.model('Roadmap', roadmapSchema);
