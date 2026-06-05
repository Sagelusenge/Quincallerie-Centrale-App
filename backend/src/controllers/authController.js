// backend/src/controllers/authController.js
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // ✅ Import correct

import { sendMail } from '../services/mailService.js';
import { notifyEnterpriseAdmins } from '../services/notificationService.js';

const generateToken = (user) => {
    return jwt.sign(
        { 
            id:            user.id_utilisateur, 
            email:         user.email, 
            role:          user.role, 
            entreprise_id: user.entreprise_id,
            nom:           user.nom,
            type:          'utilisateur'
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
             WHERE u.id_utilisateur = ? AND u.entreprise_id = ?`,
            [req.user.id, req.user.entreprise_id]
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
    const { new_password } = req.body;

    if (!new_password) {
        return res.status(400).json({ success: false, message: 'Nouveau mot de passe requis' });
    }

    if (String(new_password).length < 6) {
        return res.status(400).json({ success: false, message: 'Le nouveau mot de passe doit contenir au moins 6 caracteres' });
    }

    try {
        const [users] = await pool.query('SELECT id_utilisateur FROM utilisateur WHERE id_utilisateur = ? AND actif = 1', [req.user.id]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Utilisateur non trouve' });
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

export const resetRequestedPassword = async (req, res) => {
    const { email, new_password } = req.body;

    if (!email || !new_password) {
        return res.status(400).json({ success: false, message: 'Email et nouveau mot de passe requis' });
    }

    if (String(new_password).length < 6) {
        return res.status(400).json({ success: false, message: 'Le nouveau mot de passe doit contenir au moins 6 caracteres' });
    }

    try {
        const params = [email];
        let scope = '';

        if (req.user?.role !== 'manager') {
            return res.status(403).json({ success: false, message: 'Seul un manager peut reinitialiser un mot de passe utilisateur.' });
        }
        scope = ' AND u.entreprise_id = ?';
        params.push(req.user.entreprise_id);

        const [users] = await pool.query(
            `SELECT u.id_utilisateur, u.nom, u.email, u.role, e.raison_sociale
             FROM utilisateur u
             JOIN entreprise e ON e.id_entreprise = u.entreprise_id
             WHERE u.email = ? AND u.actif = 1${scope}`,
            params
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Utilisateur introuvable pour cette demande' });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await pool.query(
            'UPDATE utilisateur SET mot_de_passe = ? WHERE id_utilisateur = ?',
            [hashedPassword, users[0].id_utilisateur]
        );

        await sendMail({
            to: users[0].email,
            subject: 'Nouveau mot de passe temporaire - CRM PME',
            text: `Bonjour ${users[0].nom}, votre mot de passe temporaire est: ${new_password}. Connectez-vous puis changez-le dans vos parametres.`,
            html: `<p>Bonjour ${users[0].nom},</p><p>Votre mot de passe temporaire est: <strong>${new_password}</strong></p><p>Connectez-vous puis changez-le dans vos parametres.</p>`
        }).catch(() => null);

        res.json({ success: true, message: `Mot de passe reinitialise pour ${email}. Un email temporaire a ete envoye.` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    const { email, motif } = req.body;

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
        const reason = motif ? ` Motif: ${motif}` : '';
        const message = `${user.nom} (${user.email}) demande la recuperation de son mot de passe.${reason}`;
        await notifyEnterpriseAdmins({ entreprise_id: user.entreprise_id, titre, message });

        res.json({ success: true, message: 'Demande envoyee au manager.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
