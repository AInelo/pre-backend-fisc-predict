
import { Request, Response } from 'express';
import { AIBService } from '../services/AIB.service';
import { ParametresAIB } from '../models/AIB';

export class AIBController {
  /**
   * Simule l'AIB à partir des paramètres passés dans le body.
   */
  static simuler(req: Request, res: Response): void {
    try {
      const params: ParametresAIB = req.body;

      const resultat = AIBService.simulerAIB(params);
      const resume = AIBService.resumeCalcul(resultat);
      const montantFormate = AIBService.formaterMontantTotal(resultat);

      res.json({
        success: true,
        resultat,
        resume,
        montantFormate
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Erreur lors de la simulation AIB',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Vérifie l'éligibilité à l'exonération (endpoint séparé).
   */
  static verifierExoneration(req: Request, res: Response): void {
    try {
      const { estNouvelleEntreprise, releveTPS, ancienneteEnMois } = req.body;

      if (
        typeof estNouvelleEntreprise !== 'boolean' ||
        typeof releveTPS !== 'boolean' ||
        typeof ancienneteEnMois !== 'number'
      ) {
        res.status(400).json({
          success: false,
          message: 'Paramètres invalides'
        });
        return
      }

      const estExonere = AIBService.estExonere(
        estNouvelleEntreprise,
        releveTPS,
        ancienneteEnMois
      );

      res.json({ success: true, estExonere });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
