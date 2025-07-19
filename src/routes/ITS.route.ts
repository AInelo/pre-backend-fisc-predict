// Routes for ITS
import express from 'express';
import { ITSController } from '../controllers/reel/ITS.controller';

const router = express.Router();
const controller = new ITSController();

// TODO: define routes for ITS
// Example: router.get('/', controller.methodName);

router.post('/calculer', ITSController.calculerITS);
router.post('/calculer-annuel', ITSController.calculerITSAnnuel);
router.post('/calculer-par-periode', ITSController.calculerITSParPeriode);
router.post('/calculer-scenarios', ITSController.calculerScenariosITS);
router.post('/verifier-prelevement', ITSController.verifierPrelevementITS);
router.post('/estimer-revenu-net', ITSController.estimerRevenuNet);
router.post('/calculer-avec-changement', ITSController.calculerITSAvecChangement);
router.post('/calculer-revenu-net-periode', ITSController.calculerRevenuNetSurPeriode);

export default router;
