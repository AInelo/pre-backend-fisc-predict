/**
 * IRCM - Impôt sur le Revenu des Capitaux Mobiliers
 * République du Bénin - Modélisation Fiscale
 */

// Types et énumérations
export enum Statut {
  RESIDENT = 'Résident',
  NON_RESIDENT = 'Non-résident'
}

export enum TypeRevenu {
  DIVIDENDE = 'Dividende',
  INTERET = 'Intérêt',
  PLUS_VALUE = 'Plus-value',
  CREANCE = 'Créance',
  LOT_PRIME = 'Lot/Prime remboursement',
  BENEFICE_STABLE = 'Bénéfice établissement stable',
  PART_INTERET_SOCIETE = 'Part d\'intérêt société IS',
  DEPOT = 'Dépôt',
  CAUTIONNEMENT = 'Cautionnement',
  PLUS_VALUE_ACTIONS = 'Plus-value actions',
  PLUS_VALUE_OBLIGATIONS = 'Plus-value obligations'
}

export enum NatureTitre {
  PUBLIC = 'Public',
  PRIVE = 'Privé',
  COTE = 'Coté',
  NON_COTE = 'Non-coté',
  COTE_UEMOA = 'Coté UEMOA'
}

export enum Emetteur {
  BENIN = 'Bénin',
  UEMOA = 'UEMOA',
  PRIVE = 'Privé'
}

// Interface pour les paramètres de calcul
export interface ParametresIRCM {
  revenuBrut: number;
  typeRevenu: TypeRevenu;
  statut: Statut;
  natureTitre: NatureTitre;
  emetteur: Emetteur;
  dureeEmission?: number; // en années
  tauxConvention?: number; // pour les conventions fiscales
}

// Interface pour le résultat
export interface ResultatIRCM {
  montantImpot: number;
  tauxApplique: number;
  exonere: boolean;
  facteurConvention: number;

}

export class CalculateurIRCM {
  
  /**
   * Fonction d'exonération selon l'article 73-80 CGI
   */
  private calculerExoneration(emetteur: Emetteur, natureTitre: NatureTitre): number {
    // Exonération pour les titres du Bénin ou collectivités béninoises
    if (emetteur === Emetteur.BENIN) {
      return 1; // Exonéré
    }
    
    // Autres conditions d'exonération selon art. 73-80 CGI
    // À compléter selon les règles spécifiques
    
    return 0; // Non exonéré
  }

  /**
   * Fonction f5 - Taux 5%
   */
  private f5(typeRevenu: TypeRevenu, statut: Statut, natureTitre: NatureTitre): number {
    if (typeRevenu === TypeRevenu.DIVIDENDE && statut === Statut.NON_RESIDENT) {
      return 1;
    }
    if (typeRevenu === TypeRevenu.DIVIDENDE && natureTitre === NatureTitre.COTE_UEMOA) {
      return 1;
    }
    if (typeRevenu === TypeRevenu.PLUS_VALUE_ACTIONS && statut === Statut.NON_RESIDENT) {
      return 1;
    }
    return 0;
  }

  /**
   * Fonction f6 - Taux 6%
   */
  private f6(typeRevenu: TypeRevenu, natureTitre: NatureTitre, duree: number, emetteur: Emetteur): number {
    if (typeRevenu === TypeRevenu.INTERET && emetteur === Emetteur.PRIVE) {
      return 1;
    }
    if (typeRevenu === TypeRevenu.LOT_PRIME) {
      return 1;
    }
    return 0;
  }

  /**
   * Fonction f10 - Taux 10%
   */
  private f10(typeRevenu: TypeRevenu, statut: Statut): number {
    if (typeRevenu === TypeRevenu.DIVIDENDE && this.f5(typeRevenu, statut, NatureTitre.PUBLIC) === 0) {
      return 1;
    }
    if (typeRevenu === TypeRevenu.BENEFICE_STABLE) {
      return 1;
    }
    if (typeRevenu === TypeRevenu.PART_INTERET_SOCIETE) {
      return 1;
    }
    return 0;
  }

  /**
   * Fonction f15 - Taux 15%
   */
  private f15(typeRevenu: TypeRevenu): number {
    const typesCreance = [
      TypeRevenu.CREANCE,
      TypeRevenu.DEPOT,
      TypeRevenu.CAUTIONNEMENT
    ];
    
    if (typesCreance.includes(typeRevenu)) {
      return 1;
    }
    return 0;
  }

  /**
   * Fonction f3 - Taux spécial UEMOA 3%
   */
  private f3(typeRevenu: TypeRevenu, emetteur: Emetteur, duree: number): number {
    if (typeRevenu === TypeRevenu.INTERET && 
        emetteur === Emetteur.UEMOA && 
        duree >= 5 && duree <= 10) {
      return 1;
    }
    return 0;
  }

  /**
   * Fonction f0 - Taux 0% (exonération UEMOA)
   */
  private f0(typeRevenu: TypeRevenu, emetteur: Emetteur, duree: number): number {
    if (typeRevenu === TypeRevenu.INTERET && 
        emetteur === Emetteur.UEMOA && 
        duree > 10) {
      return 1;
    }
    return 0;
  }

