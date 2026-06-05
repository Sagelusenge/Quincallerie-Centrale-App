import express from 'express';
import { getMailStatus, getMailMessages, sendCustomMail, sendTeamNotification } from '../controllers/mailController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const authorizeMailSender = (req, res, next) => {
    if (req.user.role === 'manager') return next();
    return res.status(403).json({
        success: false,
        message: 'Seul le manager peut envoyer des emails.'
    });
};

router.get('/status', protect, getMailStatus);
router.get('/messages', protect, authorizeMailSender, getMailMessages);
router.post('/send', protect, authorizeMailSender, sendCustomMail);
router.post('/notify-team', protect, authorizeMailSender, sendTeamNotification);

export default router;
