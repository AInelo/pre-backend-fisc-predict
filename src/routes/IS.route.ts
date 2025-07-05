// Routes for IS
import express from 'express';
import { ISController } from '../controllers/IS.controller';

const router = express.Router();
const controller = new ISController();

// TODO: define routes for IS
// Example: router.get('/', controller.methodName);

router.post('/calculer', ISController.calculerIS);
router.post('/creation-entreprise', ISController.calculerCreationEntreprise);
router.post('/simulation-financiere', ISController.calculerSimulationFinanciere);
router.post('/declaration-fiscale', ISController.calculerDeclarationFiscale);
router.post('/impact-exoneration', ISController.calculerImpactExoneration);
router.post('/bilan-audit-fiscal', ISController.calculerBilanAuditFiscal);
router.post('/reprise-cession', ISController.calculerRepriseCession);

export default router;
