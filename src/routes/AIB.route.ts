// Routes for AIB
// import express from 'express';
// import { AIBController } from '../controllers/AIB.controller';

// const router = express.Router();
// const controller = new AIBController();

// // TODO: define routes for AIB
// // Example: router.get('/', controller.methodName);

// export default router;




// routes/aib.routes.ts
import { Router } from 'express';
import { AIBController } from '../controllers/AIB.controller';

const router = Router();

router.post('/simuler-aib', AIBController.simuler);
router.post('/verifier-exoneration', AIBController.verifierExoneration);

export default router;
