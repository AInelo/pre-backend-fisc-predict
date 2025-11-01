/**
 * Calculateur d'Impôt sur les Sociétés (IS) du Bénin
 * Basé sur la documentation fiscale béninoise
 * Version orientée objet
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
  redevanceSRTB: number;
  montantTotal: number;
  tauxApplique: number;
  details: {
    RCMNet: number;
    estExoneree: boolean;
    exonerationCapitalRisque: boolean;
  };
}

/**
 * Classe principale pour le calcul de l'Impôt sur les Sociétés au Bénin
 */
export class CalculateurIS {
  // Constantes fiscales
  private static readonly CONSTANTES_FISCALES = {
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
    REDEVANCE_SRTB: 4000,     // FCFA
    
    // Quote-parts
    QUOTE_PART_MOBILIER: 0.30
  } as const;

  private donneesFiscales: DonneesFiscales;
  private resultatCalcul?: ResultatCalculIS;

  /**
   * Constructeur du calculateur
   * @param donnees - Données fiscales de la société
   */
  constructor(donnees: DonneesFiscales) {
    this.validerDonnees(donnees);
    this.donneesFiscales = { ...donnees };
  }

  /**
   * Calcule le taux d'imposition principal selon le type de société
   */
  private calculerTauxPrincipal(type: TypeSociete): number {
    switch (type) {
      case 'enseignement':
      case 'industriel':
        return CalculateurIS.CONSTANTES_FISCALES.TAUX_REDUIT;
      case 'general':
      default:
        return CalculateurIS.CONSTANTES_FISCALES.TAUX_GENERAL;
    }
  }

  /**
   * Calcule le taux minimum selon le secteur d'activité
   */
  private calculerTauxMinimum(secteur: SecteurActivite): number {
    switch (secteur) {
      case 'immobilier':
        return CalculateurIS.CONSTANTES_FISCALES.TAUX_MIN_IMMOBILIER;
      case 'BTP':
        return CalculateurIS.CONSTANTES_FISCALES.TAUX_MIN_BTP;
      case 'general':
      default:
        return CalculateurIS.CONSTANTES_FISCALES.TAUX_MIN_GENERAL;
    }
  }

  /**
   * Détermine si une société bénéficie de l'exonération capital-risque
   */
  private verifierExonerationCapitalRisque(
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
  private validerDonnees(donnees: DonneesFiscales): void {
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
   * Effectue le calcul de l'IS et stocke le résultat
   */
  public calculer(): ResultatCalculIS {
    const donnees = this.donneesFiscales;
    
    // 1. Calcul de la base imposable
    const RCMNet = donnees.RCM * (1 - CalculateurIS.CONSTANTES_FISCALES.QUOTE_PART_MOBILIER);
    const baseImposable = Math.max(0, donnees.BN - RCMNet);
    
    // 2. Calcul du taux applicable
    const tauxPrincipal = this.calculerTauxPrincipal(donnees.type);
    const tauxMinimum = this.calculerTauxMinimum(donnees.secteur);
    
    // 3. Calcul de l'impôt théorique
    const impotTheorique = baseImposable * tauxPrincipal;
    
    // 4. Calcul des impôts minimums
    const impotMinimumStandard = donnees.PE * tauxMinimum;
    const impotMinimumStation = donnees.Vpetrole ? 
      donnees.Vpetrole * CalculateurIS.CONSTANTES_FISCALES.TAUX_STATION : 0;
    
    // 5. Impôt minimum effectif
    const impotMinimumEffectif = Math.max(
      impotMinimumStandard,
      impotMinimumStation,
      CalculateurIS.CONSTANTES_FISCALES.IMPOT_MIN_ABSOLU
    );
    
    // 6. Impôt sur les sociétés (avant exonération)
    const impotSocietes = Math.max(impotTheorique, impotMinimumEffectif);
    
    // 7. Gestion des exonérations
    const exonerationCapitalRisque = this.verifierExonerationCapitalRisque(
      donnees.dureeCreation,
      donnees.pourcentageActionsNonCotees
    );
    
    const estExoneree = donnees.estExoneree || exonerationCapitalRisque;
    const coefficientExoneration = estExoneree ? 0 : 1;
    
    // 8. Impôt final
    const impotFinal = impotSocietes * coefficientExoneration;
    
    // 9. Montant total à payer
    const montantTotal = impotFinal + CalculateurIS.CONSTANTES_FISCALES.REDEVANCE_SRTB;
    
    this.resultatCalcul = {
      baseImposable,
      impotTheorique,
      impotMinimumStandard,
      impotMinimumStation,
      impotMinimumEffectif,
      impotSocietes,
      impotFinal,
      redevanceSRTB: CalculateurIS.CONSTANTES_FISCALES.REDEVANCE_SRTB,
      montantTotal,
      tauxApplique: tauxPrincipal,
      details: {
        RCMNet,
        estExoneree,
        exonerationCapitalRisque
      }
    };

    return this.resultatCalcul;
  }

  /**
   * Retourne le dernier résultat de calcul
   */
  public obtenirResultat(): ResultatCalculIS | null {
    return this.resultatCalcul || null;
  }

  /**
   * Met à jour les données fiscales et invalide le calcul précédent
   */
  public mettreAJourDonnees(nouvellesDonnees: Partial<DonneesFiscales>): void {
    const donneesMAJ = { ...this.donneesFiscales, ...nouvellesDonnees };
    this.validerDonnees(donneesMAJ);
    this.donneesFiscales = donneesMAJ;
    this.resultatCalcul = undefined; // Invalider le calcul précédent
  }

  /**
   * Retourne les données fiscales actuelles
   */
  public obtenirDonnees(): DonneesFiscales {
    return { ...this.donneesFiscales };
  }

  /**
   * Formate un montant en FCFA
   */
  public static formaterMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant);
  }


