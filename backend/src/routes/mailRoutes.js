import express from 'express';
import jwt from 'jsonwebtoken';
import { getMailStatus, getMailMessages, sendCustomMail } from '../controllers/mailController.js';

const router = express.Router();

const protectAny = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Acces refuse. Token manquant.' });
    }

    try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token invalide ou expire.' });
    }
};

const authorizeMailSender = (req, res, next) => {
    if (req.user.type === 'super_admin' || req.user.role === 'manager') return next();
    return res.status(403).json({
        success: false,
        message: 'Seul le manager de l entreprise ou le super administrateur peut envoyer des emails.'
    });
};

router.get('/status', protectAny, getMailStatus);
router.get('/messages', protectAny, authorizeMailSender, getMailMessages);
router.post('/send', protectAny, authorizeMailSender, sendCustomMail);

export default router;
