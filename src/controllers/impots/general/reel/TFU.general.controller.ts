import { Request, Response } from 'express';
import MoteurTFU from '../../../../services/impots/general/reel/TFU.general';
import { GlobalEstimationInfoData } from '../../../../types/frontend.result.return.type';
import { BackendEstimationFailureResponse } from '../../../../types/frontend.errors.estomation.type';

// Interface pour les données TFU
interface TFUInput {
  departement: string;
  commune: string;
  arrondissement: string;
  categorie: string;
  squareMeters: number;
  periodeFiscale: string;
}

export const calculerTFU = (req: Request, res: Response): void => {
  try {
    const { proprietes, periodeFiscale } = req.body;

    // Validation de la période fiscale
    if (!periodeFiscale) {
      res.status(400).json({
        error: 'La période fiscale est obligatoire.'
      });
      return;
    }

    // Vérifier si on a une seule propriété ou un tableau de propriétés
    let tfuInput: TFUInput | TFUInput[];

    if (Array.isArray(proprietes)) {
      // Cas d'un tableau de propriétés
      if (proprietes.length === 0) {
        res.status(400).json({
          error: 'Au moins une propriété doit être fournie.'
        });
        return;
      }

      // Validation de chaque propriété dans le tableau
      for (let i = 0; i < proprietes.length; i++) {
        const prop = proprietes[i];
        if (!prop.departement || !prop.commune || !prop.arrondissement || !prop.categorie) {
          res.status(400).json({
            error: `Les paramètres département, commune, arrondissement et catégorie sont obligatoires pour la propriété ${i + 1}.`
          });
          return;
        }

        if (typeof prop.squareMeters !== 'number' || prop.squareMeters < 0) {
          res.status(400).json({
            error: `La surface en mètres carrés doit être un nombre positif pour la propriété ${i + 1}.`
          });
          return;
        }
      }

      tfuInput = proprietes.map(prop => ({
        ...prop,
        periodeFiscale
      }));
    } else {
      // Cas d'une seule propriété
      const { departement, commune, arrondissement, categorie, squareMeters } = proprietes;

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

      tfuInput = {
        departement,
        commune,
        arrondissement,
        categorie,
        squareMeters,
        periodeFiscale
      };
    }

    const estimation: GlobalEstimationInfoData | BackendEstimationFailureResponse = MoteurTFU.calculerTFU(tfuInput);

    res.status(200).json(estimation);
  } catch (error) {
    res.status(500).json({
      error: 'Une erreur est survenue lors du calcul de la TFU.',
      details: error instanceof Error ? error.message : error
    });
  }
};