  /**
   * Méthode statique pour effectuer un calcul rapide
   */
  public static calculerRapide(donnees: DonneesFiscales): ResultatCalculIS {
    const calculateur = new CalculateurIS(donnees);
    return calculateur.calculer();
  }

  /**
   * Calcul pour la création d'entreprise (prévisionnel)
   * On accepte des données estimées, la méthode applique la formule complète
   */
  public calculerCreationEntreprise(): ResultatCalculIS {
    // Idem que calculer() car c'est une prévision, on fait juste un alias clair
    return this.calculer();
  }

  /**
   * Calcul pour simulation financière (business plan)
   * On peut ici ajouter des validations spécifiques ou adaptations futures
   */
  public calculerSimulationFinanciere(): ResultatCalculIS {
    // Pour l'instant même logique que calculer()
    return this.calculer();
  }

  /**
   * Calcul pour la déclaration fiscale avec données réelles validées
   */
  public calculerDeclarationFiscale(): ResultatCalculIS {
    // Idem calculer() car on suppose les données validées comptables
    return this.calculer();
  }

  /**
   * Calcul d'impact d'exonération
   * Cette méthode peut calculer l'impôt avec et sans exonération pour comparaison
   */
  public calculerImpactExoneration(): { sansExoneration: ResultatCalculIS; avecExoneration: ResultatCalculIS } {
    // Sauvegarder état initial exonération
    const estExonereeOriginal = this.donneesFiscales.estExoneree;

    // Calcul sans exonération
    this.mettreAJourDonnees({ estExoneree: false });
    const sansExon = this.calculer();

    // Calcul avec exonération
    this.mettreAJourDonnees({ estExoneree: true });
    const avecExon = this.calculer();

    // Restaurer état original
    this.mettreAJourDonnees({ estExoneree: estExonereeOriginal });

    return { sansExoneration: sansExon, avecExoneration: avecExon };
  }

  /**
   * Calcul pour bilan ou audit fiscal
   * Ici on vérifie que même en cas de perte, l'impôt minimum est bien appliqué
   */
  public calculerBilanAuditFiscal(): ResultatCalculIS {
    // On force la base imposable >= 0 dans le calcul
    const baseImposable = Math.max(0, this.donneesFiscales.BN - this.donneesFiscales.RCM * (1 - CalculateurIS.CONSTANTES_FISCALES.QUOTE_PART_MOBILIER));
    this.mettreAJourDonnees({ BN: baseImposable });
    return this.calculer();
  }

