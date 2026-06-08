import express from 'express';
import {
    getAllFournisseurs,
    getFournisseurById,
    createFournisseur,
    updateFournisseur,
    deleteFournisseur
} from '../controllers/fournisseurController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/',
    protect,
    authorizeRoles('manager', 'magasinier'),
    getAllFournisseurs
);

router.get('/:id',
    protect,
    authorizeRoles('manager', 'magasinier'),
    getFournisseurById
);

router.post('/',
    protect,
    authorizeRoles('manager', 'magasinier'),
    createFournisseur
);

router.put('/:id',
    protect,
    authorizeRoles('manager', 'magasinier'),
    updateFournisseur
);

router.delete('/:id',
    protect,
    authorizeRoles('manager', 'magasinier'),
    deleteFournisseur
);

export default router;
