/**
 * Calculateur TVA pour la République du Bénin
 * Basé sur la documentation officielle des formules de calcul TVA
 */

// 1.1 Constantes du système
export const CONSTANTES_TVA = {
  TAUX_NORMAL: 0.18,           // τnormal = 18%
  TAUX_EXONERE: 0,             // τexonéré = 0%
  SEUIL_EXONERATION: 50000000, // 50 000 000 FCFA
  JOUR_LIMITE_DECLARATION: 10   // 10ème jour du mois
};



// Types de base
export interface Entreprise {
  id: string;
  nom: string;
  chiffreAffairesAnnuel: number;
}

export interface Produit {
  id: string;
  nom: string;
  estExonere: boolean;
}

export interface Operation {
  id: string;
  baseImposable: number;
  produit: Produit;
  date: Date;
  estDeductible?: boolean; // Pour les achats
}

export interface FactureLigne {
  baseImposable: number;
  produit: Produit;
}



export interface Penalite {
  montant: number;
  retard: number;
  penaliteBase: number;
  tauxPenalite: number;
}



export interface ResultatTVA {
  tvaCollectee: number;
  tvaDeductible: number;
  tvaDue: number;
  situationTVA: 'TVA_A_PAYER' | 'CREDIT_TVA' | 'SOLDE_NUL';
  creditTVA?: number;
}


/**
 * Classe principale pour le calcul de la TVA au Bénin
 */
export class CalculateurTVABenin {
  
  /**
   * 1.2 Détermination du statut d'assujettissement
   * Formule (5): Assujetti(E) = Vrai si CAannuel(E) >= Sexonération
   */
  static estAssujetti(entreprise: Entreprise): boolean {
    return entreprise.chiffreAffairesAnnuel >= CONSTANTES_TVA.SEUIL_EXONERATION;
  }

  /**
   * 1.3 Détermination du taux applicable
   * Formule (6): τ(P) = 0 si P ∈ E, 0.18 si P ∉ E
   */
  static obtenirTaux(produit: Produit): number {
    return produit.estExonere ? CONSTANTES_TVA.TAUX_EXONERE : CONSTANTES_TVA.TAUX_NORMAL;
  }

  /**
   * 1.4 Calcul de la TVA sur une opération
   * Formule (7): TVAopération = B × τ(P)
   */
  static calculerTVAOperation(baseImposable: number, produit: Produit): number {
    const taux = this.obtenirTaux(produit);
    return baseImposable * taux;
  }

  /**
   * 1.4 Calcul du prix TTC
   * Formule (8): PrixTTC = PrixHT × (1 + τ(P))
   */
  static calculerPrixTTC(prixHT: number, produit: Produit): number {
    const taux = this.obtenirTaux(produit);
    return prixHT * (1 + taux);
  }

  /**
   * 1.5.1 Calcul de la TVA collectée (sur les ventes)
   * Formule (9): TVAcollectée = Σ(Bi × τ(Pi))
   */
  static calculerTVACollectee(ventes: Operation[]): number {
    return ventes.reduce((total, vente) => {
      return total + this.calculerTVAOperation(vente.baseImposable, vente.produit);
    }, 0);
  }

  /**
   * 1.5.2 Calcul de la TVA déductible (sur les achats)
   * Formule (10): TVAdéductible = Σ(Bj × τ(Pj) × δj)
   */
  static calculerTVADeductible(achats: Operation[]): number {
    return achats.reduce((total, achat) => {
      const tvaAchat = this.calculerTVAOperation(achat.baseImposable, achat.produit);
      const indicateurDeductibilite = achat.estDeductible ? 1 : 0;
      return total + (tvaAchat * indicateurDeductibilite);
    }, 0);
  }

  /**
   * 1.5.3 Calcul de la TVA nette due
   * Formule (12): TVAdue = TVAcollectée - TVAdéductible
   */
  static calculerTVADue(ventes: Operation[], achats: Operation[]): ResultatTVA {
    const tvaCollectee = this.calculerTVACollectee(ventes);
    const tvaDeductible = this.calculerTVADeductible(achats);
    const tvaDue = tvaCollectee - tvaDeductible;

    let situationTVA: 'TVA_A_PAYER' | 'CREDIT_TVA' | 'SOLDE_NUL';
    let creditTVA: number | undefined;

    if (tvaDue > 0) {
      situationTVA = 'TVA_A_PAYER';
    } else if (tvaDue < 0) {
      situationTVA = 'CREDIT_TVA';
      creditTVA = Math.abs(tvaDue);
    } else {
      situationTVA = 'SOLDE_NUL';
    }

    return {
      tvaCollectee,
      tvaDeductible,
      tvaDue,
      situationTVA,
      creditTVA
    };
  }

