// import { Request, Response } from 'express';
// import { AIBService } from '../services/AIB.service';
// import { ParametresAIB } from '../../services/impots/reel/AIB';

// export class AIBController {
//   /**
//    * Simule l'AIB à partir des paramètres passés dans le body.
//    */
//   static simuler(req: Request, res: Response): void {
//     try {
//       const params: ParametresAIB = req.body;

//       const resultat = AIBService.simulerAIB(params);
//       // const resume = AIBService.resumeCalcul(resultat);
//       // const montantFormate = AIBService.formaterMontantTotal(resultat);

//       res.json({
//         success: true,
//         resultat
//       });
//     } catch (error) {
//       res.status(400).json({
//         success: false,
//         message: 'Erreur lors de la simulation AIB',
//         error: error instanceof Error ? error.message : String(error)
//       });
//     }
//   }

//   /**
//    * Vérifie l'éligibilité à l'exonération (endpoint séparé).
//    */
//   static verifierExoneration(req: Request, res: Response): void {
//     try {
//       const { estNouvelleEntreprise, releveTPS, ancienneteEnMois } = req.body;

//       if (
//         typeof estNouvelleEntreprise !== 'boolean' ||
//         typeof releveTPS !== 'boolean' ||
//         typeof ancienneteEnMois !== 'number'
//       ) {
//         res.status(400).json({
//           success: false,
//           message: 'Paramètres invalides'
//         });
//         return
//       }

//       const estExonere = AIBService.estExonere(
//         estNouvelleEntreprise,
//         releveTPS,
//         ancienneteEnMois
//       );

//       res.json({ success: true, estExonere });
//     } catch (error) {
//       res.status(500).json({
//         success: false,
//         message: 'Erreur lors de la vérification',
//         error: error instanceof Error ? error.message : String(error)
//       });
//     }
//   }

//   /**
//    * Estimation avant transaction commerciale
//    */
//   static estimerAvantTransaction(req: Request, res: Response): void {
//     try {
//       const params: ParametresAIB = req.body;
//       const resultat = AIBService.estimerAvantTransaction(params);
//       res.json({ success: true, resultat });
//     } catch (error) {
//       res.status(400).json({
//         success: false,
//         message: 'Erreur lors de l\'estimation avant transaction',
//         error: error instanceof Error ? error.message : String(error)
//       });
//     }
//   }

//   /**
//    * Vérification lors de la déclaration fiscale (multi-opérations)
//    */
//   static verifierPourDeclaration(req: Request, res: Response): void {
//     try {
//       const operations: ParametresAIB[] = req.body;
//       const resultats = AIBService.verifierPourDeclaration(operations);
//       res.json({ success: true, resultats });
//     } catch (error) {
//       res.status(400).json({
//         success: false,
//         message: 'Erreur lors de la vérification pour déclaration',
//         error: error instanceof Error ? error.message : String(error)
//       });
//     }
//   }

//   /**
//    * Simulation en phase de négociation avec un client/public
//    */
//   static simulerRetenuePourNegociation(req: Request, res: Response): void {
//     try {
//       const params: ParametresAIB = req.body;
//       const resultat = AIBService.simulerRetenuePourNegociation(params);
//       res.json({ success: true, ...resultat });
//     } catch (error) {
//       res.status(400).json({
//         success: false,
//         message: 'Erreur lors de la simulation de retenue pour négociation',
//         error: error instanceof Error ? error.message : String(error)
//       });
//     }
//   }

//   /**
//    * Estimation pour planification financière (multi-mois / prévisions)
//    */
//   static planifierChargesFiscales(req: Request, res: Response): void {
//     try {
//       const previsions: ParametresAIB[] = req.body;
//       const resultat = AIBService.planifierChargesFiscales(previsions);
//       res.json({ success: true, ...resultat });
//     } catch (error) {
//       res.status(400).json({
//         success: false,
//         message: 'Erreur lors de la planification des charges fiscales',
//         error: error instanceof Error ? error.message : String(error)
//       });
//     }
//   }

//   /**
//    * Reconstitution pour contrôle fiscal ou audit
//    */
//   static reconstituerPourControle(req: Request, res: Response): void {
//     try {
//       const operations: ParametresAIB[] = req.body;
//       const resultat = AIBService.reconstituerPourControle(operations);
//       res.json({ success: true, ...resultat });
//     } catch (error) {
//       res.status(400).json({
//         success: false,
//         message: 'Erreur lors de la reconstitution pour contrôle',
//         error: error instanceof Error ? error.message : String(error)
//       });
//     }
//   }
// }
