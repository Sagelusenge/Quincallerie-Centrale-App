import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import { sendWelcomeUserEmail } from '../services/mailService.js';

const rolesAutorises = ['manager', 'caissier', 'magasinier'];

const nextUtilisateurId = async (connection) => {
    await connection.query(
        `UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = 'utilisateur'`
    );
    const [rows] = await connection.query(
        `SELECT derniere_valeur FROM sequences WHERE nom_table = 'utilisateur'`
    );
    return `USR-${String(rows[0].derniere_valeur).padStart(5, '0')}`;
};

// GET /api/utilisateurs
export const getAllUtilisateurs = async (req, res) => {
    const entreprise_id = req.user.entreprise_id;
    try {
        const [rows] = await pool.query(
            `SELECT id_utilisateur, nom, email, role, actif
             FROM utilisateur
             WHERE entreprise_id = ?
             ORDER BY role, nom`,
            [entreprise_id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/utilisateurs/:id/historique
export const getHistoriqueUtilisateur = async (req, res) => {
    const { id } = req.params;
    const entreprise_id = req.user.entreprise_id;

    try {
        const [users] = await pool.query(
            `SELECT id_utilisateur, nom, email, role, actif
             FROM utilisateur
             WHERE id_utilisateur = ? AND entreprise_id = ?`,
            [id, entreprise_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
        }

        const [logs] = await pool.query(
            `SELECT id_log, user_id, user_name, user_role, action_type, module, entity_id, description, metadata, created_at
             FROM user_activity_logs
             WHERE entreprise_id = ? AND user_id = ?
             ORDER BY created_at DESC
             LIMIT 100`,
            [entreprise_id, id]
        );

        res.json({
            success: true,
            data: {
                utilisateur: users[0],
                historique: logs
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/utilisateurs
export const createUtilisateur = async (req, res) => {
    const { nom, email, mot_de_passe, role } = req.body;
    const entreprise_id = req.user.entreprise_id;

    if (!nom || !email || !mot_de_passe || !role) {
        return res.status(400).json({
            success: false,
            message: 'Tous les champs sont requis'
        });
    }

    if (!rolesAutorises.includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Role invalide'
        });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const id_utilisateur = await nextUtilisateurId(connection);
        const hashedMdp = await bcrypt.hash(mot_de_passe, 10);

        await connection.query(
            `INSERT INTO utilisateur
                (id_utilisateur, entreprise_id, nom, email, mot_de_passe, role, actif)
             VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
            [id_utilisateur, entreprise_id, nom, email, hashedMdp, role]
        );

        await connection.commit();

        sendWelcomeUserEmail({
            to: email,
            name: nom,
            role,
            password: mot_de_passe
        }).catch((error) => console.error('Erreur email utilisateur:', error.message));

        res.status(201).json({
            success: true,
            message: `Utilisateur ${nom} cree avec le role ${role}`,
            data: { id_utilisateur, nom, email, role }
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// PUT /api/utilisateurs/:id
export const updateUtilisateur = async (req, res) => {
    const { id } = req.params;
    const { nom, email, role, mot_de_passe } = req.body;
    const entreprise_id = req.user.entreprise_id;

    if (!nom || !email || !role) {
        return res.status(400).json({ success: false, message: 'Nom, email et role requis' });
    }

    if (!rolesAutorises.includes(role)) {
        return res.status(400).json({ success: false, message: 'Role invalide' });
    }

    try {
        let result;
        if (mot_de_passe) {
            const hashedMdp = await bcrypt.hash(mot_de_passe, 10);
            [result] = await pool.query(
                `UPDATE utilisateur
                 SET nom = ?, email = ?, role = ?, mot_de_passe = ?
                 WHERE id_utilisateur = ? AND entreprise_id = ?`,
                [nom, email, role, hashedMdp, id, entreprise_id]
            );
        } else {
            [result] = await pool.query(
                `UPDATE utilisateur
                 SET nom = ?, email = ?, role = ?
                 WHERE id_utilisateur = ? AND entreprise_id = ?`,
                [nom, email, role, id, entreprise_id]
            );
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
        }

        res.json({ success: true, message: 'Utilisateur mis a jour' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/utilisateurs/:id/toggle
export const toggleUtilisateur = async (req, res) => {
    const { id } = req.params;
    const entreprise_id = req.user.entreprise_id;

    try {
        const [result] = await pool.query(
            `UPDATE utilisateur
             SET actif = NOT actif
             WHERE id_utilisateur = ? AND entreprise_id = ?`,
            [id, entreprise_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
        }

        res.json({ success: true, message: 'Statut utilisateur modifie' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/utilisateurs/:id
export const deleteUtilisateur = async (req, res) => {
    const { id } = req.params;
    const entreprise_id = req.user.entreprise_id;

    if (id === req.user.id) {
        return res.status(400).json({ success: false, message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    try {
        const [users] = await pool.query(
            `SELECT id_utilisateur, role
             FROM utilisateur
             WHERE id_utilisateur = ? AND entreprise_id = ?`,
            [id, entreprise_id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
        }

        if (users[0].role === 'manager') {
            return res.status(403).json({ success: false, message: 'Un manager ne peut pas supprimer un autre manager' });
        }

        const [result] = await pool.query(
            `DELETE FROM utilisateur WHERE id_utilisateur = ? AND entreprise_id = ?`,
            [id, entreprise_id]
        );

        res.json({ success: true, message: 'Utilisateur supprime' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
