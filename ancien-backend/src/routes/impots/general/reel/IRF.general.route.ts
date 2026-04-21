import { Router } from 'express';
import { calculerIRF } from '../../../../controllers/impots/general/reel/IRF.general.controller';

const router = Router();

/**
 * @route POST /api/irf
 * @desc Calculer l'IRF à partir du revenu locatif
 * @access Public
 */
router.post('/irf', calculerIRF);

export default router;
