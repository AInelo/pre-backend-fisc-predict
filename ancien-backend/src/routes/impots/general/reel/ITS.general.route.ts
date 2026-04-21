import { Router } from 'express';
import { calculerITS } from '../../../../controllers/impots/general/reel/ITS.general.controller';

const router = Router();

/**
 * @route POST /api/its
 * @desc Calculer l'ITS à partir du salaire mensuel
 * @access Public
 */
router.post('/its', calculerITS);

export default router;
