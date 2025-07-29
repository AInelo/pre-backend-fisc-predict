import { Request, Response } from 'express';
import MoteurIRF from '../../../../services/impots/general/reel/IRF.general';
import { GlobalEstimationInfoData } from '../../../../types/frontend.result.return.type';
import { BackendEstimationFailureResponse } from '../../../../types/frontend.errors.estomation.type';

export const calculerIRF = (req: Request, res: Response): void => {
  try {
    const { revenuLocatif, isAlreadyTaxed, periodeFiscale } = req.body;

    // Validation des données d'entrée
    if (typeof revenuLocatif !== 'number' || revenuLocatif <= 0) {
      res.status(400).json({
        error: 'Le revenu locatif doit être un montant positif.'
      });
      return;
    }

    if (typeof isAlreadyTaxed !== 'boolean') {
      res.status(400).json({
        error: 'Le paramètre isAlreadyTaxed doit être un booléen (true/false).'
      });
      return;
    }

    if (!periodeFiscale) {
      res.status(400).json({
        error: 'La période fiscale est obligatoire.'
      });
      return;
    }

    const estimation: GlobalEstimationInfoData | BackendEstimationFailureResponse = MoteurIRF.calculerIRF({
      revenuLocatif,
      isAlreadyTaxed,
      periodeFiscale
    });

    res.status(200).json(estimation);
  } catch (error) {
    res.status(500).json({
      error: 'Une erreur est survenue lors du calcul de l\'IRF.',
      details: error instanceof Error ? error.message : error
    });
  }
};
