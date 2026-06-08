import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import pool from './config/db.js';

dotenv.config();

const ADMIN_EMAIL = 'admin@exemple.com';
const ADMIN_PASSWORD = 'admin123';
const ADMIN_NAME = 'Administrateur';
const DEFAULT_ENTREPRISE_ID = 'ENT-EXE-0001';

const getOrCreateEntreprise = async (connection) => {
    const [entreprises] = await connection.query(
        `SELECT id_entreprise
         FROM entreprise
         ORDER BY id_entreprise
         LIMIT 1`
    );

    if (entreprises.length > 0) {
        return entreprises[0].id_entreprise;
    }

    await connection.query(
        `INSERT INTO entreprise (id_entreprise, raison_sociale, email, ville)
         VALUES (?, ?, ?, ?)`,
        [DEFAULT_ENTREPRISE_ID, 'Entreprise Exemple', ADMIN_EMAIL, 'Kinshasa']
    );

    return DEFAULT_ENTREPRISE_ID;
};

const getNextUtilisateurId = async (connection) => {
    await connection.query(
        `INSERT IGNORE INTO sequences (nom_table, derniere_valeur)
         VALUES ('utilisateur', 0)`
    );
    await connection.query(
        `UPDATE sequences
         SET derniere_valeur = derniere_valeur + 1
         WHERE nom_table = 'utilisateur'`
    );
    const [rows] = await connection.query(
        `SELECT derniere_valeur
         FROM sequences
         WHERE nom_table = 'utilisateur'`
    );

    return `USR-${String(rows[0].derniere_valeur).padStart(5, '0')}`;
};

const seedAdmin = async () => {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const entrepriseId = await getOrCreateEntreprise(connection);
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

        const [existingUsers] = await connection.query(
            `SELECT id_utilisateur
             FROM utilisateur
             WHERE email = ?
             LIMIT 1`,
            [ADMIN_EMAIL]
        );

        if (existingUsers.length > 0) {
            await connection.query(
                `UPDATE utilisateur
                 SET entreprise_id = ?,
                     nom = ?,
                     mot_de_passe = ?,
                     role = 'manager',
                     actif = TRUE
                 WHERE email = ?`,
                [entrepriseId, ADMIN_NAME, hashedPassword, ADMIN_EMAIL]
            );
        } else {
            const utilisateurId = await getNextUtilisateurId(connection);
            await connection.query(
                `INSERT INTO utilisateur
                    (id_utilisateur, entreprise_id, nom, email, mot_de_passe, role, actif)
                 VALUES (?, ?, ?, ?, ?, 'manager', TRUE)`,
                [utilisateurId, entrepriseId, ADMIN_NAME, ADMIN_EMAIL, hashedPassword]
            );
        }

        await connection.commit();
        console.log('Utilisateur admin pret:');
        console.log(`Email: ${ADMIN_EMAIL}`);
        console.log(`Mot de passe: ${ADMIN_PASSWORD}`);
    } catch (error) {
        await connection.rollback();
        console.error('Erreur seed admin:', error.message);
        process.exitCode = 1;
    } finally {
        connection.release();
        await pool.end();
    }
};

seedAdmin();
