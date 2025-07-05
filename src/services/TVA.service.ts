// Service for TVA
import { CalculateurTVABenin, Entreprise, Produit, Operation, FactureLigne, ResultatTVA } from '../models/reel/TVA';

export class TVAService {
  static estAssujetti(entreprise: Entreprise) {
    return CalculateurTVABenin.estAssujetti(entreprise);
  }

  static obtenirTaux(produit: Produit) {
    return CalculateurTVABenin.obtenirTaux(produit);
  }

  static calculerTVAOperation(baseImposable: number, produit: Produit) {
    return CalculateurTVABenin.calculerTVAOperation(baseImposable, produit);
  }

  static calculerPrixTTC(prixHT: number, produit: Produit) {
    return CalculateurTVABenin.calculerPrixTTC(prixHT, produit);
  }

  static calculerTVACollectee(ventes: Operation[]) {
    return CalculateurTVABenin.calculerTVACollectee(ventes);
  }

  static calculerTVADeductible(achats: Operation[]) {
    return CalculateurTVABenin.calculerTVADeductible(achats);
  }

  static calculerTVADue(ventes: Operation[], achats: Operation[]) {
    return CalculateurTVABenin.calculerTVADue(ventes, achats);
  }

  static calculerPenalites(jourDeclaration: number, tvaDue: number, penaliteBase: number = 0, tauxPenalite: number = 0) {
    return CalculateurTVABenin.calculerPenalites(jourDeclaration, tvaDue, penaliteBase, tauxPenalite);
  }

  static calculerTVAFacture(lignes: FactureLigne[]) {
    return CalculateurTVABenin.calculerTVAFacture(lignes);
  }

  static calculerProrata(chiffreAffairesTaxable: number, chiffreAffairesTotal: number) {
    return CalculateurTVABenin.calculerProrata(chiffreAffairesTaxable, chiffreAffairesTotal);
  }

  static ajusterTVADeductible(tvaDeductible: number, prorata: number) {
    return CalculateurTVABenin.ajusterTVADeductible(tvaDeductible, prorata);
  }

  static verifierTerritorialite(lieuOperation: string) {
    return CalculateurTVABenin.verifierTerritorialite(lieuOperation);
  }

  static estDeclarationObligatoire(entreprise: Entreprise, operationsDuMois: Operation[]) {
    return CalculateurTVABenin.estDeclarationObligatoire(entreprise, operationsDuMois);
  }

  static validerCoherence(resultatTVA: ResultatTVA) {
    return CalculateurTVABenin.validerCoherence(resultatTVA);
  }

  static calculerTauxEffectif(tvaCollectee: number, chiffreAffairesHTTaxable: number) {
    return CalculateurTVABenin.calculerTauxEffectif(tvaCollectee, chiffreAffairesHTTaxable);
  }

  static calculerCoefficientRecuperation(tvaDeductible: number, tvaCollectee: number) {
    return CalculateurTVABenin.calculerCoefficientRecuperation(tvaDeductible, tvaCollectee);
  }

  static calculerTVAMensuelle(entreprise: Entreprise, ventes: Operation[], achats: Operation[], jourDeclaration?: number, parametresPenalite?: { base: number; taux: number }) {
    return CalculateurTVABenin.calculerTVAMensuelle(entreprise, ventes, achats, jourDeclaration, parametresPenalite);
  }

  static calculerTVAVenteSimple(prixHT: number, produit: Produit, entreprise: Entreprise, lieuVente: string) {
    return CalculateurTVABenin.calculerTVAVenteSimple(prixHT, produit, entreprise, lieuVente);
  }

  static calculerTVADeductibleAvecProrata(achats: Operation[], chiffreAffairesTaxable: number, chiffreAffairesTotal: number) {
    return CalculateurTVABenin.calculerTVADeductibleAvecProrata(achats, chiffreAffairesTaxable, chiffreAffairesTotal);
  }

  static declarerTVAMensuelle(entreprise: Entreprise, ventes: Operation[], achats: Operation[], jourDeclaration: number, parametresPenalite: { base: number; taux: number }) {
    return CalculateurTVABenin.declarerTVAMensuelle(entreprise, ventes, achats, jourDeclaration, parametresPenalite);
  }

  static estAssujettiSelonCA(entreprise: Entreprise) {
    return CalculateurTVABenin.estAssujettiSelonCA(entreprise);
  }

  static calculerPrixTTCAvecRevenuHT(revenuHT: number, tauxTVA?: number) {
    return CalculateurTVABenin.calculerPrixTTCAvecRevenuHT(revenuHT, tauxTVA);
  }
}
