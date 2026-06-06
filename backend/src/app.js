import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import errorHandler from './middleware/errorHandler.js';
import auditMiddleware from './middleware/auditMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import produitRoutes from './routes/produitRoutes.js';
import panierRoutes from './routes/panierRoutes.js';
import venteRoutes from './routes/venteRoutes.js';
import paiementRoutes from './routes/paiementRoutes.js';
import rapportRoutes from './routes/rapportRoutes.js';
import utilisateurRoutes from './routes/utilisateurRoutes.js';
import mailRoutes from './routes/mailRoutes.js';
import categorieRoutes from './routes/categorieRoutes.js';
import fournisseurRoutes from './routes/fournisseurRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import setupRoutes from './routes/setupRoutes.js';

dotenv.config();

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5174')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`Origine CORS non autorisee: ${origin}`));
    },
    credentials: true
}));
app.use(express.json());
app.use(auditMiddleware);

app.use('/api/utilisateurs', utilisateurRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/produits', produitRoutes);
app.use('/api/categories', categorieRoutes);
app.use('/api/fournisseurs', fournisseurRoutes);
app.use('/api/paniers', panierRoutes);
app.use('/api/ventes', venteRoutes);
app.use('/api/paiements', paiementRoutes);
app.use('/api/rapports', rapportRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/setup', setupRoutes);

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'CRM PME API operationnelle' });
});

app.use(errorHandler);

export default app;
