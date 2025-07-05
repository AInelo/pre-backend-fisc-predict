
// routes/aib.routes.ts
import { Router } from 'express';
import { AIBController } from '../controllers/AIB.controller';

const router = Router();


// POST /api/aib/simuler-aib
// POST /api/aib/verifier-exoneration
// POST /api/aib/estimer-avant-transaction
// POST /api/aib/verifier-pour-declaration
// POST /api/aib/simuler-retenue-negociation
// POST /api/aib/planifier-charges-fiscales
// POST /api/aib/reconstituer-pour-controle



router.post('/simuler-aib', AIBController.simuler);
router.post('/verifier-exoneration', AIBController.verifierExoneration);
router.post('/estimer-avant-transaction', AIBController.estimerAvantTransaction);
router.post('/verifier-pour-declaration', AIBController.verifierPourDeclaration);
router.post('/simuler-retenue-negociation', AIBController.simulerRetenuePourNegociation);
router.post('/planifier-charges-fiscales', AIBController.planifierChargesFiscales);
router.post('/reconstituer-pour-controle', AIBController.reconstituerPourControle);

export default router;
