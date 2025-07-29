import { Router } from 'express';
import { calculerTFU } from '../../../../controllers/impots/general/reel/TFU.general.controller';

const router = Router();

/**
 * @route POST /api/tfu
 * @desc Calculer la TFU à partir des paramètres géographiques et de la surface
 * @access Public
 */
router.post('/tfu', calculerTFU);

export default router; 