  /**
   * 1.7 Calcul des pénalités pour retard
   * Formule (16-17): Pénalité basée sur le retard et la TVA due
   */
  static calculerPenalites(
    jourDeclaration: number, 
    tvaDue: number, 
    penaliteBase: number = 0, 
    tauxPenalite: number = 0
  ): Penalite {
    const retard = Math.max(0, jourDeclaration - CONSTANTES_TVA.JOUR_LIMITE_DECLARATION);
    let montant = 0;

    if (retard > 0) {
      montant = penaliteBase + (tauxPenalite * retard * tvaDue);
    }

    return {
      montant,
      retard,
      penaliteBase,
      tauxPenalite
    };
  }

  /**
   * 1.8.1 Calcul TVA pour facture avec opérations mixtes
   * Formule (18-20): TVAfacture = Σ(Bk × τ(Pk))
   */
  static calculerTVAFacture(lignes: FactureLigne[]): {
    totalHT: number;
    tvaFacture: number;
    totalTTC: number;
  } {
    const totalHT = lignes.reduce((total, ligne) => total + ligne.baseImposable, 0);
    const tvaFacture = lignes.reduce((total, ligne) => {
      return total + this.calculerTVAOperation(ligne.baseImposable, ligne.produit);
    }, 0);
    const totalTTC = totalHT + tvaFacture;

    return { totalHT, tvaFacture, totalTTC };
  }

  /**
   * 1.8.2 Calcul du prorata de déduction
   * Formule (21-22): Prorata = (CAtaxable / CAtotal) × 100
   */
  static calculerProrata(chiffreAffairesTaxable: number, chiffreAffairesTotal: number): number {
    if (chiffreAffairesTotal === 0) return 0;
    return (chiffreAffairesTaxable / chiffreAffairesTotal) * 100;
  }

  /**
   * Ajustement de la TVA déductible avec prorata
   */
  static ajusterTVADeductible(tvaDeductible: number, prorata: number): number {
    return tvaDeductible * (prorata / 100);
  }

  /**
   * 1.9.1 Vérification de la contrainte de territorialité
   * Formule (22): TVAapplicable = Oui si Lieu(O) ∈ Territoire Bénin
   */
  static verifierTerritorialite(lieuOperation: string): boolean {
    // Simplifié : assume que si lieu contient "Bénin" ou "BJ", c'est applicable
    return lieuOperation.toLowerCase().includes('bénin') || 
           lieuOperation.toLowerCase().includes('benin') ||
           lieuOperation.toLowerCase().includes('bj');
  }

  /**
   * 1.9.2 Vérification de l'obligation de déclaration
   * Formule (24): Déclaration obligatoire = Assujetti(E) ∧ ∃ opération en T
   */
  static estDeclarationObligatoire(entreprise: Entreprise, operationsDuMois: Operation[]): boolean {
    return this.estAssujetti(entreprise) && operationsDuMois.length > 0;
  }

  /**
   * 1.9.3 Validation des contraintes de cohérence
   * Formules (25-27): Validation des montants TVA
   */
  static validerCoherence(resultatTVA: ResultatTVA): {
    estValide: boolean;
    erreurs: string[];
  } {
    const erreurs: string[] = [];

    if (resultatTVA.tvaCollectee < 0) {
      erreurs.push('TVA collectée ne peut pas être négative');
    }

    if (resultatTVA.tvaDeductible < 0) {
      erreurs.push('TVA déductible ne peut pas être négative');
    }

    const maxTVA = Math.max(resultatTVA.tvaCollectee, resultatTVA.tvaDeductible);
    if (Math.abs(resultatTVA.tvaDue) > maxTVA) {
      erreurs.push('TVA due incohérente par rapport aux montants collectés et déductibles');
    }

    return {
      estValide: erreurs.length === 0,
      erreurs
    };
  }

