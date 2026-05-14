import express from 'express';
import { login, getMe, forgotPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);         // POST /api/auth/login
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getMe);    // GET  /api/auth/me

export default router;
