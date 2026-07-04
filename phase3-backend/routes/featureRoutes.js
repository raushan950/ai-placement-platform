const express = require('express');
const router = express.Router();
const featureController = require('../controllers/featureController');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

// Open routes (or partially authenticated)
router.post('/generate-roadmap', authenticateToken, featureController.generateRoadmap);
router.get('/my-roadmap', authenticateToken, featureController.getMyRoadmap);
router.post('/save-progress', authenticateToken, featureController.saveProgress);
router.post('/weak-areas', authenticateToken, featureController.weakAreas);

router.post('/analyze-resume', featureController.analyzeResume);
router.post('/upload-resume', upload.single('resumeFile'), featureController.uploadResume);

router.post('/generate-interview-question', featureController.generateInterviewQuestion);
router.post('/evaluate-interview-answer', featureController.evaluateInterviewAnswer);
router.post('/execute-code', featureController.executeCode);
router.post('/generate-mock', featureController.generateMock);

module.exports = router;
