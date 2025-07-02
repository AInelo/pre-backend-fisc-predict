// // Routes for IRCM
// import express from 'express';
// import { IRCMController } from '../controllers/IRCM.controller';

// const router = express.Router();
// const controller = new IRCMController();

// // TODO: define routes for IRCM
// // Example: router.get('/', controller.methodName);

// export default router;


import { Router } from 'express';
import { IRCMController } from '../controllers/IRCM.controller';

const router = Router();

router.post('/simuler', IRCMController.simulerIRCM);
router.post('/simuler-dividende', IRCMController.simulerDividende);
router.post('/simuler-obligation-uemoa', IRCMController.simulerObligationUEMOA);

export default router;
