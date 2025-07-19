// // Controller for ITS
// import { ITSService } from '../services/ITS.service';
// import { Request, Response } from 'express';
// import { ParametresITS } from '../../services/impots/reel/ITS';

// export class ITSController {
//   private service = new ITSService();

//   // Calcul ITS principal
//   static calculerITS(req: Request, res: Response): void {
//     try {
//       const params: ParametresITS = req.body;
//       const resultat = ITSService.calculerITS(params);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul annuel
//   static calculerITSAnnuel(req: Request, res: Response): void {
//     try {
//       const { salaireBrutMensuel } = req.body;
//       const resultat = ITSService.calculerITSAnnuel(salaireBrutMensuel);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul ITS par période
//   static calculerITSParPeriode(req: Request, res: Response): void {
//     try {
//       const { salaireBrutMensuel, moisDebut, moisFin } = req.body;
//       const resultat = ITSService.calculerITSParPeriode(salaireBrutMensuel, moisDebut, moisFin);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul scénarios
//   static calculerScenariosITS(req: Request, res: Response): void {
//     try {
//       const { salaireBruts, mois } = req.body;
//       const resultat = ITSService.calculerScenariosITS(salaireBruts, mois);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Vérification prélèvement
//   static verifierPrelevementITS(req: Request, res: Response): void {
//     try {
//       const { salaireBrut, mois, montantPreleve } = req.body;
//       const resultat = ITSService.verifierPrelevementITS(salaireBrut, mois, montantPreleve);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Estimation revenu net
//   static estimerRevenuNet(req: Request, res: Response): void {
//     try {
//       const { salaireBrut, mois } = req.body;
//       const resultat = ITSService.estimerRevenuNet(salaireBrut, mois);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul ITS avec changement
//   static calculerITSAvecChangement(req: Request, res: Response): void {
//     try {
//       const { salaireBrutAvant, moisAvantFin, salaireBrutApres, moisApresDebut } = req.body;
//       const resultat = ITSService.calculerITSAvecChangement(salaireBrutAvant, moisAvantFin, salaireBrutApres, moisApresDebut);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul revenu net sur période
//   static calculerRevenuNetSurPeriode(req: Request, res: Response): void {
//     try {
//       const { salaireBrutMensuel, moisDebut, moisFin } = req.body;
//       const resultat = ITSService.calculerRevenuNetSurPeriode(salaireBrutMensuel, moisDebut, moisFin);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }
// }
