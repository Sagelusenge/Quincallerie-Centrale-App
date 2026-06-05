import bcrypt from 'bcryptjs';
import pool from '../config/db.js';

const normalizePrefix = (name) => {
    const cleaned = String(name || 'ENT')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();

    return (cleaned || 'ENT').slice(0, 3).padEnd(3, 'X');
};

const buildEntrepriseId = (raisonSociale) => `ENT-${normalizePrefix(raisonSociale)}-0001`;

const nextUtilisateurId = async (connection) => {
    await connection.query(
        `UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = 'utilisateur'`
    );
    const [rows] = await connection.query(
        `SELECT derniere_valeur FROM sequences WHERE nom_table = 'utilisateur'`
    );
    return `USR-${String(rows[0].derniere_valeur).padStart(5, '0')}`;
};

export const getSetupStatus = async (req, res) => {
    try {
        const [[companyStats]] = await pool.query(
            `SELECT COUNT(*) AS total FROM entreprise`
        );
        const [[managerStats]] = await pool.query(
            `SELECT COUNT(*) AS total FROM utilisateur WHERE role = 'manager' AND actif = 1`
        );

        res.json({
            success: true,
            data: {
                configured: companyStats.total > 0 && managerStats.total > 0,
                setup_available: companyStats.total === 0 && managerStats.total === 0,
                locked: companyStats.total > 0 || managerStats.total > 0,
                entreprises: companyStats.total,
                managers_actifs: managerStats.total
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const configureEntreprise = async (req, res) => {
    const {
        id_entreprise,
        raison_sociale,
        num_id_nationale,
        email_entreprise,
        ville,
        nom_manager,
        email_manager,
        mot_de_passe_manager,
        setup_code
    } = req.body;

    const expectedSetupCode = String(process.env.SETUP_CODE || '').trim();
    const providedSetupCode = String(req.headers['x-setup-code'] || setup_code || '').trim();

    if (expectedSetupCode && providedSetupCode !== expectedSetupCode) {
        return res.status(403).json({
            success: false,
            message: 'Code de premiere installation invalide.'
        });
    }

    if (!raison_sociale || !nom_manager || !email_manager || !mot_de_passe_manager) {
        return res.status(400).json({
            success: false,
            message: 'Raison sociale, nom manager, email manager et mot de passe manager sont requis.'
        });
    }

    if (String(mot_de_passe_manager).length < 6) {
        return res.status(400).json({
            success: false,
            message: 'Le mot de passe manager doit contenir au moins 6 caracteres.'
        });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [companies] = await connection.query(
            `SELECT id_entreprise FROM entreprise ORDER BY id_entreprise LIMIT 1 FOR UPDATE`
        );
        const [managers] = await connection.query(
            `SELECT id_utilisateur FROM utilisateur WHERE role = 'manager' ORDER BY id_utilisateur LIMIT 1 FOR UPDATE`
        );

        if (companies.length > 0 || managers.length > 0) {
            await connection.rollback();
            return res.status(409).json({
                success: false,
                message: 'Configuration deja effectuee. Accedez a la page de connexion.'
            });
        }

        const entrepriseId = id_entreprise || buildEntrepriseId(raison_sociale);
        await connection.query(
            `INSERT INTO entreprise (id_entreprise, raison_sociale, num_id_nationale, email, ville)
             VALUES (?, ?, ?, ?, ?)`,
            [entrepriseId, raison_sociale, num_id_nationale || null, email_entreprise || null, ville || null]
        );

        const hashedPassword = await bcrypt.hash(mot_de_passe_manager, 10);
        const managerId = await nextUtilisateurId(connection);
        await connection.query(
            `INSERT INTO utilisateur (id_utilisateur, entreprise_id, nom, email, mot_de_passe, role, actif)
             VALUES (?, ?, ?, ?, ?, 'manager', TRUE)`,
            [managerId, entrepriseId, nom_manager, email_manager, hashedPassword]
        );

        await connection.commit();

        res.json({
            success: true,
            message: 'Entreprise configuree avec son manager.',
            data: {
                id_entreprise: entrepriseId,
                raison_sociale,
                manager: {
                    id_utilisateur: managerId,
                    nom: nom_manager,
                    email: email_manager,
                    role: 'manager'
                }
            }
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};
