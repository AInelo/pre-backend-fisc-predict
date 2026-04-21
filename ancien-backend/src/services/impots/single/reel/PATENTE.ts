/**
 * Calculateur de Contribution des Patentes du Bénin
 * Basé sur la documentation fiscale béninoise
 * Version orientée objet
 */

// Types et interfaces
export type ZoneGeographique = 'zone1' | 'zone2';
export type TypeEntreprise = 'classique' | 'importateur' | 'exportateur';

export type Commune = 
  | 'cotonou' 
  | 'porto-novo' 
  | 'ouidah' 
  | 'parakou' 
  | 'abomey'
  | 'autres-oueme-plateau'
  | 'autres-atlantique'
  | 'autres-zou-collines'
  | 'autres-borgou-alibori'
  | 'atacora-donga'
  | 'mono-couffo';

export interface Local {
  valeurLocative: number;
  estNouveauLocal?: boolean;
  moisRestants?: number; // Pour les locaux acquis en cours d'année
}

export interface DonneesPatente {
  typeEntreprise: TypeEntreprise;
  chiffreAffaires?: number; // Pour entreprises classiques
  montantImportExport?: number; // Pour importateurs/exportateurs
  zone?: ZoneGeographique; // Pour entreprises classiques
  commune: Commune;
  locaux: Local[];
  marchePublicHT?: number; // Montant HT des marchés publics
  ageEntrepriseMois: number; // Âge de l'entreprise en mois
}

export interface ResultatCalculPatente {
  droitFixe: number;
  droitProportionnel: number;
  patenteSupplementaire: number;
  patenteComplementaire: number;
  patenteBase: number;
  exemption: boolean;
  patenteFinale: number;
  acompte: number;
  solde: number;
  tauxCommune: number;
  details: {
    valeurLocativeTotale: number;
    valeurLocativeNouveaux: number;
    minimumDroitProportionnel: number;
  };
}

/**
 * Classe principale pour le calcul des contributions de patentes au Bénin
 */
export class CalculateurPatentes {
  
  // Constantes fiscales privées
  private static readonly CONSTANTES = {
    // Tarifs de base pour le droit fixe (entreprises classiques)
    TARIF_BASE_ZONE_1: 70000, // FCFA
    TARIF_BASE_ZONE_2: 60000, // FCFA
    
    // Seuils pour entreprises classiques
    SEUIL_CA_CLASSIQUE: 1e9, // 1 milliard FCFA
    COEFFICIENT_CA: 10000, // 10^4
    
    // Barème importateurs/exportateurs
    BAREME_IMPORT_EXPORT: [
      { seuil: 8e7, montant: 150000 },      // 80 millions
      { seuil: 2e8, montant: 337500 },      // 200 millions
      { seuil: 5e8, montant: 525000 },      // 500 millions
      { seuil: 1e9, montant: 675000 },      // 1 milliard
      { seuil: 2e9, montant: 900000 },      // 2 milliards
      { seuil: 1e10, montant: 1125000 }     // 10 milliards
    ],
    
    // Taux par commune
    TAUX_COMMUNES: {
      'cotonou': 0.17,
      'porto-novo': 0.17,
      'ouidah': 0.18,
      'parakou': 0.25,
      'abomey': 0.14,
      'autres-oueme-plateau': 0.13,
      'autres-atlantique': 0.13,
      'autres-zou-collines': 0.135,
      'autres-borgou-alibori': 0.15,
      'atacora-donga': 0.15,
      'mono-couffo': 0.12
    },
    
    // Taux patente complémentaire
    TAUX_MARCHE_PUBLIC: 0.005, // 0.5%
    
    // Seuils d'exemption
    SEUIL_EXEMPTION_MOIS: 12,
    
    // Coefficients de paiement
    TAUX_ACOMPTE: 0.5
  } as const;

  private donnees: DonneesPatente;

  constructor(donnees: DonneesPatente) {
    this.donnees = donnees;
    this.validerDonnees();
  }

  /**
   * Méthode statique pour créer une instance et calculer directement
   */
  static calculer(donnees: DonneesPatente): ResultatCalculPatente {
    const calculateur = new CalculateurPatentes(donnees);
    return calculateur.calculerPatente();
  }

  /**
   * Méthode publique pour accéder aux constantes
   */
  static getConstantes() {
    return CalculateurPatentes.CONSTANTES;
  }

  /**
   * Met à jour les données de l'entreprise
   */
  public mettreAJourDonnees(nouvellesDonnees: DonneesPatente): void {
    this.donnees = nouvellesDonnees;
    this.validerDonnees();
  }

  /**
   * Obtient les données actuelles
   */
  public obtenirDonnees(): DonneesPatente {
    return { ...this.donnees };
  }