  /**
   * Calcul dans le cadre d'une reprise d'activité ou cession
   * Possibilité de proratiser l'impôt selon la durée d'activité
   * @param dureeActivite Nombre de mois d'activité dans l'exercice (1 à 12)
   */
  public calculerRepriseCession(dureeActivite: number): ResultatCalculIS {
    if (dureeActivite < 1 || dureeActivite > 12) {
      throw new Error('La durée d\'activité doit être comprise entre 1 et 12 mois');
    }

    // Calcul complet de l'impôt annuel
    const resultatAnnuel = this.calculer();

    // Proratisation de l'impôt selon la durée
    const prorata = dureeActivite / 12;
    const montantTotalProrata = resultatAnnuel.montantTotal * prorata;

    // Mise à jour du résultat avec prorata
    return {
      ...resultatAnnuel,
      impotFinal: resultatAnnuel.impotFinal * prorata,
      impotSocietes: resultatAnnuel.impotSocietes * prorata,
      impotMinimumEffectif: resultatAnnuel.impotMinimumEffectif * prorata,
      impotMinimumStandard: resultatAnnuel.impotMinimumStandard * prorata,
      impotMinimumStation: resultatAnnuel.impotMinimumStation * prorata,
      impotTheorique: resultatAnnuel.impotTheorique * prorata,
      montantTotal: montantTotalProrata,
      details: { ...resultatAnnuel.details }
    };
  }






}






















//   /**
//    * Génère un rapport détaillé du calcul
//    */
//   public genererRapport(): string {
//     if (!this.resultatCalcul) {
//       throw new Error('Aucun calcul effectué. Veuillez d\'abord appeler la méthode calculer()');
//     }

//     const r = this.resultatCalcul;
//     const d = this.donneesFiscales;

//     return `
// === RAPPORT DE CALCUL IS - BÉNIN ===

// DONNÉES DE BASE:
// - Bénéfice Net: ${CalculateurIS.formaterMontant(d.BN)}
// - Produits Encaissables: ${CalculateurIS.formaterMontant(d.PE)}
// - Revenus Capitaux Mobiliers: ${CalculateurIS.formaterMontant(d.RCM)}
// - Secteur: ${d.secteur}
// - Type de société: ${d.type}
// ${d.Vpetrole ? `- Volume produits pétroliers: ${d.Vpetrole.toLocaleString()} litres` : ''}

// CALCULS:
// - Base imposable: ${CalculateurIS.formaterMontant(r.baseImposable)}
// - RCM Net (après quote-part): ${CalculateurIS.formaterMontant(r.details.RCMNet)}
// - Taux appliqué: ${(r.tauxApplique * 100).toFixed(1)}%
// - Impôt théorique: ${CalculateurIS.formaterMontant(r.impotTheorique)}

// IMPÔTS MINIMUMS:
// - Minimum standard: ${CalculateurIS.formaterMontant(r.impotMinimumStandard)}
// ${r.impotMinimumStation > 0 ? `- Minimum station-service: ${CalculateurIS.formaterMontant(r.impotMinimumStation)}` : ''}
// - Minimum effectif: ${CalculateurIS.formaterMontant(r.impotMinimumEffectif)}

// RÉSULTAT FINAL:
// - Impôt sur les sociétés: ${CalculateurIS.formaterMontant(r.impotSocietes)}
// ${r.details.estExoneree ? '- EXONÉRATION APPLIQUÉE' : ''}
// - Impôt final: ${CalculateurIS.formaterMontant(r.impotFinal)}
// - Redevance SRTB: ${CalculateurIS.formaterMontant(r.redevanceSRTB)}
// - MONTANT TOTAL À PAYER: ${CalculateurIS.formaterMontant(r.montantTotal)}
//     `.trim();
//   }




































// /**
//  * Calculateur d'Impôt sur les Sociétés (IS) du Bénin
//  * Basé sur la documentation fiscale béninoise
//  */

// // Types et interfaces
// export type SecteurActivite = 'general' | 'BTP' | 'immobilier';
// export type TypeSociete = 'general' | 'enseignement' | 'industriel';

// export interface DonneesFiscales {
//   BN: number;              // Bénéfice Net
//   PE: number;              // Produits Encaissables
//   RCM: number;             // Revenus de Capitaux Mobiliers
//   Vpetrole?: number;       // Volume produits pétroliers (litres)
//   secteur: SecteurActivite;// Secteur d'activité
//   type: TypeSociete;       // Type de société
//   estExoneree: boolean;    // Statut d'exonération
//   dureeCreation?: number;  // Durée depuis création (années) - pour capital-risque
//   pourcentageActionsNonCotees?: number; // % actions non cotées - pour capital-risque
// }

// export interface ResultatCalculIS {
//   baseImposable: number;
//   impotTheorique: number;
//   impotMinimumStandard: number;
//   impotMinimumStation: number;
//   impotMinimumEffectif: number;
//   impotSocietes: number;
//   impotFinal: number;
//   redevanceSRTB: number;
//   montantTotal: number;
//   tauxApplique: number;
//   details: {
//     RCMNet: number;
//     estExoneree: boolean;
//     exonerationCapitalRisque: boolean;
//   };
// }

