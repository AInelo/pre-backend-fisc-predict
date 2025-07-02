// Routes for TPS
import express from 'express';
import { TPSController } from '../controllers/TPS.controller';

const router = express.Router();
const controller = new TPSController();

// TODO: define routes for TPS
// Example: router.get('/', controller.methodName);

export default router;