  /**
   * Valide les données d'entrée
   */
  private validerDonnees(): void {
    if (this.donnees.typeEntreprise === 'classique') {
      if (!this.donnees.chiffreAffaires || this.donnees.chiffreAffaires < 0) {
        throw new Error('Chiffre d\'affaires requis et doit être positif pour les entreprises classiques');
      }
      if (!this.donnees.zone) {
        throw new Error('Zone géographique requise pour les entreprises classiques');
      }
    }
    
    if ((this.donnees.typeEntreprise === 'importateur' || this.donnees.typeEntreprise === 'exportateur')) {
      if (!this.donnees.montantImportExport || this.donnees.montantImportExport < 0) {
        throw new Error('Montant import/export requis et doit être positif');
      }
    }
    
    if (this.donnees.ageEntrepriseMois < 0) {
      throw new Error('L\'âge de l\'entreprise ne peut pas être négatif');
    }
    
    this.donnees.locaux.forEach((local, index) => {
      if (local.valeurLocative < 0) {
        throw new Error(`La valeur locative du local ${index + 1} ne peut pas être négative`);
      }
      
      if (local.estNouveauLocal && (!local.moisRestants || local.moisRestants < 0 || local.moisRestants > 12)) {
        throw new Error(`Le nombre de mois restants pour le local ${index + 1} doit être entre 1 et 12`);
      }
    });
    
    if (this.donnees.marchePublicHT && this.donnees.marchePublicHT < 0) {
      throw new Error('Le montant des marchés publics ne peut pas être négatif');
    }
  }

  /**
   * Calcule le droit fixe pour les entreprises classiques
   */
  private calculerDroitFixeClassique(chiffreAffaires: number, zone: ZoneGeographique): number {
    const tarifBase = zone === 'zone1' ? 
      CalculateurPatentes.CONSTANTES.TARIF_BASE_ZONE_1 : 
      CalculateurPatentes.CONSTANTES.TARIF_BASE_ZONE_2;
    
    if (chiffreAffaires <= CalculateurPatentes.CONSTANTES.SEUIL_CA_CLASSIQUE) {
      return tarifBase;
    } else {
      const depassement = chiffreAffaires - CalculateurPatentes.CONSTANTES.SEUIL_CA_CLASSIQUE;
      const supplementaire = CalculateurPatentes.CONSTANTES.COEFFICIENT_CA * (depassement / CalculateurPatentes.CONSTANTES.SEUIL_CA_CLASSIQUE);
      return tarifBase + supplementaire;
    }
  }

  /**
   * Calcule le droit fixe pour les importateurs/exportateurs
   */
  private calculerDroitFixeImportExport(montant: number): number {
    const bareme = CalculateurPatentes.CONSTANTES.BAREME_IMPORT_EXPORT;
    
    // Trouver la tranche correspondante
    for (let i = 0; i < bareme.length; i++) {
      if (montant <= bareme[i].seuil) {
        return bareme[i].montant;
      }
    }
    
    // Si le montant dépasse le dernier seuil (10 milliards)
    const dernierSeuil = bareme[bareme.length - 1];
    const depassement = montant - 1e10; // 10 milliards
    const supplementaire = CalculateurPatentes.CONSTANTES.COEFFICIENT_CA * (depassement / CalculateurPatentes.CONSTANTES.SEUIL_CA_CLASSIQUE);
    return dernierSeuil.montant + supplementaire;
  }

  /**
   * Calcule le droit fixe selon le type d'entreprise
   */
  private calculerDroitFixe(): number {
    if (this.donnees.typeEntreprise === 'classique') {
      if (!this.donnees.chiffreAffaires || !this.donnees.zone) {
        throw new Error('Chiffre d\'affaires et zone requis pour les entreprises classiques');
      }
      return this.calculerDroitFixeClassique(this.donnees.chiffreAffaires, this.donnees.zone);
    } else {
      if (!this.donnees.montantImportExport) {
        throw new Error('Montant import/export requis pour les importateurs/exportateurs');
      }
      return this.calculerDroitFixeImportExport(this.donnees.montantImportExport);
    }
  }

  /**
   * Obtient le taux de la commune
   */
  private obtenirTauxCommune(): number {
    return CalculateurPatentes.CONSTANTES.TAUX_COMMUNES[this.donnees.commune];
  }

  /**
   * Calcule le droit proportionnel
   */
  private calculerDroitProportionnel(droitFixe: number): { 
    droitProportionnel: number; 
    valeurLocativeTotale: number; 
    minimumDroitProportionnel: number 
  } {
    const tauxCommune = this.obtenirTauxCommune();
    
    // Calcul de la valeur locative totale (hors nouveaux locaux)
    const valeurLocativeTotale = this.donnees.locaux
      .filter(local => !local.estNouveauLocal)
      .reduce((total, local) => total + local.valeurLocative, 0);
    
    // Calcul du droit proportionnel basé sur la valeur locative
    const droitProportionnelVL = valeurLocativeTotale * tauxCommune;
    
    // Minimum légal : Df/3
    const minimumDroitProportionnel = droitFixe / 3;
    
    const droitProportionnel = Math.max(droitProportionnelVL, minimumDroitProportionnel);
    
    return {
      droitProportionnel,
      valeurLocativeTotale,
      minimumDroitProportionnel
    };
  }

