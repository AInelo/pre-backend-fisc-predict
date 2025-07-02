/**
 * Calculateur de Contribution des Patentes du Bénin
 * Basé sur la documentation fiscale béninoise
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

// Constantes fiscales
export const CONSTANTES_PATENTE = {
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

/**
 * Calcule le droit fixe pour les entreprises classiques
 */
function calculerDroitFixeClassique(chiffreAffaires: number, zone: ZoneGeographique): number {
  const tarifBase = zone === 'zone1' ? 
    CONSTANTES_PATENTE.TARIF_BASE_ZONE_1 : 
    CONSTANTES_PATENTE.TARIF_BASE_ZONE_2;
  
  if (chiffreAffaires <= CONSTANTES_PATENTE.SEUIL_CA_CLASSIQUE) {
    return tarifBase;
  } else {
    const depassement = chiffreAffaires - CONSTANTES_PATENTE.SEUIL_CA_CLASSIQUE;
    const supplementaire = CONSTANTES_PATENTE.COEFFICIENT_CA * (depassement / CONSTANTES_PATENTE.SEUIL_CA_CLASSIQUE);
    return tarifBase + supplementaire;
  }
}

/**
 * Calcule le droit fixe pour les importateurs/exportateurs
 */
function calculerDroitFixeImportExport(montant: number): number {
  const bareme = CONSTANTES_PATENTE.BAREME_IMPORT_EXPORT;
  
  // Trouver la tranche correspondante
  for (let i = 0; i < bareme.length; i++) {
    if (montant <= bareme[i].seuil) {
      return bareme[i].montant;
    }
  }
  
  // Si le montant dépasse le dernier seuil (10 milliards)
  const dernierSeuil = bareme[bareme.length - 1];
  const depassement = montant - 1e10; // 10 milliards
  const supplementaire = CONSTANTES_PATENTE.COEFFICIENT_CA * (depassement / CONSTANTES_PATENTE.SEUIL_CA_CLASSIQUE);
  return dernierSeuil.montant + supplementaire;
}

/**
 * Calcule le droit fixe selon le type d'entreprise
 */
function calculerDroitFixe(donnees: DonneesPatente): number {
  if (donnees.typeEntreprise === 'classique') {
    if (!donnees.chiffreAffaires || !donnees.zone) {
      throw new Error('Chiffre d\'affaires et zone requis pour les entreprises classiques');
    }
    return calculerDroitFixeClassique(donnees.chiffreAffaires, donnees.zone);
  } else {
    if (!donnees.montantImportExport) {
      throw new Error('Montant import/export requis pour les importateurs/exportateurs');
    }
    return calculerDroitFixeImportExport(donnees.montantImportExport);
  }
}

/**
 * Obtient le taux de la commune
 */
function obtenirTauxCommune(commune: Commune): number {
  return CONSTANTES_PATENTE.TAUX_COMMUNES[commune];
}

/**
 * Calcule le droit proportionnel
 */
