const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const User = require('../models/User');
const Roadmap = require('../models/Roadmap');

// In Phase 3 we will integrate AI. For now, we mock the generated roadmap data.
router.post('/generate-roadmap', auth, async (req, res, next) => {
  try {
    const { company } = req.body;
    
    // Mocked AI generation
    const fakeData = [
      { day: 1, topic: "Arrays & Strings", task: "Solve 2 LeetCode easy problems." },
      { day: 2, topic: "Hash Maps", task: "Revise theory and solve Two Sum." }
    ];

    // Save or update roadmap
    let roadmap = await Roadmap.findOne({ userId: req.user.userId });
    if (roadmap) {
       roadmap.company = company;
       roadmap.data = fakeData;
    } else {
       roadmap = new Roadmap({ userId: req.user.userId, company, data: fakeData });
    }
    await roadmap.save();

    res.json({ message: "Roadmap generated and saved!", roadmap });
  } catch (error) {
    next(error); // Pass to global error handler
  }
});

router.get('/my-roadmap', auth, async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({ userId: req.user.userId });
    if (!roadmap) return res.status(404).json({ error: "No roadmap found." });
    res.json(roadmap);
  } catch (error) {
    next(error);
  }
});

router.post('/save-progress', auth, async (req, res, next) => {
  try {
    const { taskName, isCompleted } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    user.completedTasks.set(taskName, isCompleted);
    await user.save();

    res.json({ message: "Progress saved!", completedTasks: user.completedTasks });
  } catch (error) {
    next(error);
  }
});

router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ user: { email: user.email, streak: user.streak, _id: user._id } });
  } catch(error) {
    next(error);
  }
});

module.exports = router;
