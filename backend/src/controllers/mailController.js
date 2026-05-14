import { isMailReady, sendMail } from '../services/mailService.js';
import pool from '../config/db.js';

export const getMailStatus = (req, res) => {
    res.json({
        success: true,
        data: {
            ready: isMailReady(),
            sender: req.user?.email || process.env.EMAIL_USER || null
        }
    });
};

export const getMailMessages = async (req, res) => {
    try {
        const params = [];
        let where = '';

        if (req.user?.type !== 'super_admin') {
            where = 'WHERE entreprise_id = ?';
            params.push(req.user.entreprise_id);
        }

        const [rows] = await pool.query(
            `SELECT id_mail, sender_email, to_email, subject, message, status, created_at
             FROM mail_messages
             ${where}
             ORDER BY created_at DESC
             LIMIT 60`,
            params
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const sendCustomMail = async (req, res) => {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
        return res.status(400).json({
            success: false,
            message: 'Destinataire, sujet et message requis'
        });
    }

    try {
        const result = await sendMail({
            to,
            subject,
            text: message,
            html: `<div style="font-family:Arial,sans-serif;line-height:1.6">${String(message).replace(/\n/g, '<br>')}</div>`,
            replyTo: req.user?.email,
            fromName: req.user?.nom || 'CRM PME'
        });

        if (result.skipped) {
            return res.status(503).json({ success: false, message: result.message });
        }

        await pool.query(
            `INSERT INTO mail_messages
                (entreprise_id, user_id, sender_email, to_email, subject, message, status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user?.entreprise_id || null,
                req.user?.id || null,
                req.user?.email || process.env.EMAIL_USER || null,
                to,
                subject,
                message,
                'envoye'
            ]
        );

        res.json({ success: true, message: 'Email envoye', data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
