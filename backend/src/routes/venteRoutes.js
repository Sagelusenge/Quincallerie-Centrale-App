import express from 'express';
import { 
    getAllVentes, 
    getVenteById, 
    getVentePdf,
    createVente,
    updateVente,
    deleteVente
} from '../controllers/venteController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ MANAGER + CAISSIER peuvent voir et créer des ventes
router.get('/',    
    protect, 
    authorizeRoles('manager', 'caissier'), 
    getAllVentes
);

router.get('/:id/pdf',
    protect,
    authorizeRoles('manager', 'caissier'),
    getVentePdf
);

router.get('/:id', 
    protect, 
    authorizeRoles('manager', 'caissier'), 
    getVenteById
);

router.post('/',   
    protect, 
    authorizeRoles('manager', 'caissier'), 
    createVente
);

router.put('/:id',
    protect,
    authorizeRoles('manager'),
    updateVente
);

router.delete('/:id',
    protect,
    authorizeRoles('manager'),
    deleteVente
);

export default router;
