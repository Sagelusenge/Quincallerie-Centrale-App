import express from 'express';
import { 
    createPaiement, 
    getRapportCaisse,
    getRepartitionPaiements
} from '../controllers/paiementController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ MANAGER + CAISSIER peuvent enregistrer et voir les paiements
router.post('/',              
    protect, 
    authorizeRoles('manager', 'caissier'), 
    createPaiement
);

router.get('/rapport-caisse', 
    protect, 
    authorizeRoles('manager', 'caissier'), 
    getRapportCaisse
);

router.get('/repartition', 
    protect, 
    authorizeRoles('manager', 'caissier'), 
    getRepartitionPaiements
);

export default router;
