// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');


router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.get('/me', protect, authController.getMe);

module.exports = router;