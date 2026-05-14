import express from 'express';
import { 
    loginSuperAdmin,
    getAllEntreprises,
    creerEntrepriseComplete,
    modifierEntreprise,
    modifierAbonnement,
    supprimerEntreprise,
    getStatsGlobales
} from '../controllers/superAdminController.js';
import { protectSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ✅ Route publique - Login Super Admin
router.post('/login', loginSuperAdmin);

// ✅ Routes protégées - Super Admin seulement
router.get('/stats',           protectSuperAdmin, getStatsGlobales);
router.get('/entreprises',     protectSuperAdmin, getAllEntreprises);
router.post('/entreprises',    protectSuperAdmin, creerEntrepriseComplete);
router.put('/entreprises/:id', protectSuperAdmin, modifierEntreprise);
router.put('/entreprises/:id/abonnement', protectSuperAdmin, modifierAbonnement);
router.delete('/entreprises/:id', protectSuperAdmin, supprimerEntreprise);

export default router;
