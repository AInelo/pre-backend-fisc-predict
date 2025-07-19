// // Controller for VPS
// import { VPSService } from '../services/VPS.service';
// import { Request, Response } from 'express';
// import { Entreprise, Salarie } from '../../services/impots/reel/VPS';

// export class VPSController {
//   private service = new VPSService();

//   // Calcul principal du VPS
//   static calculerVPS(req: Request, res: Response): void {
//     try {
//       const { entreprise, salaries, dateCalcul } = req.body;
//       const resultat = VPSService.calculerVPS(entreprise, salaries, dateCalcul ? new Date(dateCalcul) : undefined);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // TODO: implement controller methods for VPS
// }
