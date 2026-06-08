import app from './app.js';
import dotenv from 'dotenv';
import pool from './config/db.js';
import { ensureRuntimeSchema } from './services/schemaService.js';
import { startAutomaticBackups } from './services/backupService.js';

dotenv.config();

const PORT = process.env.PORT || 5000;
const DB_RETRY_DELAY_MS = Number(process.env.DB_RETRY_DELAY_MS || 15000);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const initializeDatabase = async () => {
    while (true) {
        try {
            const connection = await pool.getConnection();
            console.log('Base de donnees CRM_PME connectee');
            connection.release();

            await ensureRuntimeSchema(pool);
            startAutomaticBackups(pool);
            return;
        } catch (error) {
            console.error(`Erreur de connexion a la base de donnees: ${error.message}`);
            console.error(`Nouvelle tentative dans ${DB_RETRY_DELAY_MS / 1000}s`);
            await wait(DB_RETRY_DELAY_MS);
        }
    }
};

const startServer = async () => {
    app.listen(PORT, () => {
        console.log(`Serveur demarre sur http://localhost:${PORT}`);
    });

    initializeDatabase();
};

startServer();
