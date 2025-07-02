// Service for IRCM
// import { IRCM } from '../models/IRCM';

// export class IRCMService {
//   // TODO: implement service methods for IRCM
// }


// ircm.service.ts

// import { IRCM } from '../models/IRCM';

/**
 * IRCM - Impôt sur le Revenu des Capitaux Mobiliers
 * République du Bénin - Modélisation Fiscale
 */

// Enums
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

// Interfaces
export interface ParametresIRCM {
  revenuBrut: number;
  typeRevenu: TypeRevenu;
  statut: Statut;
  natureTitre: NatureTitre;
  emetteur: Emetteur;
  dureeEmission?: number;
  tauxConvention?: number;
}

export interface ResultatIRCM {
  montantImpot: number;
  tauxApplique: number;
  exonere: boolean;
  facteurConvention: number;
  details: string;
}

// Classe de calcul principal
export class CalculateurIRCM {
  private calculerExoneration(emetteur: Emetteur, natureTitre: NatureTitre): number {
    if (emetteur === Emetteur.BENIN) return 1;
    return 0;
  }

  private f5(typeRevenu: TypeRevenu, statut: Statut, natureTitre: NatureTitre): number {
    if (typeRevenu === TypeRevenu.DIVIDENDE && statut === Statut.NON_RESIDENT) return 1;
    if (typeRevenu === TypeRevenu.DIVIDENDE && natureTitre === NatureTitre.COTE_UEMOA) return 1;
    if (typeRevenu === TypeRevenu.PLUS_VALUE_ACTIONS && statut === Statut.NON_RESIDENT) return 1;
    return 0;
  }

  private f6(typeRevenu: TypeRevenu, natureTitre: NatureTitre, duree: number, emetteur: Emetteur): number {
    if (typeRevenu === TypeRevenu.INTERET && emetteur === Emetteur.PRIVE) return 1;
    if (typeRevenu === TypeRevenu.LOT_PRIME) return 1;
    return 0;
  }

  private f10(typeRevenu: TypeRevenu, statut: Statut): number {
    if (typeRevenu === TypeRevenu.DIVIDENDE && this.f5(typeRevenu, statut, NatureTitre.PUBLIC) === 0) return 1;
    if (typeRevenu === TypeRevenu.BENEFICE_STABLE) return 1;
    if (typeRevenu === TypeRevenu.PART_INTERET_SOCIETE) return 1;
    return 0;
  }

  private f15(typeRevenu: TypeRevenu): number {
    const typesCreance = [TypeRevenu.CREANCE, TypeRevenu.DEPOT, TypeRevenu.CAUTIONNEMENT];
    return typesCreance.includes(typeRevenu) ? 1 : 0;
  }

  private f3(typeRevenu: TypeRevenu, emetteur: Emetteur, duree: number): number {
    if (typeRevenu === TypeRevenu.INTERET && emetteur === Emetteur.UEMOA && duree >= 5 && duree <= 10) return 1;
    return 0;
  }

  private f0(typeRevenu: TypeRevenu, emetteur: Emetteur, duree: number): number {
    if (typeRevenu === TypeRevenu.INTERET && emetteur === Emetteur.UEMOA && duree > 10) return 1;
    return 0;
  }

  private determinerTaux(params: ParametresIRCM): number {
    const { typeRevenu, statut, natureTitre, emetteur, dureeEmission = 0 } = params;

    if (this.f5(typeRevenu, statut, natureTitre)) return 0.05;
    if (this.f6(typeRevenu, natureTitre, dureeEmission, emetteur)) return 0.06;
    if (this.f10(typeRevenu, statut)) return 0.10;
    if (this.f15(typeRevenu)) return 0.15;
    if (this.f3(typeRevenu, emetteur, dureeEmission)) return 0.03;
    if (this.f0(typeRevenu, emetteur, dureeEmission)) return 0.00;
    if (typeRevenu === TypeRevenu.PLUS_VALUE_OBLIGATIONS) return 0.05;

    return 0.15;
  }

  private calculerFacteurConvention(statut: Statut, tauxNational: number, tauxConvention?: number): number {
    if (statut === Statut.NON_RESIDENT && tauxConvention !== undefined) {
      return Math.min(1, tauxConvention / tauxNational);
    }
    return 1;
  }

  private genererDetails(params: ParametresIRCM, taux: number, facteurConvention: number): string {
    let d = `Calcul IRCM:\n`;
    d += `- Revenu brut: ${params.revenuBrut} FCFA\n`;
    d += `- Type de revenu: ${params.typeRevenu}\n`;
    d += `- Statut: ${params.statut}\n`;
    d += `- Émetteur: ${params.emetteur}\n`;
    d += `- Taux appliqué: ${(taux * 100).toFixed(1)}%\n`;
    if (facteurConvention < 1) d += `- Facteur convention: ${facteurConvention.toFixed(3)}\n`;
    d += `- Montant IRCM: ${(params.revenuBrut * taux * facteurConvention).toFixed(2)} FCFA`;
    return d;
  }

  public calculer(params: ParametresIRCM): ResultatIRCM {
    if (params.revenuBrut < 0) throw new Error('Revenu brut invalide');

    if (this.calculerExoneration(params.emetteur, params.natureTitre)) {
      return {
        montantImpot: 0,
        tauxApplique: 0,
        exonere: true,
        facteurConvention: 1,
        details: 'Exonéré selon le CGI (Bénin)'
      };
    }

    const taux = this.determinerTaux(params);
    const facteurConvention = this.calculerFacteurConvention(params.statut, taux, params.tauxConvention);
    const montantImpot = Math.round(params.revenuBrut * taux * facteurConvention * 100) / 100;

    return {
      montantImpot,
      tauxApplique: taux,
      exonere: false,
      facteurConvention,
      details: this.genererDetails(params, taux, facteurConvention)
    };
  }

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
}

// Service d'encapsulation
export class IRCMService {
  private static calculateur = new CalculateurIRCM();

  static simulerIRCM(params: ParametresIRCM): ResultatIRCM {
    return this.calculateur.calculer(params);
  }

  static simulerDividende(
    revenuBrut: number,
    statut: Statut,
    natureTitre: NatureTitre,
    tauxConvention?: number
  ): ResultatIRCM {
    return this.calculateur.calculerDividende(revenuBrut, statut, natureTitre, tauxConvention);
  }

  static simulerObligationUEMOA(
    revenuBrut: number,
    dureeEmission: number
  ): ResultatIRCM {
    return this.calculateur.calculerObligationUEMOA(revenuBrut, dureeEmission);
  }
}
