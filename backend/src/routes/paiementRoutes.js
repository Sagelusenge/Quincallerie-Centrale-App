import express from 'express';
import { 
    createPaiement, 
    getRapportCaisse 
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

export default router;