function calculerDroitProportionnel(
  locaux: Local[], 
  commune: Commune, 
  droitFixe: number
): { droitProportionnel: number; valeurLocativeTotale: number; minimumDroitProportionnel: number } {
  const tauxCommune = obtenirTauxCommune(commune);
  
  // Calcul de la valeur locative totale (hors nouveaux locaux)
  const valeurLocativeTotale = locaux
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
function calculerPatenteSupplementaire(locaux: Local[], commune: Commune): number {
  const tauxCommune = obtenirTauxCommune(commune);
  
  return locaux
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
function calculerPatenteComplementaire(marchePublicHT: number = 0): number {
  return marchePublicHT * CONSTANTES_PATENTE.TAUX_MARCHE_PUBLIC;
}

/**
 * Détermine si l'entreprise bénéficie d'une exemption
 */
function verifierExemption(ageEntrepriseMois: number): boolean {
  return ageEntrepriseMois < CONSTANTES_PATENTE.SEUIL_EXEMPTION_MOIS;
}

/**
 * Valide les données d'entrée
 */
function validerDonnees(donnees: DonneesPatente): void {
  if (donnees.typeEntreprise === 'classique') {
    if (!donnees.chiffreAffaires || donnees.chiffreAffaires < 0) {
      throw new Error('Chiffre d\'affaires requis et doit être positif pour les entreprises classiques');
    }
    if (!donnees.zone) {
      throw new Error('Zone géographique requise pour les entreprises classiques');
    }
  }
  
  if ((donnees.typeEntreprise === 'importateur' || donnees.typeEntreprise === 'exportateur')) {
    if (!donnees.montantImportExport || donnees.montantImportExport < 0) {
      throw new Error('Montant import/export requis et doit être positif');
    }
  }
  
  if (donnees.ageEntrepriseMois < 0) {
    throw new Error('L\'âge de l\'entreprise ne peut pas être négatif');
  }
  
  donnees.locaux.forEach((local, index) => {
    if (local.valeurLocative < 0) {
      throw new Error(`La valeur locative du local ${index + 1} ne peut pas être négative`);
    }
    
    if (local.estNouveauLocal && (!local.moisRestants || local.moisRestants < 0 || local.moisRestants > 12)) {
      throw new Error(`Le nombre de mois restants pour le local ${index + 1} doit être entre 1 et 12`);
    }
  });
  
  if (donnees.marchePublicHT && donnees.marchePublicHT < 0) {
    throw new Error('Le montant des marchés publics ne peut pas être négatif');
  }
}

/**
 * Fonction principale de calcul de la patente
 */
export function calculerPatente(donnees: DonneesPatente): ResultatCalculPatente {
  // Validation des données
  validerDonnees(donnees);
  
  // 1. Calcul du droit fixe
  const droitFixe = calculerDroitFixe(donnees);
  
  // 2. Calcul du droit proportionnel
  const resultDP = calculerDroitProportionnel(donnees.locaux, donnees.commune, droitFixe);
  const droitProportionnel = resultDP.droitProportionnel;
  
  // 3. Calcul de la patente supplémentaire
  const patenteSupplementaire = calculerPatenteSupplementaire(donnees.locaux, donnees.commune);
  
  // 4. Calcul de la patente complémentaire
  const patenteComplementaire = calculerPatenteComplementaire(donnees.marchePublicHT);
  
  // 5. Patente de base
  const patenteBase = droitFixe + droitProportionnel + patenteSupplementaire + patenteComplementaire;
  
  // 6. Gestion de l'exemption
  const exemption = verifierExemption(donnees.ageEntrepriseMois);
  const coefficientExemption = exemption ? 0 : 1;
  
  // 7. Patente finale
  const patenteFinale = patenteBase * coefficientExemption;
  
  // 8. Calcul de l'acompte et du solde
  const acompte = patenteFinale * CONSTANTES_PATENTE.TAUX_ACOMPTE;
  const solde = patenteFinale - acompte;
  
  // Calcul des valeurs pour les détails
  const valeurLocativeNouveaux = donnees.locaux
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
    tauxCommune: obtenirTauxCommune(donnees.commune),
    details: {
      valeurLocativeTotale: resultDP.valeurLocativeTotale,
      valeurLocativeNouveaux,
      minimumDroitProportionnel: resultDP.minimumDroitProportionnel
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
export function genererRapportPatente(donnees: DonneesPatente): string {
  const resultat = calculerPatente(donnees);
  
  return `
RAPPORT DE CALCUL DE LA CONTRIBUTION DES PATENTES - BÉNIN
============================================================

DONNÉES D'ENTRÉE:
- Type d'entreprise: ${donnees.typeEntreprise}
- Chiffre d'affaires: ${donnees.chiffreAffaires ? formaterMontant(donnees.chiffreAffaires) : 'N/A'}
- Montant import/export: ${donnees.montantImportExport ? formaterMontant(donnees.montantImportExport) : 'N/A'}
- Zone géographique: ${donnees.zone || 'N/A'}
- Commune: ${donnees.commune}
- Nombre de locaux: ${donnees.locaux.length}
- Marché public HT: ${donnees.marchePublicHT ? formaterMontant(donnees.marchePublicHT) : '0'}
- Âge de l'entreprise: ${donnees.ageEntrepriseMois} mois

DÉTAILS DES LOCAUX:
${donnees.locaux.map((local, index) => 
  `- Local ${index + 1}: ${formaterMontant(local.valeurLocative)} ${local.estNouveauLocal ? `(nouveau - ${local.moisRestants} mois restants)` : ''}`
).join('\n')}

CALCULS:
- Droit fixe: ${formaterMontant(resultat.droitFixe)}
- Droit proportionnel: ${formaterMontant(resultat.droitProportionnel)}
  * Valeur locative totale: ${formaterMontant(resultat.details.valeurLocativeTotale)}
  * Taux commune (${donnees.commune}): ${(resultat.tauxCommune * 100).toFixed(1)}%
  * Minimum légal (Df/3): ${formaterMontant(resultat.details.minimumDroitProportionnel)}
- Patente supplémentaire: ${formaterMontant(resultat.patenteSupplementaire)}
- Patente complémentaire: ${formaterMontant(resultat.patenteComplementaire)}

RÉSULTATS:
- Patente de base: ${formaterMontant(resultat.patenteBase)}
- Exemption (< 12 mois): ${resultat.exemption ? 'Oui' : 'Non'}
- Patente finale: ${formaterMontant(resultat.patenteFinale)}

MODALITÉS DE PAIEMENT:
- Acompte (50%): ${formaterMontant(resultat.acompte)}
- Solde: ${formaterMontant(resultat.solde)}

MONTANT TOTAL: ${formaterMontant(resultat.patenteFinale)}
============================================================
`;
}

// Exemples d'utilisation
export const EXEMPLES_PATENTE = {
  commerceZone1: (): ResultatCalculPatente => {
    return calculerPatente({
      typeEntreprise: 'classique',
      chiffreAffaires: 1.5e9, // 1.5 milliards
      zone: 'zone1',
      commune: 'cotonou',
      locaux: [
        { valeurLocative: 2e6 } // 2 millions
      ],
      ageEntrepriseMois: 24
    });
  },
  
  importateur: (): ResultatCalculPatente => {
    return calculerPatente({
      typeEntreprise: 'importateur',
      montantImportExport: 3e8, // 300 millions
      commune: 'porto-novo',
      locaux: [
        { valeurLocative: 5e5 } // 500,000
      ],
      ageEntrepriseMois: 36
    });
  },
  
  entrepriseExemptee: (): ResultatCalculPatente => {
    return calculerPatente({
      typeEntreprise: 'classique',
      chiffreAffaires: 5e8, // 500 millions
      zone: 'zone2',
      commune: 'parakou',
      locaux: [
        { valeurLocative: 1e6 } // 1 million
      ],
      ageEntrepriseMois: 6 // Moins de 12 mois = exemption
    });
  },
  
  avecNouveauxLocaux: (): ResultatCalculPatente => {
    return calculerPatente({
      typeEntreprise: 'classique',
      chiffreAffaires: 8e8, // 800 millions
      zone: 'zone1',
      commune: 'ouidah',
      locaux: [
        { valeurLocative: 1.5e6 }, // Local existant
        { 
          valeurLocative: 5e5, 
          estNouveauLocal: true, 
          moisRestants: 8 
        } // Nouveau local
      ],
      marchePublicHT: 1e7, // 10 millions
      ageEntrepriseMois: 18
    });
  }
};