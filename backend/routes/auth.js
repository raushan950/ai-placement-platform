const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const User = require('../models/User'); // Bring in the User Model we made!

// SIGN UP ROUTE (POST /api/auth/signup)
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body; // Grab the email/password sent from Frontend

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already in use" });

    // 2. Scramble the password
    const hashedPassword = await bcrypt.hash(password, 10); 
    
    // 3. Create the user and save to MongoDB
    const newUser = new User({ email, password: hashedPassword });
    await newUser.save(); 

    // Give them a ticket so they don't have to log in again immediately
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ message: "User successfully created and logged in!", token, user: { email: newUser.email, streak: newUser.streak || 0 } });
  } catch (error) {
    res.status(500).json({ error: "Server error during signup" });
  }
});

// LOG IN ROUTE (POST /api/auth/login)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "User not found!" });

    // 2. Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Wrong password!" });

    // 3. Give them a JWT "VIP Ticket" that lasts 7 days
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // 4. Send back the token and some basic user info 
    res.json({ message: "Login successful!", token, user: { email: user.email, streak: user.streak } });
  } catch (error) {
    res.status(500).json({ error: "Server error during login" });
  }
});

module.exports = router;
