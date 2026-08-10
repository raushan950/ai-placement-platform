const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.me);
router.post('/google-login', authController.googleLogin);
router.post('/send-otp', authController.sendOtp);
router.post('/verify-otp-login', authController.verifyOtpLogin);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
