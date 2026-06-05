import pool from '../config/db.js';

export const createNotification = async ({ recipient_type = 'user', recipient_user_id = null, entreprise_id = null, titre, message }) => {
    await pool.query(
        `INSERT INTO notifications (recipient_type, recipient_user_id, entreprise_id, titre, message)
         VALUES (?, ?, ?, ?, ?)`,
        [recipient_type, recipient_user_id, entreprise_id, titre, message]
    );
};

export const notifyEnterpriseAdmins = async ({ entreprise_id, titre, message }) => {
    const [admins] = await pool.query(
        `SELECT id_utilisateur FROM utilisateur
         WHERE entreprise_id = ? AND role = 'manager' AND actif = 1`,
        [entreprise_id]
    );

    for (const admin of admins) {
        await createNotification({
            recipient_type: 'user',
            recipient_user_id: admin.id_utilisateur,
            entreprise_id,
            titre,
            message
        });
    }
};
