// // Controller for PATENTE
// import { PATENTEService } from '../services/PATENTE.service';
// import { Request, Response } from 'express';
// import { DonneesPatente } from '../../services/impots/reel/PATENTE';

// export class PATENTEController {
//   private service = new PATENTEService();

//   // Calcul principal
//   static calculerPatente(req: Request, res: Response): void {
//     try {
//       const donnees: DonneesPatente = req.body;
//       const resultat = PATENTEService.calculerPatente(donnees);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Estimation création entreprise
//   static estimerCreationEntreprise(req: Request, res: Response): void {
//     try {
//       const donnees: DonneesPatente = req.body;
//       const resultat = PATENTEService.estimerCreationEntreprise(donnees);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Estimation déclaration annuelle
//   static estimerDeclarationAnnuelle(req: Request, res: Response): void {
//     try {
//       const donnees: DonneesPatente = req.body;
//       const resultat = PATENTEService.estimerDeclarationAnnuelle(donnees);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Estimation patente complémentaire
//   static estimerPatenteComplementaire(req: Request, res: Response): void {
//     try {
//       const donnees: DonneesPatente = req.body;
//       const resultat = PATENTEService.estimerPatenteComplementaire(donnees);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Estimation patente supplémentaire
//   static estimerPatenteSupplementaire(req: Request, res: Response): void {
//     try {
//       const donnees: DonneesPatente = req.body;
//       const resultat = PATENTEService.estimerPatenteSupplementaire(donnees);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Estimation pour zone
//   static estimerPourZone(req: Request, res: Response): void {
//     try {
//       const donnees: DonneesPatente = req.body;
//       const resultat = PATENTEService.estimerPourZone(donnees);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Estimation fin d'exonération
//   static estimerFinExoneration(req: Request, res: Response): void {
//     try {
//       const donnees: DonneesPatente = req.body;
//       const resultat = PATENTEService.estimerFinExoneration(donnees);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }
// }
