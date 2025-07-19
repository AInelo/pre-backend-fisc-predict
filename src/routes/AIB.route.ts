
// routes/aib.routes.ts
import { Router } from 'express';
import { AIBController } from '../controllers/reel/AIB.controller';

const router = Router();



router.post('/simuler-aib', AIBController.simuler);
router.post('/verifier-exoneration', AIBController.verifierExoneration);
router.post('/estimer-avant-transaction', AIBController.estimerAvantTransaction);
router.post('/verifier-pour-declaration', AIBController.verifierPourDeclaration);
router.post('/simuler-retenue-negociation', AIBController.simulerRetenuePourNegociation);
router.post('/planifier-charges-fiscales', AIBController.planifierChargesFiscales);
router.post('/reconstituer-pour-controle', AIBController.reconstituerPourControle);

export default router;
