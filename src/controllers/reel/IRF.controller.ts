// // Controller for IRF
// import { IRFService } from '../services/IRF.service';
// import { Request, Response } from 'express';
// import { ParametresCalculMensuel, ParametresCalculAnnuel, StatutFiscal, TransactionLoyer } from '../../services/impots/reel/IRF';

// export class IRFController {
//   private service = new IRFService();

//   // Calcul mensuel
//   static calculerMensuel(req: Request, res: Response): void {
//     try {
//       const params: ParametresCalculMensuel = req.body;
//       const resultat = IRFService.calculerMensuel(params);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul annuel
//   static calculerAnnuel(req: Request, res: Response): void {
//     try {
//       const params: ParametresCalculAnnuel = req.body;
//       const resultat = IRFService.calculerAnnuel(params);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul avec changement de statut
//   static calculerAvecChangementStatut(req: Request, res: Response): void {
//     try {
//       const { loyersMensuels, ancienStatut, nouveauStatut, moisChangement } = req.body;
//       const resultat = IRFService.calculerAvecChangementStatut(loyersMensuels, ancienStatut, nouveauStatut, moisChangement);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul loyers variables
//   static calculerLoyersVariables(req: Request, res: Response): void {
//     try {
//       const loyersEtStatuts = req.body;
//       const resultat = IRFService.calculerLoyersVariables(loyersEtStatuts);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul jusqu'à cession
//   static calculerJusquaCession(req: Request, res: Response): void {
//     try {
//       const { transactions, dateCession } = req.body;
//       const resultat = IRFService.calculerJusquaCession(transactions, new Date(dateCession));
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Évaluation rentabilité nette
//   static evaluerRentabiliteNet(req: Request, res: Response): void {
//     try {
//       const { loyerMensuel, statutFiscal, montantAchat, chargesAnnuelles } = req.body;
//       const resultat = IRFService.evaluerRentabiliteNet(loyerMensuel, statutFiscal, montantAchat, chargesAnnuelles);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Détection des retards
//   static detecterRetards(req: Request, res: Response): void {
//     try {
//       const transactions: TransactionLoyer[] = req.body;
//       const resultat = IRFService.detecterRetards(transactions);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Simulation contrat
//   static simulationContrat(req: Request, res: Response): void {
//     try {
//       const { loyerMensuel, statutFiscal } = req.body;
//       const resultat = IRFService.simulationContrat(loyerMensuel, statutFiscal);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Synthèse période
//   static synthesePeriode(req: Request, res: Response): void {
//     try {
//       const { transactions, dateDebut, dateFin } = req.body;
//       const resultat = IRFService.synthesePeriode(transactions, new Date(dateDebut), new Date(dateFin));
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }
// }
