import { Request, Response } from 'express';
import { EstimationSummarizer } from '../../services/common/summurize.service';
import { GlobalEstimationInfoData } from '../../types/frontend.result.return.type';

// Interface pour la requête
interface SummarizeEstimationRequest {
  estimationData: GlobalEstimationInfoData;
  format?: 'detailed' | 'compact'; // Format de résumé souhaité
}

// Interface pour la réponse de succès
interface SummarizeEstimationResponse {
  success: true;
  summary: string;
  characterCount: number;
  format: 'detailed' | 'compact';
}

// Interface pour la réponse d'erreur
interface SummarizeEstimationError {
  success: false;
  error: string;
  details?: string;
}

export const summarizeEstimation = (req: Request, res: Response): void => {
  try {
    const { estimationData, format = 'detailed' }: SummarizeEstimationRequest = req.body;

    // Validation des données d'entrée
    if (!estimationData) {
      res.status(400).json({
        success: false,
        error: 'Le champ estimationData est obligatoire.'
      } as SummarizeEstimationError);
      return;
    }

    // Validation de la structure minimale des données d'estimation
    if (!validateEstimationData(estimationData)) {
      res.status(400).json({
        success: false,
        error: 'Les données d\'estimation ne sont pas valides. Vérifiez la structure des données.'
      } as SummarizeEstimationError);
      return;
    }

    // Validation du format
    if (format && !['detailed', 'compact'].includes(format)) {
      res.status(400).json({
        success: false,
        error: 'Le format doit être "detailed" ou "compact".'
      } as SummarizeEstimationError);
      return;
    }

    // Création du service de résumé
    const summarizer = new EstimationSummarizer();
    
    // Génération du résumé selon le format demandé
    let summary: string;
    
    if (format === 'compact') {
      summary = summarizer.summarizeCompact(estimationData);
    } else {
      summary = summarizer.summarize(estimationData);
    }

    // Vérification de la taille du résumé
    if (summary.length > 2000) {
      // Fallback vers le format compact si le résumé détaillé est trop long
      summary = summarizer.summarizeCompact(estimationData);
    }

    // Réponse de succès
    const response: SummarizeEstimationResponse = {
      success: true,
      summary,
      characterCount: summary.length,
      format: format as 'detailed' | 'compact'
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Erreur lors du résumé d\'estimation:', error);
    
    const errorResponse: SummarizeEstimationError = {
      success: false,
      error: 'Une erreur est survenue lors de la génération du résumé d\'estimation.',
      details: error instanceof Error ? error.message : String(error)
    };

    res.status(500).json(errorResponse);
  }
};

/**
 * Valide la structure minimale des données d'estimation
 */
function validateEstimationData(data: any): data is GlobalEstimationInfoData {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Vérification des champs obligatoires
  if (typeof data.totalEstimation !== 'number' || 
      typeof data.totalEstimationCurrency !== 'string') {
    return false;
  }

  // Vérification de la présence d'au moins une des sections de données
  const hasVariables = data.VariableEnter && 
    (Array.isArray(data.VariableEnter) || typeof data.VariableEnter === 'object');
  
  const hasImpots = data.impotDetailCalcule && 
    (Array.isArray(data.impotDetailCalcule) || typeof data.impotDetailCalcule === 'object');
  
  const hasObligations = data.obligationEcheance && 
    (Array.isArray(data.obligationEcheance) || typeof data.obligationEcheance === 'object');
  
  const hasInfos = data.infosSupplementaires && 
    (Array.isArray(data.infosSupplementaires) || typeof data.infosSupplementaires === 'object');

  const hasConfig = data.impotConfig && 
    (typeof data.impotConfig === 'object');

  // Au moins une section doit être présente
  return hasVariables || hasImpots || hasObligations || hasInfos || hasConfig;
}

/**
 * Endpoint pour obtenir des statistiques sur les données d'estimation
 * Utile pour débugger ou comprendre la taille des données
 */
export const getEstimationStats = (req: Request, res: Response): void => {
  try {
    const { estimationData }: { estimationData: GlobalEstimationInfoData } = req.body;

    if (!estimationData) {
      res.status(400).json({
        success: false,
        error: 'Le champ estimationData est obligatoire.'
      });
      return;
    }

    if (!validateEstimationData(estimationData)) {
      res.status(400).json({
        success: false,
        error: 'Les données d\'estimation ne sont pas valides.'
      });
      return;
    }

    const summarizer = new EstimationSummarizer();
    
    // Génération des deux formats pour comparaison
    const detailedSummary = summarizer.summarize(estimationData);
    const compactSummary = summarizer.summarizeCompact(estimationData);

    // Calcul des statistiques
    const stats = {
      success: true,
      totalEstimation: estimationData.totalEstimation,
      currency: estimationData.totalEstimationCurrency,
      dataStructure: {
        variables: getItemCount(estimationData.VariableEnter),
        impots: getItemCount(estimationData.impotDetailCalcule),
        obligations: getItemCount(estimationData.obligationEcheance),
        infos: getItemCount(estimationData.infosSupplementaires),
        hasConfig: !!estimationData.impotConfig
      },
      summaryStats: {
        detailed: {
          length: detailedSummary.length,
          withinLimit: detailedSummary.length <= 2000
        },
        compact: {
          length: compactSummary.length,
          withinLimit: compactSummary.length <= 2000
        }
      },
      recommendations: {
        suggestedFormat: detailedSummary.length <= 2000 ? 'detailed' : 'compact',
        reason: detailedSummary.length <= 2000 
          ? 'Le format détaillé respecte la limite de caractères' 
          : 'Le format compact est recommandé car le format détaillé dépasse la limite'
      }
    };

    res.status(200).json(stats);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur lors du calcul des statistiques.',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Fonction utilitaire pour compter les éléments
 */
function getItemCount(items: any[] | Record<string, any[]> | undefined): number {
  if (!items) return 0;
  if (Array.isArray(items)) return items.length;
  return Object.values(items).flat().length;
}