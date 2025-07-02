/**
 * Calculateur d'Impôt sur les Bénéfices des Artisans (IBA) - Bénin
 * Basé sur la documentation fiscale officielle
 */

// Types et énumérations
export enum TypeActivite {
  ENSEIGNEMENT_PRIVE = 'enseignement_prive',
  AUTRE = 'autre'
}

export enum SecteurActivite {
  BTP = 'btp',
  IMMOBILIER = 'immobilier',
  STATIONS_SERVICES = 'stations_services',
  COMMERCE = 'commerce',
  AUTRE = 'autre'
}

export enum ConditionsReduction {
  ARTISANALE = 'artisanale',
  NORMALE = 'normale'
}

// Interface pour les données d'entrée
export interface DonneesIBA {
  produitsEncaissables: number;           // PE - Produits Encaissables
  beneficeImposable: number;              // BI - Bénéfice Imposable
  chiffreAffaires: number;                // CA - Chiffre d'Affaires
  volumeProduitsPetroliers?: number;      // Vpet - Volume produits pétroliers (litres)
  secteurActivite: SecteurActivite;       // S - Secteur d'activité
  typeActivite: TypeActivite;             // A - Type d'activité
  conditionsReduction: ConditionsReduction; // R - Conditions de réduction
  estExonere?: boolean;                   // Exonération totale
}

// Interface pour le résultat du calcul
export interface ResultatIBA {
  iba: number;                           // Montant final de l'IBA
  impotNominal: number;                  // Inom
  impotMinimumSectoriel: number;         // Imin
  impotBase: number;                     // Ibase
  impotApresReduction: number;           // Ired
  redevanceORTB: number;                 // RORTB
  details: {
    tauxNominal: number;
    tauxMinimumSectoriel: number;
    minimumAbsolu: number;
    facteurReduction: number;
  };
}

// Constantes réglementaires
const CONSTANTES = {
  TAUX_GENERAL: 0.30,                    // τg
  TAUX_ENSEIGNEMENT: 0.25,               // τe
  MINIMUM_GENERAL: 0.015,                // τmin
  MINIMUM_BTP: 0.03,                     // τbtp
  MINIMUM_IMMOBILIER: 0.10,              // τimm
  TAUX_PETROLIER: 0.60,                  // τpet (FCFA par litre)
  MINIMUM_ABSOLU_GENERAL: 500_000,       // Mg
  MINIMUM_ABSOLU_STATIONS: 250_000,      // Mpet
  REDEVANCE_ORTB: 4_000,                 // RORTB
  SEUIL_REGIME_REEL: 50_000_000          // Seuil passage TPS vers Régime Réel
} as const;

/**
 * Classe principale pour le calcul de l'IBA
 */
export class CalculateurIBA {
  
  /**
   * Calcule l'IBA selon les règles fiscales béninoises
   */
  public static calculerIBA(donnees: DonneesIBA): ResultatIBA {
    // Étape 1: Vérifier exonération
    if (donnees.estExonere) {
      return this.creerResultatExonere();
    }

    // Validation des données
    this.validerDonnees(donnees);

    // Étape 2: Calculer l'impôt nominal
    const tauxNominal = this.obtenirTauxNominal(donnees.typeActivite);
    const impotNominal = donnees.beneficeImposable * tauxNominal;

    // Étape 3: Calculer l'impôt minimum sectoriel
    const tauxMinimumSectoriel = this.obtenirTauxMinimumSectoriel(donnees.secteurActivite);
    const impotMinimumSectoriel = this.calculerImpotMinimumSectoriel(
      donnees.secteurActivite,
      donnees.produitsEncaissables,
      donnees.volumeProduitsPetroliers,
      tauxMinimumSectoriel
    );

    // Étape 4: Déterminer l'impôt de base
    const minimumAbsolu = this.obtenirMinimumAbsolu(donnees.secteurActivite);
    const impotBase = Math.max(impotNominal, impotMinimumSectoriel, minimumAbsolu);

    // Étape 5: Appliquer les réductions
    const facteurReduction = this.obtenirFacteurReduction(donnees.conditionsReduction);
    const impotApresReduction = impotBase * facteurReduction;

    // Étape 6: Calcul final
    const iba = impotApresReduction + CONSTANTES.REDEVANCE_ORTB;

    return {
      iba: Math.round(iba),
      impotNominal: Math.round(impotNominal),
      impotMinimumSectoriel: Math.round(impotMinimumSectoriel),
      impotBase: Math.round(impotBase),
      impotApresReduction: Math.round(impotApresReduction),
      redevanceORTB: CONSTANTES.REDEVANCE_ORTB,
      details: {
        tauxNominal,
        tauxMinimumSectoriel,
        minimumAbsolu,
        facteurReduction
      }
    };
  }

  /**
   * Fonction de taux nominal selon le type d'activité
   */
  private static obtenirTauxNominal(typeActivite: TypeActivite): number {
    switch (typeActivite) {
      case TypeActivite.ENSEIGNEMENT_PRIVE:
        return CONSTANTES.TAUX_ENSEIGNEMENT;
      default:
        return CONSTANTES.TAUX_GENERAL;
    }
  }

  /**
   * Fonction de minimum sectoriel
   */
  private static obtenirTauxMinimumSectoriel(secteur: SecteurActivite): number {
    switch (secteur) {
      case SecteurActivite.BTP:
        return CONSTANTES.MINIMUM_BTP;
      case SecteurActivite.IMMOBILIER:
        return CONSTANTES.MINIMUM_IMMOBILIER;
      default:
        return CONSTANTES.MINIMUM_GENERAL;
    }
  }

