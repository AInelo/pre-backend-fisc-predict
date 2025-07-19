// Routes for IRF
import express from 'express';
import { IRFController } from '../controllers/reel/IRF.controller';

const router = express.Router();
const controller = new IRFController();

// TODO: define routes for IRF
// Example: router.get('/', controller.methodName);

router.post('/calculer-mensuel', IRFController.calculerMensuel);
router.post('/calculer-annuel', IRFController.calculerAnnuel);
router.post('/calculer-avec-changement-statut', IRFController.calculerAvecChangementStatut);
router.post('/calculer-loyers-variables', IRFController.calculerLoyersVariables);
router.post('/calculer-jusqua-cession', IRFController.calculerJusquaCession);
router.post('/evaluer-rentabilite-net', IRFController.evaluerRentabiliteNet);
router.post('/detecter-retards', IRFController.detecterRetards);
router.post('/simulation-contrat', IRFController.simulationContrat);
router.post('/synthese-periode', IRFController.synthesePeriode);

export default router;
