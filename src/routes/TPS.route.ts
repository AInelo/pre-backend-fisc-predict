// Routes for TPS
import express from 'express';
import { TPSController } from '../controllers/TPS.controller';

const router = express.Router();
const controller = new TPSController();

// TODO: define routes for TPS
// Example: router.get('/', controller.methodName);

router.post('/calculer', TPSController.calculerTPS);
router.post('/valider-configuration', TPSController.validerConfiguration);
router.post('/generer-rapport', TPSController.genererRapport);

export default router;
