import express from 'express';
import { 
    getAllProduits, 
    getMouvementsStock,
    createProduit, 
    updateProduit, 
    deleteProduit, 
    approvisionner 
} from '../controllers/produitController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Tout le monde peut voir les produits
router.get('/',     
    protect, 
    authorizeRoles('manager', 'caissier', 'magasinier'), 
    getAllProduits
);

router.get('/mouvements-recents',
    protect,
    authorizeRoles('manager', 'magasinier'),
    getMouvementsStock
);

// ✅ MANAGER + MAGASINIER peuvent créer/modifier/supprimer
router.post('/',    
    protect, 
    authorizeRoles('manager', 'magasinier'), 
    createProduit
);

router.put('/:id',  
    protect, 
    authorizeRoles('manager', 'magasinier'), 
    updateProduit
);

router.delete('/:id', 
    protect, 
    authorizeRoles('manager'), 
    deleteProduit
);

// ✅ MANAGER + MAGASINIER peuvent approvisionner
router.post('/:id/approvisionner', 
    protect, 
    authorizeRoles('manager', 'magasinier'), 
    approvisionner
);

export default router;
