import { Request, Response } from 'express';
import  MoteurTPSimplifie from '../../../../services/impots/general/tps/TPS.general';
import { GlobalEstimationInfoData } from '../../../../types/frontend.result.return.type';

export const calculerTPS = (req: Request, res: Response): void => {
  try {
    const { chiffreAffaires } = req.body;

    if (typeof chiffreAffaires !== 'number' || chiffreAffaires < 0) {
      res.status(400).json({
        error: 'Le chiffre d’affaires doit être un nombre positif.'
      });
      return 
    }

    const estimation: GlobalEstimationInfoData = MoteurTPSimplifie.calculerTPS(chiffreAffaires);
    res.status(200).json(estimation);
  } catch (error) {
    res.status(500).json({
      error: 'Une erreur est survenue lors du calcul de la TPS.',
      details: error instanceof Error ? error.message : error
    });
  }
};
