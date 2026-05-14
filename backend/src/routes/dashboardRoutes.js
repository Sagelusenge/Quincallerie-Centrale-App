import express from 'express';
import { 
    getStats, 
    getVentesMensuelles, 
    getAlertesStock 
} from '../controllers/dashboardController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Seulement le MANAGER voit le dashboard complet
router.get('/stats',             
    protect, 
    authorizeRoles('manager'), 
    getStats
);

router.get('/ventes-mensuelles', 
    protect, 
    authorizeRoles('manager'), 
    getVentesMensuelles
);

router.get('/alertes-stock',     
    protect, 
    authorizeRoles('manager', 'magasinier'), 
    getAlertesStock
);

export default router;