import express from 'express';
import { configureEntreprise, getSetupStatus } from '../controllers/setupController.js';

const router = express.Router();

router.get('/status', getSetupStatus);
router.post('/company', configureEntreprise);

export default router;
