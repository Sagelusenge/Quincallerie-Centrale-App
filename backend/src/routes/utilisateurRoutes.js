import express from 'express';
import {
    getAllUtilisateurs,
    createUtilisateur,
    updateUtilisateur,
    getHistoriqueUtilisateur,
    toggleUtilisateur,
    deleteUtilisateur
} from '../controllers/utilisateurController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Seulement le MANAGER gère les utilisateurs
router.get('/',
    protect,
    authorizeRoles('manager'),
    getAllUtilisateurs
);

router.post('/',
    protect,
    authorizeRoles('manager'),
    createUtilisateur
);

router.get('/:id/historique',
    protect,
    authorizeRoles('manager'),
    getHistoriqueUtilisateur
);

router.put('/:id',
    protect,
    authorizeRoles('manager'),
    updateUtilisateur
);

router.put('/:id/toggle',
    protect,
    authorizeRoles('manager'),
    toggleUtilisateur
);

router.delete('/:id',
    protect,
    authorizeRoles('manager'),
    deleteUtilisateur
);

export default router;
