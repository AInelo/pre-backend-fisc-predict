import { Router } from 'express';
import { 
    calculerEstimationGlobale, 
    getImpotsDisponibles, 
    getImpotDetails 
} from '../../../controllers/impots/general/entreprise.general.estimation.controller';

const router = Router();

/**
 * @route POST /api/general/entreprise/estimation-globale
 * @desc Calcule l'estimation globale de tous les impôts pour une entreprise
 * @access Public
 * @body {
 *   "dataImpot": {
 *     "AIB": { "aibCollected": 1000000, "aibGranted": 500000, "periodeFiscale": "2025" },
 *     "IS": { "chiffreAffaire": 50000000, "charges": 30000000, "secteur": "general", "periodeFiscale": "2025" }
 *   }
 * }
 */
router.post('/entreprise/estimation-globale', calculerEstimationGlobale);

/**
 * @route GET /api/general/entreprise/impots-disponibles
 * @desc Récupère la liste des impôts disponibles pour le calcul
 * @access Public
 */
router.get('/entreprise/impots-disponibles', getImpotsDisponibles);

/**
 * @route GET /api/general/entreprise/impot/:code
 * @desc Récupère les informations détaillées d'un impôt spécifique
 * @access Public
 * @param {string} code - Code de l'impôt (ex: AIB, IS, TFU, etc.)
 */
router.get('/entreprise/impot/:code', getImpotDetails);

export default router;