  /**
   * Calcule la patente supplémentaire (nouveaux locaux)
   */
  private calculerPatenteSupplementaire(): number {
    const tauxCommune = this.obtenirTauxCommune();
    
    return this.donnees.locaux
      .filter(local => local.estNouveauLocal)
      .reduce((total, local) => {
        const moisRestants = local.moisRestants || 0;
        const coefficient = moisRestants / 12;
        return total + (local.valeurLocative * tauxCommune * coefficient);
      }, 0);
  }

  /**
   * Calcule la patente complémentaire (marchés publics)
   */
  private calculerPatenteComplementaire(): number {
    const marchePublicHT = this.donnees.marchePublicHT || 0;
    return marchePublicHT * CalculateurPatentes.CONSTANTES.TAUX_MARCHE_PUBLIC;
  }

  /**
   * Détermine si l'entreprise bénéficie d'une exemption
   */
  private verifierExemption(): boolean {
    return this.donnees.ageEntrepriseMois < CalculateurPatentes.CONSTANTES.SEUIL_EXEMPTION_MOIS;
  }

  /**
   * Méthode principale de calcul de la patente
   */
  public calculerPatente(): ResultatCalculPatente {
    // 1. Calcul du droit fixe
    const droitFixe = this.calculerDroitFixe();
    
    // 2. Calcul du droit proportionnel
    const resultDP = this.calculerDroitProportionnel(droitFixe);
    const droitProportionnel = resultDP.droitProportionnel;
    
    // 3. Calcul de la patente supplémentaire
    const patenteSupplementaire = this.calculerPatenteSupplementaire();
    
    // 4. Calcul de la patente complémentaire
    const patenteComplementaire = this.calculerPatenteComplementaire();
    
    // 5. Patente de base
    const patenteBase = droitFixe + droitProportionnel + patenteSupplementaire + patenteComplementaire;
    
    // 6. Gestion de l'exemption
    const exemption = this.verifierExemption();
    const coefficientExemption = exemption ? 0 : 1;
    
    // 7. Patente finale
    const patenteFinale = patenteBase * coefficientExemption;
    
    // 8. Calcul de l'acompte et du solde
    const acompte = patenteFinale * CalculateurPatentes.CONSTANTES.TAUX_ACOMPTE;
    const solde = patenteFinale - acompte;
    
    // Calcul des valeurs pour les détails
    const valeurLocativeNouveaux = this.donnees.locaux
      .filter(local => local.estNouveauLocal)
      .reduce((total, local) => total + local.valeurLocative, 0);
    
    return {
      droitFixe,
      droitProportionnel,
      patenteSupplementaire,
      patenteComplementaire,
      patenteBase,
      exemption,
      patenteFinale,
      acompte,
      solde,
      tauxCommune: this.obtenirTauxCommune(),
      details: {
        valeurLocativeTotale: resultDP.valeurLocativeTotale,
        valeurLocativeNouveaux,
        minimumDroitProportionnel: resultDP.minimumDroitProportionnel
      }
    };
  }


  /**
   * Cas 1a - Estimation lors de création d'entreprise
   * Prend en compte exonération totale la première année (t < 12)
   */
  public estimerCreationEntreprise(): ResultatCalculPatente {
    // Patente calculée normalement
    const resultat = this.calculerPatente();
    // Forcer exonération si entreprise < 12 mois (création)
    if (this.donnees.ageEntrepriseMois < 12) {
      resultat.exemption = true;
      resultat.patenteFinale = 0;
      resultat.acompte = 0;
      resultat.solde = 0;
    }
    return resultat;
  }

  /**
   * Cas 1b - Estimation pour déclaration annuelle des impôts
   * Simple calcul complet sans exonération si ageEntrepriseMois >= 12
   */
  public estimerDeclarationAnnuelle(): ResultatCalculPatente {
    // Patente calculée normalement (exonération automatique gérée)
    return this.calculerPatente();
  }

  /**
   * Cas 1c - Estimation patente complémentaire pour marchés publics uniquement
   */
  public estimerPatenteComplementaire(): number {
    return this.calculerPatenteComplementaire();
  }

  /**
   * Cas 1d - Estimation patente supplémentaire pour nouveaux locaux uniquement
   */
  public estimerPatenteSupplementaire(): number {
    return this.calculerPatenteSupplementaire();
  }

  /**
   * Cas 1e - Comparaison entre zones (fournir zone dans données)
   * Retourne la patente totale pour la zone courante dans `donnees.zone`
   */
  public estimerPourZone(): ResultatCalculPatente {
    if (!this.donnees.zone) {
      throw new Error('Zone géographique requise pour comparaison');
    }
    return this.calculerPatente();
  }

  /**
   * Cas 1f - Estimation à la fin de l’exonération
   * On suppose ici ageEntrepriseMois >= 12 (pas d'exonération)
   */
  public estimerFinExoneration(): ResultatCalculPatente {
    if (this.donnees.ageEntrepriseMois < 12) {
      throw new Error('L\'entreprise est toujours exonérée, pas de fin d’exonération');
    }
    return this.calculerPatente();
  }

}