// // Constantes fiscales
// export const CONSTANTES_FISCALES = {
//   // Taux d'imposition
//   TAUX_GENERAL: 0.30,
//   TAUX_REDUIT: 0.25,
  
//   // Taux minimums
//   TAUX_MIN_GENERAL: 0.01,
//   TAUX_MIN_BTP: 0.03,
//   TAUX_MIN_IMMOBILIER: 0.10,
  
//   // Taux station-service
//   TAUX_STATION: 0.60, // FCFA par litre
  
//   // Montants fixes
//   IMPOT_MIN_ABSOLU: 250000, // FCFA
//   REDEVANCE_SRTB: 4000,     // FCFA
  
//   // Quote-parts
//   QUOTE_PART_MOBILIER: 0.30
// } as const;

// /**
//  * Calcule le taux d'imposition principal selon le type de société
//  */
// function calculerTauxPrincipal(type: TypeSociete): number {
//   switch (type) {
//     case 'enseignement':
//     case 'industriel':
//       return CONSTANTES_FISCALES.TAUX_REDUIT;
//     case 'general':
//     default:
//       return CONSTANTES_FISCALES.TAUX_GENERAL;
//   }
// }

// /**
//  * Calcule le taux minimum selon le secteur d'activité
//  */
// function calculerTauxMinimum(secteur: SecteurActivite): number {
//   switch (secteur) {
//     case 'immobilier':
//       return CONSTANTES_FISCALES.TAUX_MIN_IMMOBILIER;
//     case 'BTP':
//       return CONSTANTES_FISCALES.TAUX_MIN_BTP;
//     case 'general':
//     default:
//       return CONSTANTES_FISCALES.TAUX_MIN_GENERAL;
//   }
// }

// /**
//  * Détermine si une société bénéficie de l'exonération capital-risque
//  */
// function verifierExonerationCapitalRisque(
//   dureeCreation?: number,
//   pourcentageActionsNonCotees?: number
// ): boolean {
//   if (dureeCreation === undefined || pourcentageActionsNonCotees === undefined) {
//     return false;
//   }
//   return dureeCreation <= 15 && pourcentageActionsNonCotees >= 0.50;
// }

// /**
//  * Valide les données d'entrée
//  */
// function validerDonnees(donnees: DonneesFiscales): void {
//   if (donnees.BN < 0 && donnees.PE < Math.abs(donnees.BN)) {
//     throw new Error('Les produits encaissables doivent être supérieurs ou égaux à la valeur absolue du bénéfice net');
//   }
  
//   if (donnees.PE < 0) {
//     throw new Error('Les produits encaissables ne peuvent pas être négatifs');
//   }
  
//   if (donnees.RCM < 0) {
//     throw new Error('Les revenus de capitaux mobiliers ne peuvent pas être négatifs');
//   }
  
//   if (donnees.Vpetrole !== undefined && donnees.Vpetrole < 0) {
//     throw new Error('Le volume de produits pétroliers ne peut pas être négatif');
//   }
// }

// /**
//  * Fonction principale de calcul de l'IS
//  */
// export function calculerIS(donnees: DonneesFiscales): ResultatCalculIS {
//   // Validation des données
//   validerDonnees(donnees);
  
//   // 1. Calcul de la base imposable
//   const RCMNet = donnees.RCM * (1 - CONSTANTES_FISCALES.QUOTE_PART_MOBILIER);
//   const baseImposable = Math.max(0, donnees.BN - RCMNet);
  
//   // 2. Calcul du taux applicable
//   const tauxPrincipal = calculerTauxPrincipal(donnees.type);
//   const tauxMinimum = calculerTauxMinimum(donnees.secteur);
  
//   // 3. Calcul de l'impôt théorique
//   const impotTheorique = baseImposable * tauxPrincipal;
  
//   // 4. Calcul des impôts minimums
//   const impotMinimumStandard = donnees.PE * tauxMinimum;
//   const impotMinimumStation = donnees.Vpetrole ? 
//     donnees.Vpetrole * CONSTANTES_FISCALES.TAUX_STATION : 0;
  
//   // 5. Impôt minimum effectif
//   const impotMinimumEffectif = Math.max(
//     impotMinimumStandard,
//     impotMinimumStation,
//     CONSTANTES_FISCALES.IMPOT_MIN_ABSOLU
//   );
  
//   // 6. Impôt sur les sociétés (avant exonération)
//   const impotSocietes = Math.max(impotTheorique, impotMinimumEffectif);
  
