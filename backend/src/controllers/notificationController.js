import pool from '../config/db.js';

export const getNotifications = async (req, res) => {
    try {
        let rows;
        if (req.user?.type === 'super_admin') {
            [rows] = await pool.query(
                `SELECT * FROM notifications
                 WHERE recipient_type = 'super_admin'
                 ORDER BY created_at DESC
                 LIMIT 30`
            );
        } else {
            [rows] = await pool.query(
                `SELECT * FROM notifications
                 WHERE recipient_user_id = ?
                    OR (recipient_type = 'enterprise_admin' AND entreprise_id = ?)
                 ORDER BY created_at DESC
                 LIMIT 30`,
                [req.user.id, req.user.entreprise_id]
            );
        }

        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markNotificationRead = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query(`UPDATE notifications SET lu = TRUE WHERE id_notification = ?`, [id]);
        res.json({ success: true, message: 'Notification lue' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
