// backend/src/controllers/authController.js
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // ✅ Import correct

import { sendMail } from '../services/mailService.js';
import { notifyEnterpriseAdmins, notifySuperAdmins } from '../services/notificationService.js';

const generateToken = (user) => {
    return jwt.sign(
        { 
            id:            user.id_utilisateur, 
            email:         user.email, 
            role:          user.role, 
            entreprise_id: user.entreprise_id,
            nom:           user.nom,
            type:          'utilisateur'  // ✅ Important pour distinguer du super_admin
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// POST /api/auth/login
export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email et mot de passe requis' 
        });
    }

    try {
        const [users] = await pool.query(
            `SELECT u.*, e.raison_sociale AS entreprise_nom
             FROM utilisateur u
             JOIN entreprise e ON e.id_entreprise = u.entreprise_id
             WHERE u.email = ? AND u.actif = 1`,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email ou mot de passe incorrect' 
            });
        }

        const user = users[0];

        // ✅ Détecte le type de hash (SHA2 ou bcrypt)
        let isMatch = false;

        if (user.mot_de_passe.startsWith('$2')) {
            // C'est un hash bcrypt
            isMatch = await bcrypt.compare(password, user.mot_de_passe);
        } else {
            // C'est un hash SHA2 (ancienne méthode)
            const sha2Hash = crypto
                .createHash('sha256')
                .update(password)
                .digest('hex');
            isMatch = (sha2Hash === user.mot_de_passe);
        }

        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email ou mot de passe incorrect' 
            });
        }

        // Vérifie l'abonnement
        const [entreprise] = await pool.query(
            'SELECT statut_abonnement, date_expiration_abonnement FROM entreprise WHERE id_entreprise = ?',
            [user.entreprise_id]
        );

        if (!entreprise[0] || entreprise[0].statut_abonnement !== 'actif') {
            return res.status(403).json({ 
                success: false, 
                message: 'Abonnement expiré ou suspendu. Contactez votre administrateur.' 
            });
        }

        const token = generateToken(user);

        res.json({
            success: true,
            message: 'Connexion réussie',
            token,
            user: {
                id:            user.id_utilisateur,
                nom:           user.nom,
                email:         user.email,
                role:          user.role,
                entreprise_id: user.entreprise_id,
                entreprise_nom: user.entreprise_nom,
                type:          'utilisateur'
            }
        });

    } catch (error) {
        console.error('Erreur login: - authController.js:100', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT u.id_utilisateur, u.nom, u.email, u.role, 
                    u.entreprise_id, e.raison_sociale AS entreprise_nom
             FROM utilisateur u
             JOIN entreprise e ON u.entreprise_id = e.id_entreprise
             WHERE u.id_utilisateur = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Utilisateur non trouvé' 
            });
        }

        res.json({ success: true, user: users[0] });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const changePassword = async (req, res) => {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
        return res.status(400).json({ success: false, message: 'Mot de passe actuel et nouveau mot de passe requis' });
    }

    if (String(new_password).length < 6) {
        return res.status(400).json({ success: false, message: 'Le nouveau mot de passe doit contenir au moins 6 caracteres' });
    }

    try {
        const [users] = await pool.query(
            'SELECT id_utilisateur, mot_de_passe FROM utilisateur WHERE id_utilisateur = ? AND actif = 1',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });
        }

        const user = users[0];
        const isMatch = user.mot_de_passe.startsWith('$2')
            ? await bcrypt.compare(current_password, user.mot_de_passe)
            : crypto.createHash('sha256').update(current_password).digest('hex') === user.mot_de_passe;

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Mot de passe actuel incorrect' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await pool.query(
            'UPDATE utilisateur SET mot_de_passe = ? WHERE id_utilisateur = ?',
            [hashedPassword, req.user.id]
        );

        res.json({ success: true, message: 'Mot de passe mis a jour' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email requis' });
    }

    try {
        const [users] = await pool.query(
            `SELECT u.id_utilisateur, u.nom, u.email, u.role, u.entreprise_id, e.raison_sociale
             FROM utilisateur u
             JOIN entreprise e ON e.id_entreprise = u.entreprise_id
             WHERE u.email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.json({ success: true, message: 'Si cet email existe, une demande de recuperation a ete creee.' });
        }

        const user = users[0];
        const titre = 'Demande de recuperation de mot de passe';
        const message = `${user.nom} (${user.email}) demande la recuperation de son mot de passe.`;

        if (user.role === 'manager') {
            await notifySuperAdmins({
                titre,
                message: `${message} Entreprise: ${user.raison_sociale}.`,
                entreprise_id: user.entreprise_id
            });
            await sendMail({
                to: user.email,
                subject: 'Demande de recuperation recue - CRM PME',
                text: 'Votre demande de recuperation a ete recue. Le super administrateur peut vous assister.',
                html: '<p>Votre demande de recuperation a ete recue. Le super administrateur peut vous assister.</p>'
            }).catch(() => null);
        } else {
            await notifyEnterpriseAdmins({ entreprise_id: user.entreprise_id, titre, message });
        }

        res.json({ success: true, message: 'Demande envoyee. Un administrateur va vous assister.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
