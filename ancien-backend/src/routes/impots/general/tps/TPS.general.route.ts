import { Router } from 'express';
import { calculerTPS } from '../../../../controllers/impots/general/tps/TPS.general.controller';

const router = Router();

/**
 * @route POST /api/tps
 * @desc Calculer la TPS à partir du chiffre d’affaires
 * @access Public
 */
router.post('/tps', calculerTPS);

export default router;
