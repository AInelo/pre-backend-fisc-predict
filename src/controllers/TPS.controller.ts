// Controller for TPS
import { TPSService } from '../services/TPS.service';
import { Request, Response } from 'express';
import type { ConfigurationTPS } from '../models/tps/TPS';

export class TPSController {
  private service = new TPSService();

  // Calcul principal TPS
  static calculerTPS(req: Request, res: Response): void {
    try {
      const config: ConfigurationTPS = req.body;
      const resultat = TPSService.calculerTPS(config);
      res.json({ success: true, resultat });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erreur serveur' });
    }
  }

  // Validation configuration
  static validerConfiguration(req: Request, res: Response): void {
    try {
      const config: ConfigurationTPS = req.body;
      const resultat = TPSService.validerConfiguration(config);
      res.json({ success: true, resultat });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erreur serveur' });
    }
  }

  // Génération rapport
  static genererRapport(req: Request, res: Response): void {
    try {
      const config: ConfigurationTPS = req.body;
      const resultat = TPSService.genererRapport(config);
      res.json({ success: true, resultat });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Erreur serveur' });
    }
  }

  // TODO: implement controller methods for TPS
}
