// Routes for IBA
import express from 'express';
import { IBAController } from '../controllers/IBA.controller';

const router = express.Router();
const controller = new IBAController();

// TODO: define routes for IBA
// Example: router.get('/', controller.methodName);

router.post('/calculer', IBAController.calculerIBA);
router.post('/estimer-proportionnel', IBAController.estimerIBAProportionnel);
router.post('/simuler-reduction', IBAController.simulerReduction);
router.post('/verifier-eligibilite-regime-reel', IBAController.verifierEligibiliteRegimeReel);
router.post('/simuler-business-plan', IBAController.simulerBusinessPlan);
router.post('/verifier-coherence-audit', IBAController.verifierCoherenceAudit);

export default router;
