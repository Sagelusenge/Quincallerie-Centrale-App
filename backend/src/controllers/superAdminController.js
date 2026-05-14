import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto'; // ✅ Import ES Module (pas require)

import { sendWelcomeUserEmail } from '../services/mailService.js';

const nextUtilisateurId = async (connection) => {
    await connection.query(
        `UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = 'utilisateur'`
    );
    const [rows] = await connection.query(
        `SELECT derniere_valeur FROM sequences WHERE nom_table = 'utilisateur'`
    );
    return `USR-${String(rows[0].derniere_valeur).padStart(5, '0')}`;
};

// ══════════════════════════════════════
// LOGIN SUPER ADMIN
// ══════════════════════════════════════
export const loginSuperAdmin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Email et mot de passe requis' 
        });
    }

    try {
        // Cherche le super admin dans la BD
        const [admins] = await pool.query(
            'SELECT * FROM super_admin WHERE email = ?',
            [email]
        );

        if (admins.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email ou mot de passe incorrect' 
            });
        }

        const admin = admins[0];

        // ✅ Hash SHA2 comme dans ta BD (SHA2('Admin@2025', 256))
        const hashInput = crypto
            .createHash('sha256')
            .update(password)
            .digest('hex');

        if (hashInput !== admin.mot_de_passe) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email ou mot de passe incorrect' 
            });
        }

        // ✅ Génère le token avec type = super_admin
        const token = jwt.sign(
            { 
                id:    admin.id_super_admin, 
                email: admin.email, 
                nom:   admin.nom,
                type:  'super_admin'
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            message: 'Connexion Super Admin réussie',
            token,
            admin: {
                id:    admin.id_super_admin,
                nom:   admin.nom,
                email: admin.email,
                type:  'super_admin'
            }
        });

    } catch (error) {
        console.error('Erreur loginSuperAdmin: - superAdminController.js:73', error.message);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

// ══════════════════════════════════════
// STATS GLOBALES PLATEFORME
// ══════════════════════════════════════
export const getStatsGlobales = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                (SELECT COUNT(*) FROM entreprise) AS total_entreprises,
                (SELECT COUNT(*) FROM entreprise 
                 WHERE statut_abonnement = 'actif') AS entreprises_actives,
                (SELECT COUNT(*) FROM entreprise 
                 WHERE statut_abonnement = 'suspendu') AS entreprises_suspendues,
                (SELECT COUNT(*) FROM utilisateur) AS total_utilisateurs,
                (SELECT COUNT(*) FROM ventes) AS total_ventes,
                (SELECT IFNULL(SUM(montant_ttc), 0) FROM ventes) AS ca_global`
        );

        res.json({ success: true, data: rows[0] });

    } catch (error) {
        console.error('Erreur getStatsGlobales: - superAdminController.js:101', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ══════════════════════════════════════
// VOIR TOUTES LES ENTREPRISES
// ══════════════════════════════════════
export const getAllEntreprises = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                e.id_entreprise,
                e.raison_sociale,
                e.email,
                e.ville,
                e.num_id_nationale,
                e.statut_abonnement,
                e.date_expiration_abonnement,
                DATEDIFF(e.date_expiration_abonnement, CURDATE()) AS jours_restants,
                (SELECT COUNT(*) FROM utilisateur u 
                 WHERE u.entreprise_id = e.id_entreprise) AS nb_employes,
                (SELECT COUNT(*) FROM ventes v 
                 WHERE v.entreprise_id = e.id_entreprise) AS nb_ventes,
                IFNULL(
                    (SELECT SUM(montant_ttc) FROM ventes v 
                     WHERE v.entreprise_id = e.id_entreprise), 0
                ) AS ca_total
             FROM entreprise e
             ORDER BY e.id_entreprise DESC`
        );

        res.json({ success: true, data: rows });

    } catch (error) {
        console.error('Erreur getAllEntreprises: - superAdminController.js:136', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
// ══════════════════════════════════════
// CRÉER UNE ENTREPRISE + SON MANAGER
// ══════════════════════════════════════
export const creerEntrepriseComplete = async (req, res) => {
    const { 
        raison_sociale, 
        email_entreprise, 
        num_id_nationale, 
        ville, 
        nom_manager, 
        email_manager, 
        mdp_manager 
    } = req.body;

    // Validation
    if (!raison_sociale || !nom_manager || !email_manager || !mdp_manager) {
        return res.status(400).json({ 
            success: false, 
            message: 'Tous les champs sont requis' 
        });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Crée l'entreprise (trigger génère l'ID)
        await connection.query(
            `INSERT INTO entreprise 
                (raison_sociale, num_id_nationale, email, ville, 
                 statut_abonnement, date_expiration_abonnement, 
                 cree_par_admin_id)
             VALUES (?, ?, ?, ?, 'actif', 
                     DATE_ADD(CURDATE(), INTERVAL 1 MONTH), ?)`,
            [
                raison_sociale, 
                num_id_nationale || null, 
                email_entreprise || null, 
                ville || null, 
                req.superAdmin.id
            ]
        );

        // 2. Récupère l'ID généré par le trigger
        const [seq] = await connection.query(
            `SELECT derniere_valeur 
             FROM sequences WHERE nom_table = 'entreprise'`
        );
        const nb   = seq[0].derniere_valeur;
        const pref = raison_sociale
                        .replace(/\s/g, '')
                        .substring(0, 3)
                        .toUpperCase();
        const id_entreprise = `ENT-${pref}-${String(nb).padStart(4, '0')}`;

        // 3. Hash du mot de passe avec bcrypt
        const hashedMdp = await bcrypt.hash(mdp_manager, 10);

        // 4. Crée le manager de l'entreprise
        const id_manager = await nextUtilisateurId(connection);
        await connection.query(
            `INSERT INTO utilisateur
                (id_utilisateur, entreprise_id, nom, email, mot_de_passe, role, actif)
             VALUES (?, ?, ?, ?, ?, 'manager', TRUE)`,
            [id_manager, id_entreprise, nom_manager, email_manager, hashedMdp]
        );

        await connection.commit();

        sendWelcomeUserEmail({
            to: email_manager,
            name: nom_manager,
            role: 'manager',
            password: mdp_manager,
            company: raison_sociale
        }).catch((error) => console.error('Erreur email manager:', error.message));

        res.status(201).json({ 
            success: true, 
            message: `Entreprise "${raison_sociale}" créée avec son manager`,
            data: { 
                id_entreprise, 
                email_manager,
                role: 'manager'
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Erreur creerEntrepriseComplete: - superAdminController.js:220', error.message);
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// ══════════════════════════════════════
// MODIFIER ABONNEMENT
// ══════════════════════════════════════
export const modifierEntreprise = async (req, res) => {
    const { id } = req.params;
    const { raison_sociale, num_id_nationale, email_entreprise, ville } = req.body;

    if (!raison_sociale) {
        return res.status(400).json({ success: false, message: 'Raison sociale requise' });
    }

    try {
        const [result] = await pool.query(
            `UPDATE entreprise
             SET raison_sociale = ?, num_id_nationale = ?, email = ?, ville = ?
             WHERE id_entreprise = ?`,
            [raison_sociale, num_id_nationale || null, email_entreprise || null, ville || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Entreprise non trouvee' });
        }

        res.json({ success: true, message: 'Entreprise mise a jour' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const modifierAbonnement = async (req, res) => {
    const { id }            = req.params;
    const { action, mois }  = req.body;

    try {
        if (action === 'ACTIVER') {
            await pool.query(
                `UPDATE entreprise 
                 SET statut_abonnement = 'actif',
                     date_expiration_abonnement = DATE_ADD(CURDATE(), INTERVAL ? MONTH)
                 WHERE id_entreprise = ?`,
                [mois || 1, id]
            );
            res.json({ 
                success: true, 
                message: `Abonnement activé pour ${mois || 1} mois` 
            });

        } else if (action === 'SUSPENDRE') {
            await pool.query(
                `UPDATE entreprise 
                 SET statut_abonnement = 'suspendu'
                 WHERE id_entreprise = ?`,
                [id]
            );
            res.json({ 
                success: true, 
                message: 'Entreprise suspendue avec succès' 
            });

        } else {
            res.status(400).json({ 
                success: false, 
                message: 'Action invalide. Utilisez ACTIVER ou SUSPENDRE' 
            });
        }

    } catch (error) {
        console.error('Erreur modifierAbonnement: - superAdminController.js:268', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ══════════════════════════════════════
// SUPPRIMER UNE ENTREPRISE
// ══════════════════════════════════════
export const supprimerEntreprise = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query(
            'DELETE FROM entreprise WHERE id_entreprise = ?', 
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Entreprise non trouvée' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Entreprise supprimée avec succès' 
        });

    } catch (error) {
        console.error('Erreur supprimerEntreprise: - superAdminController.js:298', error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
