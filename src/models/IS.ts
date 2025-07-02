/**
 * Calculateur d'Impôt sur les Sociétés (IS) du Bénin
 * Basé sur la documentation fiscale béninoise
 */

// Types et interfaces
export type SecteurActivite = 'general' | 'BTP' | 'immobilier';
export type TypeSociete = 'general' | 'enseignement' | 'industriel';

export interface DonneesFiscales {
  BN: number;              // Bénéfice Net
  PE: number;              // Produits Encaissables
  RCM: number;             // Revenus de Capitaux Mobiliers
  Vpetrole?: number;       // Volume produits pétroliers (litres)
  secteur: SecteurActivite;// Secteur d'activité
  type: TypeSociete;       // Type de société
  estExoneree: boolean;    // Statut d'exonération
  dureeCreation?: number;  // Durée depuis création (années) - pour capital-risque
  pourcentageActionsNonCotees?: number; // % actions non cotées - pour capital-risque
}

export interface ResultatCalculIS {
  baseImposable: number;
  impotTheorique: number;
  impotMinimumStandard: number;
  impotMinimumStation: number;
  impotMinimumEffectif: number;
  impotSocietes: number;
  impotFinal: number;
  redevanceORTB: number;
  montantTotal: number;
  tauxApplique: number;
  details: {
    RCMNet: number;
    estExoneree: boolean;
    exonerationCapitalRisque: boolean;
  };
}

// Constantes fiscales
export const CONSTANTES_FISCALES = {
  // Taux d'imposition
  TAUX_GENERAL: 0.30,
  TAUX_REDUIT: 0.25,
  
  // Taux minimums
  TAUX_MIN_GENERAL: 0.01,
  TAUX_MIN_BTP: 0.03,
  TAUX_MIN_IMMOBILIER: 0.10,
  
  // Taux station-service
  TAUX_STATION: 0.60, // FCFA par litre
  
  // Montants fixes
  IMPOT_MIN_ABSOLU: 250000, // FCFA
  REDEVANCE_ORTB: 4000,     // FCFA
  
  // Quote-parts
  QUOTE_PART_MOBILIER: 0.30
} as const;

/**
 * Calcule le taux d'imposition principal selon le type de société
 */
function calculerTauxPrincipal(type: TypeSociete): number {
  switch (type) {
    case 'enseignement':
    case 'industriel':
      return CONSTANTES_FISCALES.TAUX_REDUIT;
    case 'general':
    default:
      return CONSTANTES_FISCALES.TAUX_GENERAL;
  }
}

/**
 * Calcule le taux minimum selon le secteur d'activité
 */
function calculerTauxMinimum(secteur: SecteurActivite): number {
  switch (secteur) {
    case 'immobilier':
      return CONSTANTES_FISCALES.TAUX_MIN_IMMOBILIER;
    case 'BTP':
      return CONSTANTES_FISCALES.TAUX_MIN_BTP;
    case 'general':
    default:
      return CONSTANTES_FISCALES.TAUX_MIN_GENERAL;
  }
}

/**
 * Détermine si une société bénéficie de l'exonération capital-risque
 */
function verifierExonerationCapitalRisque(
  dureeCreation?: number,
  pourcentageActionsNonCotees?: number
): boolean {
  if (dureeCreation === undefined || pourcentageActionsNonCotees === undefined) {
    return false;
  }
  return dureeCreation <= 15 && pourcentageActionsNonCotees >= 0.50;
}

/**
 * Valide les données d'entrée
 */
function validerDonnees(donnees: DonneesFiscales): void {
  if (donnees.BN < 0 && donnees.PE < Math.abs(donnees.BN)) {
    throw new Error('Les produits encaissables doivent être supérieurs ou égaux à la valeur absolue du bénéfice net');
  }
  
  if (donnees.PE < 0) {
    throw new Error('Les produits encaissables ne peuvent pas être négatifs');
  }
  
  if (donnees.RCM < 0) {
    throw new Error('Les revenus de capitaux mobiliers ne peuvent pas être négatifs');
  }
  
  if (donnees.Vpetrole !== undefined && donnees.Vpetrole < 0) {
    throw new Error('Le volume de produits pétroliers ne peut pas être négatif');
  }
}

/**
 * Fonction principale de calcul de l'IS
 */
