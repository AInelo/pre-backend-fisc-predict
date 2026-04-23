import { Router } from 'express';
import {
  getAnneesDisponibles,
  getImpotsParAnneeEtType,
  createImpot,
  updateImpot,
} from '@/controllers/fiscal-parameters/fiscal-parameters.controller';
import { requireAuth } from '@/middlewares/auth.middleware';

const router = Router();

// GET /api/fiscal/annees-disponibles
router.get('/annees-disponibles', getAnneesDisponibles);

// POST /api/fiscal/impots
router.post('/impots', getImpotsParAnneeEtType);

// POST /api/fiscal/impots/create  — protégé
router.post('/impots/create', requireAuth, createImpot);

// PUT /api/fiscal/impots/:codeImpot  — protégé
router.put('/impots/:codeImpot', requireAuth, updateImpot);

export default router;
