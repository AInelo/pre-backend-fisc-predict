import { Request, Response } from 'express';
import MoteurProfillage from '../../services/common/profillage.service';
import { ProfilingData } from '../../types/profilage.result.return.type';
import { BackendEstimationFailureResponse } from '../../types/frontend.errors.estomation.type';

export const getProfil = (req: Request, res: Response): void => {
  try {
    const { periodeFiscale, chiffreAffaire, typeContribuableEntreprise, dateDebutExercice } = req.body;

    // Validation des données d'entrée
    if (!periodeFiscale || !typeContribuableEntreprise || !dateDebutExercice) {
      res.status(400).json({
        error: 'Les champs periodeFiscale, typeContribuableEntreprise et dateDebutExercice sont obligatoires.'
      });
      return;
    }

    if (typeof chiffreAffaire !== 'number' || chiffreAffaire < 0) {
      res.status(400).json({
        error: 'Le chiffre d\'affaires doit être un nombre positif.'
      });
      return;
    }

    // Validation des données avec le service
    const donneesProfilage = {
      periodeFiscale,
      chiffreAffaire,
      typeContribuableEntreprise,
      dateDebutExercice
    };

    if (!MoteurProfillage.validerDonneesProfilage(donneesProfilage)) {
      res.status(400).json({
        error: 'Les données de profilage ne sont pas valides.'
      });
      return;
    }

    // Obtention du profil fiscal
    const resultat = MoteurProfillage.getProfil(donneesProfilage);
    
    // Vérifier si c'est une erreur ou un succès
    if ('success' in resultat && !resultat.success) {
        // C'est une erreur
        res.status(400).json(resultat);
    } else {
        // C'est un succès
        res.status(200).json(resultat);
    }
  } catch (error) {
    res.status(500).json({
      error: 'Une erreur est survenue lors de la génération du profil fiscal.',
      details: error instanceof Error ? error.message : error
    });
  }
};
