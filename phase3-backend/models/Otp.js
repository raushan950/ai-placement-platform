const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    index: true 
  },
  code: { 
    type: String, 
    required: true 
  },
  reason: { 
    type: String, 
    required: true 
  },
  expiresAt: { 
    type: Date, 
    required: true, 
    index: { expires: 0 } // TTL Index: automatically deletes document when current time exceeds expiresAt
  }
}, { timestamps: true });

module.exports = mongoose.model('Otp', OtpSchema);
