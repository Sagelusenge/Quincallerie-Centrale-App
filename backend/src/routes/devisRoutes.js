import express from 'express';
import {
    getAllDevis,
    getDevisById,
    createDevis,
    updateDevis,
    convertirDevis,
    annulerDevis,
    deleteDevis
} from '../controllers/devisController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/',
    protect,
    authorizeRoles('manager', 'caissier'),
    getAllDevis
);

router.get('/:id',
    protect,
    authorizeRoles('manager', 'caissier'),
    getDevisById
);

router.post('/',
    protect,
    authorizeRoles('manager', 'caissier'),
    createDevis
);

router.put('/:id',
    protect,
    authorizeRoles('manager', 'caissier'),
    updateDevis
);

router.post('/:id/convertir',
    protect,
    authorizeRoles('manager', 'caissier'),
    convertirDevis
);

router.put('/:id/annuler',
    protect,
    authorizeRoles('manager'),
    annulerDevis
);

router.delete('/:id',
    protect,
    authorizeRoles('manager'),
    deleteDevis
);

export default router;
