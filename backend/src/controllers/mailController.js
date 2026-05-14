import { isMailReady, sendMail } from '../services/mailService.js';

export const getMailStatus = (req, res) => {
    res.json({
        success: true,
        data: {
            ready: isMailReady(),
            sender: process.env.EMAIL_USER || null
        }
    });
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
            html: `<div style="font-family:Arial,sans-serif;line-height:1.6">${String(message).replace(/\n/g, '<br>')}</div>`
        });

        if (result.skipped) {
            return res.status(503).json({ success: false, message: result.message });
        }

        res.json({ success: true, message: 'Email envoye', data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
