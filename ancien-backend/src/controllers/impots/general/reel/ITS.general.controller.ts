import { Request, Response } from 'express';
import MoteurITS from '../../../../services/impots/general/reel/ITS.general';
import { GlobalEstimationInfoData } from '../../../../types/frontend.result.return.type';
import { BackendEstimationFailureResponse } from '../../../../types/frontend.errors.estomation.type';

export const calculerITS = (req: Request, res: Response): void => {
  try {
    const { salaireMensuel, periodeFiscale } = req.body;

    if (typeof salaireMensuel !== 'number' || salaireMensuel < 0) {
      res.status(400).json({
        error: 'Le salaire mensuel doit être un nombre positif.'
      });
      return;
    }

    const estimation: GlobalEstimationInfoData | BackendEstimationFailureResponse = MoteurITS.calculerITS(salaireMensuel, periodeFiscale);
    res.status(200).json(estimation);
  } catch (error) {
    res.status(500).json({
      error: 'Une erreur est survenue lors du calcul de l\'ITS.',
      details: error instanceof Error ? error.message : error
    });
  }
};
