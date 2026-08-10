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

// Authenticated features
router.post('/analyze-resume', authenticateToken, featureController.analyzeResume);
router.post('/upload-resume', upload.single('resumeFile'), featureController.uploadResume);

router.post('/generate-interview-question', authenticateToken, featureController.generateInterviewQuestion);
router.post('/evaluate-interview-answer', authenticateToken, featureController.evaluateInterviewAnswer);
router.post('/execute-code', authenticateToken, featureController.executeCode);
router.post('/generate-mock', authenticateToken, featureController.generateMock);

// History and persistence routes
router.get('/resume-history', authenticateToken, featureController.getResumeHistory);
router.get('/interview-history', authenticateToken, featureController.getInterviewHistory);
router.get('/mocktest-history', authenticateToken, featureController.getMockTestHistory);
router.get('/solved-problems', authenticateToken, featureController.getSolvedProblems);

router.post('/save-interview-session', authenticateToken, featureController.saveInterviewSession);
router.post('/save-mocktest-session', authenticateToken, featureController.saveMockTestSession);

// Conversational Voice AI
router.post('/interview/chat-turn', authenticateToken, featureController.chatTurn);

// Experiences and Aptitude additions
router.get('/interview-experiences', authenticateToken, featureController.getExperiences);
router.post('/interview-experiences', authenticateToken, featureController.saveExperience);

// Dynamic AI and Live API routes
router.post('/generate-aptitude-questions', authenticateToken, featureController.generateAptitudeQuestions);
router.post('/generate-project-blueprint', authenticateToken, featureController.generateProjectBlueprint);
router.post('/generate-interview-experience', authenticateToken, featureController.generateInterviewExperience);
router.post('/explain-cs-topic', authenticateToken, featureController.explainCsTopic);
router.get('/external-contests', authenticateToken, featureController.getExternalContests);

module.exports = router;
