// Routes for PATENTE
import express from 'express';
import { PATENTEController } from '../controllers/PATENTE.controller';

const router = express.Router();
const controller = new PATENTEController();

// TODO: define routes for PATENTE
// Example: router.get('/', controller.methodName);

router.post('/calculer', PATENTEController.calculerPatente);
router.post('/estimer-creation-entreprise', PATENTEController.estimerCreationEntreprise);
router.post('/estimer-declaration-annuelle', PATENTEController.estimerDeclarationAnnuelle);
router.post('/estimer-patente-complementaire', PATENTEController.estimerPatenteComplementaire);
router.post('/estimer-patente-supplementaire', PATENTEController.estimerPatenteSupplementaire);
router.post('/estimer-pour-zone', PATENTEController.estimerPourZone);
router.post('/estimer-fin-exoneration', PATENTEController.estimerFinExoneration);

export default router;
