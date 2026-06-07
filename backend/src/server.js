import app from './app.js';
import dotenv from 'dotenv';
import pool from './config/db.js';
import { ensureRuntimeSchema } from './services/schemaService.js';
import { startAutomaticBackups } from './services/backupService.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Base de donnees CRM_PME connectee');
        connection.release();

        await ensureRuntimeSchema(pool);
        startAutomaticBackups(pool);

        app.listen(PORT, () => {
            console.log(`Serveur demarre sur http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Erreur de connexion a la base de donnees:', error.message);
        process.exit(1);
    }
};

startServer();