//   // 7. Gestion des exonérations
//   const exonerationCapitalRisque = verifierExonerationCapitalRisque(
//     donnees.dureeCreation,
//     donnees.pourcentageActionsNonCotees
//   );
  
//   const estExoneree = donnees.estExoneree || exonerationCapitalRisque;
//   const coefficientExoneration = estExoneree ? 0 : 1;
  
//   // 8. Impôt final
//   const impotFinal = impotSocietes * coefficientExoneration;
  
//   // 9. Montant total à payer
//   const montantTotal = impotFinal + CONSTANTES_FISCALES.REDEVANCE_SRTB;
  
//   return {
//     baseImposable,
//     impotTheorique,
//     impotMinimumStandard,
//     impotMinimumStation,
//     impotMinimumEffectif,
//     impotSocietes,
//     impotFinal,
//     redevanceSRTB: CONSTANTES_FISCALES.REDEVANCE_SRTB,
//     montantTotal,
//     tauxApplique: tauxPrincipal,
//     details: {
//       RCMNet,
//       estExoneree,
//       exonerationCapitalRisque
//     }
//   };
// }









// /**
//  * Fonction utilitaire pour formater les montants en FCFA
//  */
// export function formaterMontant(montant: number): string {
//   return new Intl.NumberFormat('fr-FR', {
//     style: 'currency',
//     currency: 'XOF',
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0
//   }).format(montant);
// }









// /**
//  * Fonction utilitaire pour générer un rapport détaillé
//  */
// export function genererRapport(donnees: DonneesFiscales): string {
//   const resultat = calculerIS(donnees);
  
//   return `
// RAPPORT DE CALCUL DE L'IMPÔT SUR LES SOCIÉTÉS - BÉNIN
// ================================================================

// DONNÉES D'ENTRÉE:
// - Bénéfice Net: ${formaterMontant(donnees.BN)}
// - Produits Encaissables: ${formaterMontant(donnees.PE)}
// - Revenus de Capitaux Mobiliers: ${formaterMontant(donnees.RCM)}
// - Type de société: ${donnees.type}
// - Secteur d'activité: ${donnees.secteur}
// - Volume produits pétroliers: ${donnees.Vpetrole || 0} litres
// - Statut d'exonération: ${donnees.estExoneree ? 'Oui' : 'Non'}

// CALCULS INTERMÉDIAIRES:
// - Base imposable: ${formaterMontant(resultat.baseImposable)}
// - RCM Net (après abattement 30%): ${formaterMontant(resultat.details.RCMNet)}
// - Taux d'imposition appliqué: ${(resultat.tauxApplique * 100).toFixed(1)}%
// - Impôt théorique: ${formaterMontant(resultat.impotTheorique)}
// - Impôt minimum standard: ${formaterMontant(resultat.impotMinimumStandard)}
// - Impôt minimum station-service: ${formaterMontant(resultat.impotMinimumStation)}
// - Impôt minimum effectif: ${formaterMontant(resultat.impotMinimumEffectif)}

// RÉSULTATS:
// - Impôt sur les sociétés (hors exonération): ${formaterMontant(resultat.impotSocietes)}
// - Exonération capital-risque: ${resultat.details.exonerationCapitalRisque ? 'Oui' : 'Non'}
// - Impôt final: ${formaterMontant(resultat.impotFinal)}
// - Redevance SRTB: ${formaterMontant(resultat.redevanceSRTB)}

// MONTANT TOTAL À PAYER: ${formaterMontant(resultat.montantTotal)}
// ================================================================
// `;
// }










// // // Exemples d'utilisation
// // export const EXEMPLES = {
// //   societeGenerale: (): ResultatCalculIS => {
// //     return calculerIS({
// //       BN: 10000000,
// //       PE: 50000000,
// //       RCM: 0,
// //       secteur: 'general',
// //       type: 'general',
// //       estExoneree: false
// //     });
// //   },
  
// //   societeBTPAvecPerte: (): ResultatCalculIS => {
// //     return calculerIS({
// //       BN: -2000000,
// //       PE: 30000000,
// //       RCM: 0,
// //       secteur: 'BTP',
// //       type: 'general',
// //       estExoneree: false
// //     });
// //   },
  
// //   stationService: (): ResultatCalculIS => {
// //     return calculerIS({
// //       BN: 5000000,
// //       PE: 20000000,
// //       RCM: 0,
// //       Vpetrole: 100000, // 100,000 litres
// //       secteur: 'general',
// //       type: 'general',
// //       estExoneree: false
// //     });
// //   }
// // };