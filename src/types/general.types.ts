/**
 * Enumération des types d'opérations soumises à l'AIB
 */
export enum TypeOperation {
  IMPORTATION = "Importation",
  ACHAT_COMMERCIAL = "AchatCommercial",
  FOURNITURE_TRAVAUX = "FournitureTravaux",
  PRESTATION_SERVICE = "PrestationService"
}



// === Définition des types juridiques d'entreprise au Bénin ===
export type FormeJuridique =
  | 'EI'     // Entreprise Individuelle
  | 'EURL'   // Entreprise Unipersonnelle à Responsabilité Limitée
  | 'SARL'   // Société à Responsabilité Limitée
  | 'SELARL' // Société d’Exercice Libéral à Responsabilité Limitée
  | 'SA'     // Société Anonyme
  | 'SAS'    // Société par Actions Simplifiée
  | 'SASU'   // Société par Actions Simplifiée Unipersonnelle
  | 'SNC'    // Société en Nom Collectif
  | 'SCP'    // Société Civile Professionnelle
  | 'AUTRE'; // Autre type ou non renseigné

// === Types de statuts fiscaux utilisés pour déterminer le taux de retenue ===
export type StatutFiscal = 'IBA' | 'IS' | 'AUTRE';

/**
 * Détermine le statut fiscal d’un bailleur en fonction de la forme juridique de son entreprise.
 * Ce statut sert ensuite à appliquer le taux de retenue à la source adéquat (10% ou 12%).
 */
export function getStatutFiscal(forme: FormeJuridique): StatutFiscal {
  switch (forme) {
    /**
     * EI : Entreprise Individuelle
     * - Gérée par une seule personne.
     * - Imposée par défaut à l'IBA (Impôt sur les Bénéfices d'Affaires).
     */
    case 'EI':
    /**
     * EURL : Entreprise Unipersonnelle à Responsabilité Limitée
     * - SARL à associé unique.
     * - Par défaut imposée à l’IBA, mais possibilité d’option à l’IS.
     */
    case 'EURL':
    /**
     * SNC : Société en Nom Collectif
     * - Société de personnes, responsabilité solidaire.
     * - Imposée par défaut à l’IBA, mais option IS possible.
     */
    case 'SNC':
    /**
     * SCP : Société Civile Professionnelle
     * - Société pour professions libérales (notaires, avocats, etc.).
     * - Imposée sur le revenu des associés : IBA par défaut.
     */
    case 'SCP':
      return 'IBA';

    /**
     * SARL : Société à Responsabilité Limitée
     * - Société commerciale à plusieurs associés.
     * - Imposée par défaut à l’IS (Impôt sur les Sociétés).
     */
    case 'SARL':
    /**
     * SELARL : Société d’Exercice Libéral à Responsabilité Limitée
     * - Variante de SARL pour professions libérales.
     * - Régime fiscal : IS par défaut.
     */
    case 'SELARL':
    /**
     * SA : Société Anonyme
     * - Forme avancée de société, capital social important.
     * - IS obligatoire.
     */
    case 'SA':
    /**
     * SAS : Société par Actions Simplifiée
     * - Très flexible, régime par défaut IS.
     */
    case 'SAS':
    /**
     * SASU : SAS Unipersonnelle
     * - Variante de SAS à associé unique.
     * - Régime IS par défaut.
     */
    case 'SASU':
      return 'IS';

    /**
     * Autre ou non renseigné : Par prudence, statut par défaut AUTRE (→ taux plein 12%)
     */
    default:
      return 'AUTRE';
  }
}



export type NatureContribuable = 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE' | 'NON_ENREGISTRE';

/**
 * Détermine la nature juridique du contribuable à partir de la forme juridique.
 */
export function getNatureContribuable(forme: FormeJuridique): NatureContribuable {
  switch (forme) {
    case 'EI':
      return 'PERSONNE_PHYSIQUE';
    case 'EURL':
    case 'SARL':
    case 'SELARL':
    case 'SA':
    case 'SAS':
    case 'SASU':
    case 'SNC':
    case 'SCP':
      return 'PERSONNE_MORALE';
    case 'AUTRE':
    default:
      return 'NON_ENREGISTRE';
  
  }
}


/**
 * Détermine le statut fiscal en fonction de la forme juridique.
 * Si non enregistré, on suppose par défaut une personne physique à l'IBA.
 */
export function getStatutFiscalFromForme(forme: FormeJuridique): StatutFiscal {
  const nature = getNatureContribuable(forme);
  if (nature === 'PERSONNE_PHYSIQUE' || nature === 'NON_ENREGISTRE') {
    return 'IBA';
  }
  if (nature === 'PERSONNE_MORALE') {
    return 'IS';
  }
  return 'AUTRE';
}
