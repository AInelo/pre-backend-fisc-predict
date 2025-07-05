// Routes for VPS
import express from 'express';
import { VPSController } from '../controllers/VPS.controller';

const router = express.Router();
const controller = new VPSController();

// TODO: define routes for VPS
// Example: router.get('/', controller.methodName);

router.post('/calculer', VPSController.calculerVPS);

export default router;
