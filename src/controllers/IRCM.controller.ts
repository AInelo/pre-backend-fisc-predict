// Controller for IRCM
// import { IRCMService } from '../services/IRCM.service';

// export class IRCMController {
//   private service = new IRCMService();

//   // TODO: implement controller methods for IRCM
// }


import { Request, Response } from 'express'; // si tu utilises Express
import {
  IRCMService,
  ParametresIRCM,
  Statut,
  TypeRevenu,
  NatureTitre,
  Emetteur,
} from '../services/IRCM.service'; // adapte le chemin si besoin

export class IRCMController {
  /**
   * POST /api/ircm/simuler
   * Body JSON attendu: ParametresIRCM
   */
  static simulerIRCM(req: Request, res: Response) {
    try {
      const params: ParametresIRCM = req.body;

      // Optionnel : validation minimale des enums
      if (!Object.values(Statut).includes(params.statut)) {
        res.status(400).json({ error: 'Statut invalide' });
        return
      }
      if (!Object.values(TypeRevenu).includes(params.typeRevenu)) {
        res.status(400).json({ error: 'TypeRevenu invalide' });

        return
      }
      if (!Object.values(NatureTitre).includes(params.natureTitre)) {
        res.status(400).json({ error: 'NatureTitre invalide' });
        return
      }
      if (!Object.values(Emetteur).includes(params.emetteur)) {
        res.status(400).json({ error: 'Emetteur invalide' });

        return
      }

      const resultat = IRCMService.simulerIRCM(params);
      res.json(resultat);
      return
    } catch (error: any) {
       res.status(500).json({ error: error.message || 'Erreur serveur' });
       return
    }
  }

  /**
   * POST /api/ircm/simuler-dividende
   * Body JSON: { revenuBrut, statut, natureTitre, tauxConvention? }
   */
  static simulerDividende(req: Request, res: Response) {
    try {
      const { revenuBrut, statut, natureTitre, tauxConvention } = req.body;

      if (typeof revenuBrut !== 'number' || revenuBrut < 0) {
        res.status(400).json({ error: 'Revenu brut invalide' });
        return
      }
      if (!Object.values(Statut).includes(statut)) {
        res.status(400).json({ error: 'Statut invalide' });
        return
      }
      if (!Object.values(NatureTitre).includes(natureTitre)) {
        res.status(400).json({ error: 'NatureTitre invalide' });
        return
      }

      const resultat = IRCMService.simulerDividende(revenuBrut, statut, natureTitre, tauxConvention);
      res.json(resultat);
      return
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Erreur serveur' });
      return 
    }
  }

  /**
   * POST /api/ircm/simuler-obligation-uemoa
   * Body JSON: { revenuBrut, dureeEmission }
   */
  static simulerObligationUEMOA(req: Request, res: Response) {
    try {
      const { revenuBrut, dureeEmission } = req.body;

      if (typeof revenuBrut !== 'number' || revenuBrut < 0) {
         res.status(400).json({ error: 'Revenu brut invalide' });
         return
      }
      if (typeof dureeEmission !== 'number' || dureeEmission < 0) {
         res.status(400).json({ error: 'Durée émission invalide' });
         return
      }

      const resultat = IRCMService.simulerObligationUEMOA(revenuBrut, dureeEmission);
       res.json(resultat);
       return
    } catch (error: any) {
       res.status(500).json({ error: error.message || 'Erreur serveur' });
       return
    }
  }
}