  /**
   * 1.10.1 Calcul du taux effectif de TVA
   * Formule (28): τeffectif = (TVAcollectée / CAHT taxable) × 100
   */
  static calculerTauxEffectif(tvaCollectee: number, chiffreAffairesHTTaxable: number): number {
    if (chiffreAffairesHTTaxable === 0) return 0;
    return (tvaCollectee / chiffreAffairesHTTaxable) * 100;
  }

  /**
   * 1.10.2 Calcul du coefficient de récupération
   * Formule (29): Coeffrécupération = (TVAdéductible / TVAcollectée) × 100
   */
  static calculerCoefficientRecuperation(tvaDeductible: number, tvaCollectee: number): number {
    if (tvaCollectee === 0) return 0;
    return (tvaDeductible / tvaCollectee) * 100;
  }

  /**
   * Méthode utilitaire pour un calcul complet mensuel
   */
  static calculerTVAMensuelle(
    entreprise: Entreprise,
    ventes: Operation[],
    achats: Operation[],
    jourDeclaration?: number,
    parametresPenalite?: { base: number; taux: number }
  ): {
    resultatTVA: ResultatTVA;
    validation: { estValide: boolean; erreurs: string[] };
    penalites?: Penalite;
    declarationObligatoire: boolean;
  } {
    const resultatTVA = this.calculerTVADue(ventes, achats);
    const validation = this.validerCoherence(resultatTVA);
    const declarationObligatoire = this.estDeclarationObligatoire(entreprise, [...ventes, ...achats]);

    let penalites: Penalite | undefined;
    if (jourDeclaration && parametresPenalite) {
      penalites = this.calculerPenalites(
        jourDeclaration,
        resultatTVA.tvaDue,
        parametresPenalite.base,
        parametresPenalite.taux
      );
    }

    return {
      resultatTVA,
      validation,
      penalites,
      declarationObligatoire
    };
  }




  /**
   * Contexte 1 : Calcul TVA et Prix TTC pour une vente simple
   */
  static calculerTVAVenteSimple(
    prixHT: number,
    produit: Produit,
    entreprise: Entreprise,
    lieuVente: string
  ): { tva: number; prixTTC: number } {
    if (!this.estAssujetti(entreprise)) {
      return { tva: 0, prixTTC: prixHT };
    }
    if (!this.verifierTerritorialite(lieuVente)) {
      // TVA non applicable hors Bénin
      return { tva: 0, prixTTC: prixHT };
    }
    const taux = this.obtenirTaux(produit);
    const tva = prixHT * taux;
    const prixTTC = prixHT * (1 + taux);
    return { tva, prixTTC };
  }

  /**
   * Contexte 2 : Calcul TVA déductible sur achats avec option prorata si mixte
   */
  static calculerTVADeductibleAvecProrata(
    achats: Operation[],
    chiffreAffairesTaxable: number,
    chiffreAffairesTotal: number
  ): number {
    let tvaDeductible = this.calculerTVADeductible(achats);
    const prorata = this.calculerProrata(chiffreAffairesTaxable, chiffreAffairesTotal);
    return this.ajusterTVADeductible(tvaDeductible, prorata);
  }

  /**
   * Contexte 3 : Déclaration mensuelle complète (TVA due, pénalités, etc.)
   */
  static declarerTVAMensuelle(
    entreprise: Entreprise,
    ventes: Operation[],
    achats: Operation[],
    jourDeclaration: number,
    parametresPenalite: { base: number; taux: number }
  ): {
    resultatTVA: ResultatTVA;
    penalites: Penalite;
    declarationObligatoire: boolean;
  } {
    const resultatTVA = this.calculerTVADue(ventes, achats);
    const penalites = this.calculerPenalites(jourDeclaration, resultatTVA.tvaDue, parametresPenalite.base, parametresPenalite.taux);
    const declarationObligatoire = this.estDeclarationObligatoire(entreprise, [...ventes, ...achats]);

    return { resultatTVA, penalites, declarationObligatoire };
  }

  /**
   * Contexte 4 : Vérification assujettissement à la TVA selon CA annuel
   */
  static estAssujettiSelonCA(entreprise: Entreprise): boolean {
    return this.estAssujetti(entreprise);
  }

  /**
   * Contexte 5 : Calcul prix TTC à partir d’un revenu HT souhaité
   */
  static calculerPrixTTCAvecRevenuHT(
    revenuHT: number,
    tauxTVA: number = CONSTANTES_TVA.TAUX_NORMAL
  ): number {
    return revenuHT * (1 + tauxTVA);
  }



}