// Controller for IS
import { ISService } from '../services/IS.service';
import { Request, Response } from 'express';
import { DonneesFiscales } from '../models/reel/IS';

export class ISController {
  private service = new ISService();

  // Calcul IS principal
  static calculerIS(req: Request, res: Response): void {
    try {
      const donnees: DonneesFiscales = req.body;
      const resultat = ISService.calculerIS(donnees);
      res.json({ success: true, resultat });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erreur serveur' });
    }
  }

  // Création entreprise
  static calculerCreationEntreprise(req: Request, res: Response): void {
    try {
      const donnees: DonneesFiscales = req.body;
      const resultat = ISService.calculerCreationEntreprise(donnees);
      res.json({ success: true, resultat });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erreur serveur' });
    }
  }

  // Simulation financière
  static calculerSimulationFinanciere(req: Request, res: Response): void {
    try {
      const donnees: DonneesFiscales = req.body;
      const resultat = ISService.calculerSimulationFinanciere(donnees);
      res.json({ success: true, resultat });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erreur serveur' });
    }
  }

  // Déclaration fiscale
  static calculerDeclarationFiscale(req: Request, res: Response): void {
    try {
      const donnees: DonneesFiscales = req.body;
      const resultat = ISService.calculerDeclarationFiscale(donnees);
      res.json({ success: true, resultat });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erreur serveur' });
    }
  }

  // Impact exonération
  static calculerImpactExoneration(req: Request, res: Response): void {
    try {
      const donnees: DonneesFiscales = req.body;
      const resultat = ISService.calculerImpactExoneration(donnees);
      res.json({ success: true, resultat });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erreur serveur' });
    }
  }

  // Bilan/audit fiscal
  static calculerBilanAuditFiscal(req: Request, res: Response): void {
    try {
      const donnees: DonneesFiscales = req.body;
      const resultat = ISService.calculerBilanAuditFiscal(donnees);
      res.json({ success: true, resultat });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erreur serveur' });
    }
  }

  // Reprise/cession
  static calculerRepriseCession(req: Request, res: Response): void {
    try {
      const { donnees, dureeActivite } = req.body;
      const resultat = ISService.calculerRepriseCession(donnees, dureeActivite);
      res.json({ success: true, resultat });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erreur serveur' });
    }
  }
}
