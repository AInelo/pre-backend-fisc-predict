import { Request, Response } from 'express';
import MoteurTFU from '../../../../services/impots/general/reel/TFU.general';
import { GlobalEstimationInfoData } from '../../../../types/frontend.result.return.type';
import { BackendEstimationFailureResponse } from '../../../../types/frontend.errors.estomation.type';

interface TFUBatimentInfos {
  categorie: string;
  squareMeters: number;
}

interface TFUParcelleInfos {
  departement: string;
  commune: string;
  arrondissement: string;
  nbrBatiments: number;
  batiments: TFUBatimentInfos[];
  nbrPiscines: number;
}

interface TFUInput {
  periodeFiscale: string;
  nbrParcelles: number;
  parcelles: TFUParcelleInfos[];
}

export const calculerTFU = (req: Request, res: Response): void => {
  try {
    const { parcelles, periodeFiscale } = req.body;

    if (!periodeFiscale) {
      res.status(400).json({
        error: 'La période fiscale est obligatoire.'
      });
      return;
    }

    const parcellesArray = Array.isArray(parcelles)
      ? parcelles
      : parcelles
        ? [parcelles]
        : [];

    if (parcellesArray.length === 0) {
      res.status(400).json({
        error: 'Au moins une parcelle doit être fournie.'
      });
      return;
    }

    for (let parcelleIndex = 0; parcelleIndex < parcellesArray.length; parcelleIndex++) {
      const parcelle = parcellesArray[parcelleIndex];

      if (!parcelle?.departement || !parcelle?.commune || !parcelle?.arrondissement) {
        res.status(400).json({
          error: `Les paramètres département, commune et arrondissement sont obligatoires pour la parcelle ${parcelleIndex + 1}.`
        });
        return;
      }

      const batiments = Array.isArray(parcelle.batiments)
        ? parcelle.batiments
        : parcelle.batiments
          ? [parcelle.batiments]
          : [];

      if (batiments.length === 0) {
        res.status(400).json({
          error: `Au moins un bâtiment doit être fourni pour la parcelle ${parcelleIndex + 1}.`
        });
        return;
      }

      if (typeof parcelle.nbrBatiments === 'number' && parcelle.nbrBatiments >= 0 && parcelle.nbrBatiments !== batiments.length) {
        res.status(400).json({
          error: `Le nombre de bâtiments indiqué (${parcelle.nbrBatiments}) ne correspond pas au nombre de bâtiments fournis (${batiments.length}) pour la parcelle ${parcelleIndex + 1}.`
        });
        return;
      }

      for (let batimentIndex = 0; batimentIndex < batiments.length; batimentIndex++) {
        const batiment = batiments[batimentIndex];
        if (!batiment?.categorie) {
          res.status(400).json({
            error: `La catégorie est obligatoire pour le bâtiment ${batimentIndex + 1} de la parcelle ${parcelleIndex + 1}.`
          });
          return;
        }

        if (typeof batiment.squareMeters !== 'number' || batiment.squareMeters < 0) {
          res.status(400).json({
            error: `La surface du bâtiment ${batimentIndex + 1} de la parcelle ${parcelleIndex + 1} doit être un nombre positif.`
          });
          return;
        }
      }

      if (parcelle.nbrPiscines !== undefined && parcelle.nbrPiscines !== null) {
        if (typeof parcelle.nbrPiscines !== 'number' || parcelle.nbrPiscines < 0) {
          res.status(400).json({
            error: `Le nombre de piscines doit être un nombre positif pour la parcelle ${parcelleIndex + 1}.`
          });
          return;
        }
      }
    }

    const tfuInput: TFUInput = {
      periodeFiscale,
      nbrParcelles: parcellesArray.length,
      parcelles: parcellesArray.map((parcelle: any) => {
        const batimentsArray = Array.isArray(parcelle.batiments)
          ? parcelle.batiments
          : [parcelle.batiments];

        const sanitizedBatiments: TFUBatimentInfos[] = batimentsArray.map((batiment: any) => ({
          categorie: batiment.categorie,
          squareMeters: batiment.squareMeters
        }));

        return {
          departement: parcelle.departement,
          commune: parcelle.commune,
          arrondissement: parcelle.arrondissement,
          nbrBatiments: parcelle.nbrBatiments ?? sanitizedBatiments.length,
          batiments: sanitizedBatiments,
          nbrPiscines: parcelle.nbrPiscines ?? 0
        };
      })
    };

    const estimation: GlobalEstimationInfoData | BackendEstimationFailureResponse = MoteurTFU.calculerTFU(tfuInput);

    res.status(200).json(estimation);
  } catch (error) {
    res.status(500).json({
      error: 'Une erreur est survenue lors du calcul de la TFU.',
      details: error instanceof Error ? error.message : error
    });
  }
};
