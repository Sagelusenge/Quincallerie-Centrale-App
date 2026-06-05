import express from 'express';
import {
    getAllPaniers,
    getPanierById,
    createPanier,
    updatePanier,
    convertirPanier,
    annulerPanier,
    deletePanier
} from '../controllers/panierController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/',
    protect,
    authorizeRoles('manager', 'caissier'),
    getAllPaniers
);

router.get('/:id',
    protect,
    authorizeRoles('manager', 'caissier'),
    getPanierById
);

router.post('/',
    protect,
    authorizeRoles('manager', 'caissier'),
    createPanier
);

router.put('/:id',
    protect,
    authorizeRoles('manager', 'caissier'),
    updatePanier
);

router.post('/:id/convertir',
    protect,
    authorizeRoles('manager', 'caissier'),
    convertirPanier
);

router.put('/:id/annuler',
    protect,
    authorizeRoles('manager'),
    annulerPanier
);

router.delete('/:id',
    protect,
    authorizeRoles('manager'),
    deletePanier
);

export default router;
