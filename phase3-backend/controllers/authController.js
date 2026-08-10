const User = require('../models/User');
const Otp = require('../models/Otp');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');
const { sendOtpEmail } = require('../utils/email');

// Standard Email/Password Registration
exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      email, 
      password: hashedPassword,
      name: name || email.split('@')[0],
      avatar: ''
    });
    await user.save();

    const token = jwt.sign({ id: user._id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        _id: user._id, 
        email: user.email, 
        name: user.name || user.email.split('@')[0], 
        avatar: user.avatar || '', 
        streak: user.streak, 
        progress: user.progress, 
        weakAreas: user.weakAreas 
      } 
    });
  } catch (err) {
    next(err);
  }
};

// Standard Email/Password Login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    // Users registered with Google only might not have a password set yet
    if (!user.password) {
      return res.status(400).json({ 
        error: "This account was created using Google Sign-In. Please log in using Google, or use 'Forgot Password' to set a password." 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Handle login streak
    const now = new Date();
    const diff = now - user.lastActive;
    if (diff > 86400000 && diff < 172800000) user.streak += 1;
    else if (diff >= 172800000) user.streak = 1;
    user.lastActive = now;
    await user.save();

    const token = jwt.sign({ id: user._id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        _id: user._id, 
        email: user.email, 
        name: user.name || user.email.split('@')[0], 
        avatar: user.avatar || '', 
        streak: user.streak, 
        progress: user.progress, 
        weakAreas: user.weakAreas 
      } 
    });
  } catch (err) {
    next(err);
  }
};

// Fetch current user details
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: "User not found" });
    
    // Handle streak verification
    const now = new Date();
    const diff = now - user.lastActive;
    if (diff > 86400000 && diff < 172800000) user.streak += 1;
    else if (diff >= 172800000 && user.streak > 0) user.streak = 1;
    user.lastActive = now;
    await user.save();

    res.json({ 
      user: { 
        _id: user._id, 
        email: user.email, 
        name: user.name || user.email.split('@')[0], 
        avatar: user.avatar || '', 
        streak: user.streak, 
        progress: user.progress, 
        weakAreas: user.weakAreas 
      } 
    });
  } catch (err) {
    next(err);
  }
};

// Google Single Sign-On (SSO)
exports.googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: "Google ID Token is required" });

    let email, name, avatar;

    // Check for simulated/mock Google login in development environments
    if (typeof idToken === 'string' && idToken.startsWith('mock_google_token_')) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(400).json({ error: "Mock Google login is disabled in production." });
      }
      
      const parts = idToken.split('_');
      // Token format: mock_google_token_<email>_<name>_<avatar>
      email = parts[3];
      name = parts[4] ? decodeURIComponent(parts[4]) : email.split('@')[0];
      avatar = parts[5] ? decodeURIComponent(parts[5]) : '';
    } else {
      const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
      if (!GOOGLE_CLIENT_ID) {
        return res.status(500).json({ error: "Backend Google Client ID configuration is missing." });
      }

      const { OAuth2Client } = require('google-auth-library');
      const client = new OAuth2Client(GOOGLE_CLIENT_ID);
      
      try {
        const ticket = await client.verifyIdToken({
          idToken,
          audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        avatar = payload.picture;
      } catch (err) {
        return res.status(401).json({ error: "Google signature verification failed: " + err.message });
      }
    }

    if (!email) return res.status(400).json({ error: "Failed to extract email from Google Token" });

    let user = await User.findOne({ email });
    if (!user) {
      // First-time signup with Google
      user = new User({
        email,
        name: name || email.split('@')[0],
        avatar: avatar || '',
        isGoogleUser: true
      });
      await user.save();
    } else {
      // User exists, update Google profile info if not set
      let updated = false;
      if (!user.name && name) { user.name = name; updated = true; }
      if (!user.avatar && avatar) { user.avatar = avatar; updated = true; }
      if (!user.isGoogleUser) { user.isGoogleUser = true; updated = true; }
      if (updated) await user.save();
    }

    // Handle streak
    const now = new Date();
    const diff = now - user.lastActive;
    if (diff > 86400000 && diff < 172800000) user.streak += 1;
    else if (diff >= 172800000) user.streak = 1;
    user.lastActive = now;
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        _id: user._id, 
        email: user.email, 
        name: user.name || user.email.split('@')[0], 
        avatar: user.avatar || '', 
        streak: user.streak, 
        progress: user.progress, 
        weakAreas: user.weakAreas 
      } 
    });
  } catch (err) {
    next(err);
  }
};

// Send OTP code
exports.sendOtp = async (req, res, next) => {
  try {
    const { email, reason } = req.body; // reason: 'login', 'register', 'reset'
    if (!email) return res.status(400).json({ error: "Email is required" });

    // Validate account existence for password resets
    if (reason === 'reset') {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ error: "No account exists with this email address." });
    }

    // Generate random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Expire OTP in 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Delete any previous OTPs for this email & reason
    await Otp.deleteMany({ email, reason });

    // Save new OTP
    const newOtp = new Otp({ email, code: otpCode, reason, expiresAt });
    await newOtp.save();

    // Dispatch email
    const emailResult = await sendOtpEmail(email, otpCode, reason);

    res.json({ 
      message: "Verification code sent successfully!", 
      // Return code in dev environment to allow easy bypass/testing
      code: process.env.NODE_ENV !== 'production' ? otpCode : undefined,
      method: emailResult.method
    });
  } catch (err) {
    next(err);
  }
};

// Verify OTP passwordless Login / Registration
exports.verifyOtpLogin = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Email and OTP code are required" });

    // Find and validate OTP
    const otpRecord = await Otp.findOne({ email, code, reason: 'login' });
    if (!otpRecord) return res.status(400).json({ error: "Invalid or expired verification code." });

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: "Verification code has expired." });
    }

    // Clean up verified OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    // Log in or automatically register user
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        name: email.split('@')[0]
      });
      await user.save();
    }

    // Record streak
    const now = new Date();
    const diff = now - user.lastActive;
    if (diff > 86400000 && diff < 172800000) user.streak += 1;
    else if (diff >= 172800000) user.streak = 1;
    user.lastActive = now;
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { 
        _id: user._id, 
        email: user.email, 
        name: user.name || user.email.split('@')[0], 
        avatar: user.avatar || '', 
        streak: user.streak, 
        progress: user.progress, 
        weakAreas: user.weakAreas 
      } 
    });
  } catch (err) {
    next(err);
  }
};

// Reset Password using OTP
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, OTP code, and new password are required." });
    }

    // Validate OTP
    const otpRecord = await Otp.findOne({ email, code, reason: 'reset' });
    if (!otpRecord) return res.status(400).json({ error: "Invalid or expired verification code." });

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ error: "Verification code has expired." });
    }

    // Retrieve user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found." });

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Clean up OTP
    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({ message: "Password has been reset successfully. You can now login with your new password!" });
  } catch (err) {
    next(err);
  }
};
