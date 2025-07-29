import { Request, Response } from 'express';
import MoteurTFU from '../../../../services/impots/general/reel/TFU.general';
import { GlobalEstimationInfoData } from '../../../../types/frontend.result.return.type';
import { BackendEstimationFailureResponse } from '../../../../types/frontend.errors.estomation.type';

export const calculerTFU = (req: Request, res: Response): void => {
  try {
    const { departement, commune, arrondissement, categorie, squareMeters, periodeFiscale } = req.body;

    // Validation des données d'entrée
    if (!departement || !commune || !arrondissement || !categorie) {
      res.status(400).json({
        error: 'Les paramètres département, commune, arrondissement et catégorie sont obligatoires.'
      });
      return;
    }

    if (typeof squareMeters !== 'number' || squareMeters < 0) {
      res.status(400).json({
        error: 'La surface en mètres carrés doit être un nombre positif.'
      });
      return;
    }

    if (!periodeFiscale) {
      res.status(400).json({
        error: 'La période fiscale est obligatoire.'
      });
      return;
    }

    const estimation: GlobalEstimationInfoData | BackendEstimationFailureResponse = MoteurTFU.calculerTFU({
      departement,
      commune,
      arrondissement,
      categorie,
      squareMeters,
      periodeFiscale
    });

    res.status(200).json(estimation);
  } catch (error) {
    res.status(500).json({
      error: 'Une erreur est survenue lors du calcul de la TFU.',
      details: error instanceof Error ? error.message : error
    });
  }
};
