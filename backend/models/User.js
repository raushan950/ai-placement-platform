const mongoose = require('mongoose');

// 1. Define the blueprint (Schema) for a User
const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true // No two users can have the same email
  },
  password: { 
    type: String, 
    required: true 
  },
  streak: { 
    type: Number, 
    default: 0 
  },
  // We can track individual tasks they complete
  completedTasks: {
    type: Map,
    of: Boolean,
    default: {}
  }
}, { timestamps: true }); // Automatically adds 'createdAt' and 'updatedAt' dates

// 2. Create and export the Model
module.exports = mongoose.model('User', userSchema);
