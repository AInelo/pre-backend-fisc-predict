import { Router } from 'express';
import { summarizeEstimation, getEstimationStats } from '../../controllers/common/summurize.controller';

const router = Router();

/**
 * @route POST /api/estimation/summarize
 * @desc Générer un résumé des données d'estimation fiscale pour le chatbot
 * @access Public
 * @body {
 *   estimationData: GlobalEstimationInfoData,
 *   format?: 'detailed' | 'compact'
 * }
 * @returns {
 *   success: boolean,
 *   summary: string,
 *   characterCount: number,
 *   format: string
 * }
 */
router.post('/estimation/summarize', summarizeEstimation);

/**
 * @route POST /api/estimation/stats
 * @desc Obtenir les statistiques et recommandations sur les données d'estimation
 * @access Public
 * @body {
 *   estimationData: GlobalEstimationInfoData
 * }
 * @returns {
 *   success: boolean,
 *   totalEstimation: number,
 *   currency: string,
 *   dataStructure: object,
 *   summaryStats: object,
 *   recommendations: object
 * }
 */
router.post('/estimation/stats', getEstimationStats);

export default router;