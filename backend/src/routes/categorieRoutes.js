import express from 'express';
import { getCategories, createCategorie, updateCategorie, deleteCategorie } from '../controllers/categorieController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorizeRoles('manager', 'caissier', 'magasinier'), getCategories);
router.post('/', protect, authorizeRoles('manager', 'magasinier'), createCategorie);
router.put('/:id', protect, authorizeRoles('manager', 'magasinier'), updateCategorie);
router.delete('/:id', protect, authorizeRoles('manager'), deleteCategorie);

export default router;
