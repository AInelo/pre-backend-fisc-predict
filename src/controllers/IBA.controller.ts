// Controller for IBA
import { IBAService } from '../services/IBA.service';
import { Request, Response } from 'express';
import { DonneesIBA } from '../models/reel/IBA';

export class IBAController {
  private service = new IBAService();

  // Méthode principale de calcul IBA
  static calculerIBA(req: Request, res: Response): void {
    try {
      const donnees: DonneesIBA = req.body;
      const resultat = IBAService.calculerIBA(donnees);
      res.json({ success: true, resultat });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Erreur lors du calcul de l'IBA",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Estimation proportionnelle
  static estimerIBAProportionnel(req: Request, res: Response): void {
    try {
      const { donnees, dureeEnMois } = req.body;
      const resultat = IBAService.estimerIBAProportionnel(donnees, dureeEnMois);
      res.json({ success: true, resultat });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Erreur lors de l'estimation proportionnelle",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Simulation réduction
  static simulerReduction(req: Request, res: Response): void {
    try {
      const donnees: DonneesIBA = req.body;
      const resultat = IBAService.simulerReduction(donnees);
      res.json({ success: true, resultat });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Erreur lors de la simulation de réduction",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Vérification éligibilité régime réel
  static verifierEligibiliteRegimeReel(req: Request, res: Response): void {
    try {
      const donnees: DonneesIBA = req.body;
      const resultat = IBAService.verifierEligibiliteRegimeReel(donnees);
      res.json({ success: true, resultat });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Erreur lors de la vérification d'éligibilité au régime réel",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Simulation business plan
  static simulerBusinessPlan(req: Request, res: Response): void {
    try {
      const { donnees, dureeEnMois } = req.body;
      const resultat = IBAService.simulerBusinessPlan(donnees, dureeEnMois);
      res.json({ success: true, resultat });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Erreur lors de la simulation business plan",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Vérification cohérence audit
  static verifierCoherenceAudit(req: Request, res: Response): void {
    try {
      const { donnees, ibaDeclare } = req.body;
      const resultat = IBAService.verifierCoherenceAudit(donnees, ibaDeclare);
      res.json({ success: true, resultat });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: "Erreur lors de la vérification de cohérence audit",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
