import express from 'express';
import jwt from 'jsonwebtoken';
import { getNotifications, markNotificationRead } from '../controllers/notificationController.js';

const router = express.Router();

const protectAny = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'Acces refuse. Token manquant.' });
    }

    try {
        req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token invalide ou expire.' });
    }
};

router.get('/', protectAny, getNotifications);
router.put('/:id/read', protectAny, markNotificationRead);

export default router;
