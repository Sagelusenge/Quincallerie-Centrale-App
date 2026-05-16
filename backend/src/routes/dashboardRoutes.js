import express from 'express';
import { 
    getStats, 
    getVentesMensuelles, 
    getAlertesStock,
    getProduitsPlusVendus
} from '../controllers/dashboardController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Dashboard adapte selon le role connecte.
router.get('/stats',             
    protect, 
    authorizeRoles('manager', 'caissier', 'magasinier'), 
    getStats
);

router.get('/ventes-mensuelles', 
    protect, 
    authorizeRoles('manager', 'caissier'), 
    getVentesMensuelles
);

router.get('/alertes-stock',     
    protect, 
    authorizeRoles('manager', 'magasinier'), 
    getAlertesStock
);

router.get('/produits-plus-vendus',
    protect,
    authorizeRoles('manager', 'caissier', 'magasinier'),
    getProduitsPlusVendus
);

export default router;
