// Routes for TVA
import express from 'express';
import { TVAController } from '../controllers/TVA.controller';

const router = express.Router();
const controller = new TVAController();

// TODO: define routes for TVA
// Example: router.get('/', controller.methodName);

export default router;
