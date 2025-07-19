// // Controller for TVA
// import { TVAService } from '../services/TVA.service';
// import { Request, Response } from 'express';
// import { Entreprise, Produit, Operation, FactureLigne, ResultatTVA } from '../../services/impots/reel/TVA';

// export class TVAController {
//   private service = new TVAService();

//   // Vérification assujettissement
//   static estAssujetti(req: Request, res: Response): void {
//     try {
//       const entreprise: Entreprise = req.body;
//       const resultat = TVAService.estAssujetti(entreprise);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul taux
//   static obtenirTaux(req: Request, res: Response): void {
//     try {
//       const produit: Produit = req.body;
//       const resultat = TVAService.obtenirTaux(produit);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul TVA sur opération
//   static calculerTVAOperation(req: Request, res: Response): void {
//     try {
//       const { baseImposable, produit } = req.body;
//       const resultat = TVAService.calculerTVAOperation(baseImposable, produit);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul prix TTC
//   static calculerPrixTTC(req: Request, res: Response): void {
//     try {
//       const { prixHT, produit } = req.body;
//       const resultat = TVAService.calculerPrixTTC(prixHT, produit);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul TVA collectée
//   static calculerTVACollectee(req: Request, res: Response): void {
//     try {
//       const ventes: Operation[] = req.body;
//       const resultat = TVAService.calculerTVACollectee(ventes);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul TVA déductible
//   static calculerTVADeductible(req: Request, res: Response): void {
//     try {
//       const achats: Operation[] = req.body;
//       const resultat = TVAService.calculerTVADeductible(achats);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul TVA due
//   static calculerTVADue(req: Request, res: Response): void {
//     try {
//       const { ventes, achats } = req.body;
//       const resultat = TVAService.calculerTVADue(ventes, achats);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul pénalités
//   static calculerPenalites(req: Request, res: Response): void {
//     try {
//       const { jourDeclaration, tvaDue, penaliteBase, tauxPenalite } = req.body;
//       const resultat = TVAService.calculerPenalites(jourDeclaration, tvaDue, penaliteBase, tauxPenalite);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul TVA facture
//   static calculerTVAFacture(req: Request, res: Response): void {
//     try {
//       const lignes: FactureLigne[] = req.body;
//       const resultat = TVAService.calculerTVAFacture(lignes);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul prorata
//   static calculerProrata(req: Request, res: Response): void {
//     try {
//       const { chiffreAffairesTaxable, chiffreAffairesTotal } = req.body;
//       const resultat = TVAService.calculerProrata(chiffreAffairesTaxable, chiffreAffairesTotal);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Ajuster TVA déductible
//   static ajusterTVADeductible(req: Request, res: Response): void {
//     try {
//       const { tvaDeductible, prorata } = req.body;
//       const resultat = TVAService.ajusterTVADeductible(tvaDeductible, prorata);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Vérifier territorialité
//   static verifierTerritorialite(req: Request, res: Response): void {
//     try {
//       const { lieuOperation } = req.body;
//       const resultat = TVAService.verifierTerritorialite(lieuOperation);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Vérifier obligation déclaration
//   static estDeclarationObligatoire(req: Request, res: Response): void {
//     try {
//       const { entreprise, operationsDuMois } = req.body;
//       const resultat = TVAService.estDeclarationObligatoire(entreprise, operationsDuMois);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Valider cohérence
//   static validerCoherence(req: Request, res: Response): void {
//     try {
//       const resultatTVA: ResultatTVA = req.body;
//       const resultat = TVAService.validerCoherence(resultatTVA);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul taux effectif
//   static calculerTauxEffectif(req: Request, res: Response): void {
//     try {
//       const { tvaCollectee, chiffreAffairesHTTaxable } = req.body;
//       const resultat = TVAService.calculerTauxEffectif(tvaCollectee, chiffreAffairesHTTaxable);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul coefficient récupération
//   static calculerCoefficientRecuperation(req: Request, res: Response): void {
//     try {
//       const { tvaDeductible, tvaCollectee } = req.body;
//       const resultat = TVAService.calculerCoefficientRecuperation(tvaDeductible, tvaCollectee);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul TVA mensuelle complète
//   static calculerTVAMensuelle(req: Request, res: Response): void {
//     try {
//       const { entreprise, ventes, achats, jourDeclaration, parametresPenalite } = req.body;
//       const resultat = TVAService.calculerTVAMensuelle(entreprise, ventes, achats, jourDeclaration, parametresPenalite);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul TVA vente simple
//   static calculerTVAVenteSimple(req: Request, res: Response): void {
//     try {
//       const { prixHT, produit, entreprise, lieuVente } = req.body;
//       const resultat = TVAService.calculerTVAVenteSimple(prixHT, produit, entreprise, lieuVente);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul TVA déductible avec prorata
//   static calculerTVADeductibleAvecProrata(req: Request, res: Response): void {
//     try {
//       const { achats, chiffreAffairesTaxable, chiffreAffairesTotal } = req.body;
//       const resultat = TVAService.calculerTVADeductibleAvecProrata(achats, chiffreAffairesTaxable, chiffreAffairesTotal);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Déclaration TVA mensuelle
//   static declarerTVAMensuelle(req: Request, res: Response): void {
//     try {
//       const { entreprise, ventes, achats, jourDeclaration, parametresPenalite } = req.body;
//       const resultat = TVAService.declarerTVAMensuelle(entreprise, ventes, achats, jourDeclaration, parametresPenalite);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Vérification assujettissement selon CA
//   static estAssujettiSelonCA(req: Request, res: Response): void {
//     try {
//       const entreprise: Entreprise = req.body;
//       const resultat = TVAService.estAssujettiSelonCA(entreprise);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }

//   // Calcul prix TTC avec revenu HT
//   static calculerPrixTTCAvecRevenuHT(req: Request, res: Response): void {
//     try {
//       const { revenuHT, tauxTVA } = req.body;
//       const resultat = TVAService.calculerPrixTTCAvecRevenuHT(revenuHT, tauxTVA);
//       res.json({ success: true, resultat });
//     } catch (error: any) {
//       res.status(400).json({ error: error.message || 'Erreur serveur' });
//     }
//   }
// }
