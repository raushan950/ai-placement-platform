const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/auth');

exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already in use" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ id: user._id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, email: user.email, streak: user.streak, progress: user.progress, weakAreas: user.weakAreas } });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const now = new Date();
    const diff = now - user.lastActive;
    if (diff > 86400000 && diff < 172800000) user.streak += 1;
    else if (diff >= 172800000) user.streak = 1;
    user.lastActive = now;
    await user.save();

    const token = jwt.sign({ id: user._id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { _id: user._id, email: user.email, streak: user.streak, progress: user.progress, weakAreas: user.weakAreas } });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const now = new Date();
    const diff = now - user.lastActive;
    if (diff > 86400000 && diff < 172800000) user.streak += 1;
    else if (diff >= 172800000 && user.streak > 0) user.streak = 1;
    user.lastActive = now;
    await user.save();

    res.json({ user: { _id: user._id, email: user.email, streak: user.streak, progress: user.progress, weakAreas: user.weakAreas } });
  } catch (err) {
    next(err);
  }
};
