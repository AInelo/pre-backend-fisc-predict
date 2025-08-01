import { Router } from 'express';
import { getProfil } from '../../controllers/common/profillage.controller';

const router = Router();

/**
 * @route POST /api/profilage/profil
 * @desc Obtenir le profil fiscal basé sur les données d'entreprise
 * @access Public
 */
router.post('/profilage/profil', getProfil);

export default router;