export function calculerIS(donnees: DonneesFiscales): ResultatCalculIS {
  // Validation des données
  validerDonnees(donnees);
  
  // 1. Calcul de la base imposable
  const RCMNet = donnees.RCM * (1 - CONSTANTES_FISCALES.QUOTE_PART_MOBILIER);
  const baseImposable = Math.max(0, donnees.BN - RCMNet);
  
  // 2. Calcul du taux applicable
  const tauxPrincipal = calculerTauxPrincipal(donnees.type);
  const tauxMinimum = calculerTauxMinimum(donnees.secteur);
  
  // 3. Calcul de l'impôt théorique
  const impotTheorique = baseImposable * tauxPrincipal;
  
  // 4. Calcul des impôts minimums
  const impotMinimumStandard = donnees.PE * tauxMinimum;
  const impotMinimumStation = donnees.Vpetrole ? 
    donnees.Vpetrole * CONSTANTES_FISCALES.TAUX_STATION : 0;
  
  // 5. Impôt minimum effectif
  const impotMinimumEffectif = Math.max(
    impotMinimumStandard,
    impotMinimumStation,
    CONSTANTES_FISCALES.IMPOT_MIN_ABSOLU
  );
  
  // 6. Impôt sur les sociétés (avant exonération)
  const impotSocietes = Math.max(impotTheorique, impotMinimumEffectif);
  
  // 7. Gestion des exonérations
  const exonerationCapitalRisque = verifierExonerationCapitalRisque(
    donnees.dureeCreation,
    donnees.pourcentageActionsNonCotees
  );
  
  const estExoneree = donnees.estExoneree || exonerationCapitalRisque;
  const coefficientExoneration = estExoneree ? 0 : 1;
  
  // 8. Impôt final
  const impotFinal = impotSocietes * coefficientExoneration;
  
  // 9. Montant total à payer
  const montantTotal = impotFinal + CONSTANTES_FISCALES.REDEVANCE_ORTB;
  
  return {
    baseImposable,
    impotTheorique,
    impotMinimumStandard,
    impotMinimumStation,
    impotMinimumEffectif,
    impotSocietes,
    impotFinal,
    redevanceORTB: CONSTANTES_FISCALES.REDEVANCE_ORTB,
    montantTotal,
    tauxApplique: tauxPrincipal,
    details: {
      RCMNet,
      estExoneree,
      exonerationCapitalRisque
    }
  };
}

/**
 * Fonction utilitaire pour formater les montants en FCFA
 */
export function formaterMontant(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(montant);
}

/**
 * Fonction utilitaire pour générer un rapport détaillé
 */
export function genererRapport(donnees: DonneesFiscales): string {
  const resultat = calculerIS(donnees);
  
  return `
RAPPORT DE CALCUL DE L'IMPÔT SUR LES SOCIÉTÉS - BÉNIN
================================================================

DONNÉES D'ENTRÉE:
- Bénéfice Net: ${formaterMontant(donnees.BN)}
- Produits Encaissables: ${formaterMontant(donnees.PE)}
- Revenus de Capitaux Mobiliers: ${formaterMontant(donnees.RCM)}
- Type de société: ${donnees.type}
- Secteur d'activité: ${donnees.secteur}
- Volume produits pétroliers: ${donnees.Vpetrole || 0} litres
- Statut d'exonération: ${donnees.estExoneree ? 'Oui' : 'Non'}

CALCULS INTERMÉDIAIRES:
- Base imposable: ${formaterMontant(resultat.baseImposable)}
- RCM Net (après abattement 30%): ${formaterMontant(resultat.details.RCMNet)}
- Taux d'imposition appliqué: ${(resultat.tauxApplique * 100).toFixed(1)}%
- Impôt théorique: ${formaterMontant(resultat.impotTheorique)}
- Impôt minimum standard: ${formaterMontant(resultat.impotMinimumStandard)}
- Impôt minimum station-service: ${formaterMontant(resultat.impotMinimumStation)}
- Impôt minimum effectif: ${formaterMontant(resultat.impotMinimumEffectif)}

RÉSULTATS:
- Impôt sur les sociétés (hors exonération): ${formaterMontant(resultat.impotSocietes)}
- Exonération capital-risque: ${resultat.details.exonerationCapitalRisque ? 'Oui' : 'Non'}
- Impôt final: ${formaterMontant(resultat.impotFinal)}
- Redevance ORTB: ${formaterMontant(resultat.redevanceORTB)}

MONTANT TOTAL À PAYER: ${formaterMontant(resultat.montantTotal)}
================================================================
`;
}

// Exemples d'utilisation
export const EXEMPLES = {
  societeGenerale: (): ResultatCalculIS => {
    return calculerIS({
      BN: 10000000,
      PE: 50000000,
      RCM: 0,
      secteur: 'general',
      type: 'general',
      estExoneree: false
    });
  },
  
  societeBTPAvecPerte: (): ResultatCalculIS => {
    return calculerIS({
      BN: -2000000,
      PE: 30000000,
      RCM: 0,
      secteur: 'BTP',
      type: 'general',
      estExoneree: false
    });
  },
  
  stationService: (): ResultatCalculIS => {
    return calculerIS({
      BN: 5000000,
      PE: 20000000,
      RCM: 0,
      Vpetrole: 100000, // 100,000 litres
      secteur: 'general',
      type: 'general',
      estExoneree: false
    });
  }
};