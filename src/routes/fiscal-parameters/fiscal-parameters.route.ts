import { Router } from 'express';
import {
  getAnneesDisponibles,
  getImpotsParAnneeEtType,
} from '@/controllers/fiscal-parameters/fiscal-parameters.controller';

const router = Router();

// GET /api/fiscal/annees-disponibles
router.get('/annees-disponibles', getAnneesDisponibles);

// POST /api/fiscal/impots
router.post('/impots', getImpotsParAnneeEtType);

export default router;