  /**
   * Calcul de l'impôt minimum sectoriel
   */
  private static calculerImpotMinimumSectoriel(
    secteur: SecteurActivite,
    produitsEncaissables: number,
    volumeProduitsPetroliers?: number,
    tauxMinimum?: number
  ): number {
    if (secteur === SecteurActivite.STATIONS_SERVICES) {
      if (!volumeProduitsPetroliers) {
        throw new Error('Volume de produits pétroliers requis pour les stations-services');
      }
      return volumeProduitsPetroliers * CONSTANTES.TAUX_PETROLIER;
    }
    
    return produitsEncaissables * (tauxMinimum || CONSTANTES.MINIMUM_GENERAL);
  }

  /**
   * Fonction de minimum absolu
   */
  private static obtenirMinimumAbsolu(secteur: SecteurActivite): number {
    switch (secteur) {
      case SecteurActivite.STATIONS_SERVICES:
        return CONSTANTES.MINIMUM_ABSOLU_STATIONS;
      default:
        return CONSTANTES.MINIMUM_ABSOLU_GENERAL;
    }
  }

  /**
   * Fonction de réduction
   */
  private static obtenirFacteurReduction(conditions: ConditionsReduction): number {
    switch (conditions) {
      case ConditionsReduction.ARTISANALE:
        return 0.5;
      default:
        return 1.0;
    }
  }

  /**
   * Crée un résultat pour les contribuables exonérés
   */
  private static creerResultatExonere(): ResultatIBA {
    return {
      iba: 0,
      impotNominal: 0,
      impotMinimumSectoriel: 0,
      impotBase: 0,
      impotApresReduction: 0,
      redevanceORTB: 0,
      details: {
        tauxNominal: 0,
        tauxMinimumSectoriel: 0,
        minimumAbsolu: 0,
        facteurReduction: 0
      }
    };
  }

  /**
   * Valide les données d'entrée
   */
  private static validerDonnees(donnees: DonneesIBA): void {
    if (donnees.beneficeImposable < 0) {
      throw new Error('Le bénéfice imposable ne peut pas être négatif');
    }
    
    if (donnees.produitsEncaissables < 0) {
      throw new Error('Les produits encaissables ne peuvent pas être négatifs');
    }
    
    if (donnees.chiffreAffaires < 0) {
      throw new Error('Le chiffre d\'affaires ne peut pas être négatif');
    }

    if (donnees.secteurActivite === SecteurActivite.STATIONS_SERVICES && 
        (donnees.volumeProduitsPetroliers === undefined || donnees.volumeProduitsPetroliers < 0)) {
      throw new Error('Volume de produits pétroliers requis et positif pour les stations-services');
    }

    // Vérification du seuil de passage au régime réel
    if (donnees.chiffreAffaires > CONSTANTES.SEUIL_REGIME_REEL) {
      console.warn('Attention: CA > 50M FCFA, passage au régime réel recommandé');
    }
  }

  /**
   * Méthode utilitaire pour tester avec les exemples de la documentation
   */
  public static testerExemples(): void {
    console.log('=== Tests des exemples de la documentation ===\n');

    // Cas 1: Entreprise Commerciale Standard
    const cas1: DonneesIBA = {
      beneficeImposable: 10_000_000,
      produitsEncaissables: 8_000_000,
      chiffreAffaires: 0, // Non spécifié dans l'exemple
      secteurActivite: SecteurActivite.COMMERCE,
      typeActivite: TypeActivite.AUTRE,
      conditionsReduction: ConditionsReduction.NORMALE
    };

    const resultat1 = this.calculerIBA(cas1);
    console.log('Cas 1 - Entreprise Commerciale Standard:');
    console.log(`IBA calculé: ${resultat1.iba.toLocaleString()} FCFA`);
    console.log(`Attendu: 3,004,000 FCFA\n`);

    // Cas 2: Entreprise BTP
    const cas2: DonneesIBA = {
      beneficeImposable: 2_000_000,
      produitsEncaissables: 15_000_000,
      chiffreAffaires: 0,
      secteurActivite: SecteurActivite.BTP,
      typeActivite: TypeActivite.AUTRE,
      conditionsReduction: ConditionsReduction.NORMALE
    };

    const resultat2 = this.calculerIBA(cas2);
    console.log('Cas 2 - Entreprise BTP:');
    console.log(`IBA calculé: ${resultat2.iba.toLocaleString()} FCFA`);
    console.log(`Attendu: 604,000 FCFA\n`);

    // Cas 3: Station-Service
    const cas3: DonneesIBA = {
      beneficeImposable: 800_000,
      produitsEncaissables: 0, // Non applicable pour stations-services
      chiffreAffaires: 0,
      volumeProduitsPetroliers: 500_000,
      secteurActivite: SecteurActivite.STATIONS_SERVICES,
      typeActivite: TypeActivite.AUTRE,
      conditionsReduction: ConditionsReduction.NORMALE
    };

    const resultat3 = this.calculerIBA(cas3);
    console.log('Cas 3 - Station-Service:');
    console.log(`IBA calculé: ${resultat3.iba.toLocaleString()} FCFA`);
    console.log(`Attendu: 304,000 FCFA\n`);
  }
}

// Export par défaut
export default CalculateurIBA;