  /**
   * Détermination du taux principal
   */
  private determinerTaux(params: ParametresIRCM): number {
    const { typeRevenu, statut, natureTitre, emetteur, dureeEmission = 0 } = params;

    // Vérification dans l'ordre de priorité
    if (this.f5(typeRevenu, statut, natureTitre) === 1) {
      return 0.05;
    }
    if (this.f6(typeRevenu, natureTitre, dureeEmission, emetteur) === 1) {
      return 0.06;
    }
    if (this.f10(typeRevenu, statut) === 1) {
      return 0.10;
    }
    if (this.f15(typeRevenu) === 1) {
      return 0.15;
    }
    if (this.f3(typeRevenu, emetteur, dureeEmission) === 1) {
      return 0.03;
    }
    if (this.f0(typeRevenu, emetteur, dureeEmission) === 1) {
      return 0.00;
    }
    if (typeRevenu === TypeRevenu.PLUS_VALUE_OBLIGATIONS) {
      return 0.05;
    }

    // Taux par défaut pour les cas non spécifiés
    return 0.15;
  }

  /**
   * Facteur convention fiscale
   */
  private calculerFacteurConvention(statut: Statut, tauxNational: number, tauxConvention?: number): number {
    if (statut === Statut.NON_RESIDENT && tauxConvention !== undefined) {
      return Math.min(1, tauxConvention / tauxNational);
    }
    return 1;
  }

  /**
   * Calcul principal de l'IRCM
   */
  public calculer(params: ParametresIRCM): ResultatIRCM {
    // Validation des paramètres
    if (params.revenuBrut < 0) {
      throw new Error('Le revenu brut doit être positif');
    }

    // Vérification de l'exonération
    const exoneration = this.calculerExoneration(params.emetteur, params.natureTitre);
    if (exoneration === 1) {
      return {
        montantImpot: 0,
        tauxApplique: 0,
        exonere: true,
        facteurConvention: 1,
 
      };
    }

    // Détermination du taux
    const taux = this.determinerTaux(params);

    // Calcul du facteur convention
    const facteurConvention = this.calculerFacteurConvention(
      params.statut, 
      taux, 
      params.tauxConvention
    );

    // Calcul final
    const montantImpot = params.revenuBrut * taux * facteurConvention;

    // Vérification des contraintes
    if (montantImpot > params.revenuBrut) {
      throw new Error('L\'impôt ne peut excéder le revenu brut');
    }

    return {
      montantImpot: Math.round(montantImpot * 100) / 100, // Arrondi à 2 décimales
      tauxApplique: taux,
      exonere: false,
      facteurConvention,
 
    };
  }



  /**
   * Calcul pour cas spécifique des dividendes
   */
  public calculerDividende(revenuBrut: number, statut: Statut, natureTitre: NatureTitre, tauxConvention?: number): ResultatIRCM {
    return this.calculer({
      revenuBrut,
      typeRevenu: TypeRevenu.DIVIDENDE,
      statut,
      natureTitre,
      emetteur: Emetteur.PRIVE,
      tauxConvention
    });
  }

  /**
   * Calcul pour obligations UEMOA
   */
  public calculerObligationUEMOA(revenuBrut: number, dureeEmission: number): ResultatIRCM {
    return this.calculer({
      revenuBrut,
      typeRevenu: TypeRevenu.INTERET,
      statut: Statut.RESIDENT,
      natureTitre: NatureTitre.PUBLIC,
      emetteur: Emetteur.UEMOA,
      dureeEmission
    });
  }










    /**
   * Calcul pour déclaration fiscale annuelle - cumul de plusieurs revenus
   */
    public calculerRevenusAnnuels(revenus: ParametresIRCM[]): {
      totalRevenu: number;
      totalImpot: number;
      details: ResultatIRCM[];
    } {
      let totalRevenu = 0;
      let totalImpot = 0;
      const details: ResultatIRCM[] = [];
  
      for (const revenu of revenus) {
        const result = this.calculer(revenu);
        totalRevenu += revenu.revenuBrut;
        totalImpot += result.montantImpot;
        details.push(result);
      }
  
      return {
        totalRevenu: Math.round(totalRevenu * 100) / 100,
        totalImpot: Math.round(totalImpot * 100) / 100,
        details
      };
    }
  
    /**
     * Simulation de rendement net après IRCM pour aider à la planification patrimoniale
     */
    public simulerRendementNet(params: ParametresIRCM): {
      revenuNet: number;
      impot: number;
      taux: number;
    } {
      const resultat = this.calculer(params);
      const revenuNet = params.revenuBrut - resultat.montantImpot;
  
      return {
        revenuNet: Math.round(revenuNet * 100) / 100,
        impot: resultat.montantImpot,
        taux: resultat.tauxApplique
      };
    }
  
    /**
     * Vérification ou contrôle fiscal d’un revenu déjà imposé
     */
    public verifierConformiteImpot(
      params: ParametresIRCM,
      impotDeclare: number
    ): {
      correct: boolean;
      ecart: number;
      recalcul: ResultatIRCM;
    } {
      const recalcul = this.calculer(params);
      const ecart = Math.round((recalcul.montantImpot - impotDeclare) * 100) / 100;
  
      return {
        correct: ecart === 0,
        ecart,
        recalcul
      };
    }
  
    /**
     * Estimation du revenu net à présenter dans un dossier administratif
     */
    public estimerRevenuNet(params: ParametresIRCM): {
      revenuNet: number;
      revenuBrut: number;
      impot: number;
    } {
      const result = this.calculer(params);
      const revenuNet = params.revenuBrut - result.montantImpot;
  
      return {
        revenuNet: Math.round(revenuNet * 100) / 100,
        revenuBrut: params.revenuBrut,
        impot: result.montantImpot
      };
    }
  




}












// Export d'une instance par défaut
export const calculateurIRCM = new CalculateurIRCM();








// Fonction utilitaire pour un calcul rapide
// export function calculerIRCM(params: ParametresIRCM): ResultatIRCM {
//   return calculateurIRCM.calculer(params);
// }



