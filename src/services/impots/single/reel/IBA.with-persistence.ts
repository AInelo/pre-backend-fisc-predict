/**
 * Exemple d'utilisation de la persistance pour IBA
 * Cette classe montre comment utiliser les constantes depuis la base de données
 * 
 * NOTE: Ce fichier est un exemple. Pour l'utiliser, remplacez IBA.ts par cette version
 * ou adaptez votre classe existante selon ce modèle.
 */

import { DonneesIBA, ResultatIBA, TypeActivite, SecteurActivite, ConditionsReduction } from './IBA';
import { ConstantesFiscalesService } from '../constantes-fiscales.service';

/**
 * Interface pour les constantes IBA typées
 */
interface ConstantesIBA {
  TAUX_GENERAL: number;
  TAUX_ENSEIGNEMENT: number;
  MINIMUM_GENERAL: number;
  MINIMUM_BTP: number;
  MINIMUM_IMMOBILIER: number;
  TAUX_PETROLIER: number;
  MINIMUM_ABSOLU_GENERAL: number;
  MINIMUM_ABSOLU_STATIONS: number;
  REDEVANCE_SRTB: number;
  SEUIL_REGIME_REEL: number;
}

/**
 * Classe CalculateurIBA avec persistance des constantes
 * 
 * Cette version charge les constantes depuis MongoDB au lieu de les avoir hardcodées
 */
export class CalculateurIBAWithPersistence {
  private static constantesService = new ConstantesFiscalesService();
  
  /**
   * Charge les constantes depuis la base de données pour une année donnée
   */
  private static async chargerConstantes(anneeFiscale: number): Promise<ConstantesIBA> {
    try {
      // Utiliser le cache pour éviter les appels répétés
      const constantes = await this.constantesService.getConstantesCached('IBA', anneeFiscale);
      return constantes as ConstantesIBA;
    } catch (error) {
      console.error(`Erreur lors du chargement des constantes IBA pour ${anneeFiscale}:`, error);
      // Valeurs par défaut en cas d'erreur (fallback)
      return this.getConstantesParDefaut();
    }
  }

  /**
   * Retourne les constantes par défaut en cas d'erreur de chargement
   */
  private static getConstantesParDefaut(): ConstantesIBA {
    return {
      TAUX_GENERAL: 0.30,
      TAUX_ENSEIGNEMENT: 0.25,
      MINIMUM_GENERAL: 0.015,
      MINIMUM_BTP: 0.03,
      MINIMUM_IMMOBILIER: 0.10,
      TAUX_PETROLIER: 0.60,
      MINIMUM_ABSOLU_GENERAL: 500_000,
      MINIMUM_ABSOLU_STATIONS: 250_000,
      REDEVANCE_SRTB: 4_000,
      SEUIL_REGIME_REEL: 50_000_000
    };
  }

  /**
   * Calcule l'IBA selon les règles fiscales béninoises
   * 
   * @param donnees - Données d'entrée pour le calcul
   * @param anneeFiscale - Année fiscale (par défaut: année actuelle)
   */
  public static async calculerIBA(
    donnees: DonneesIBA,
    anneeFiscale: number = new Date().getFullYear()
  ): Promise<ResultatIBA> {
    // Charger les constantes depuis la base de données
    const CONSTANTES = await this.chargerConstantes(anneeFiscale);

    // Étape 1: Vérifier exonération
    if (donnees.estExonere) {
      return this.creerResultatExonere();
    }

    // Validation des données
    this.validerDonnees(donnees, CONSTANTES);

    // Étape 2: Calculer l'impôt nominal
    const tauxNominal = this.obtenirTauxNominal(donnees.typeActivite, CONSTANTES);
    const impotNominal = donnees.beneficeImposable * tauxNominal;

    // Étape 3: Calculer l'impôt minimum sectoriel
    const tauxMinimumSectoriel = this.obtenirTauxMinimumSectoriel(donnees.secteurActivite, CONSTANTES);
    const impotMinimumSectoriel = this.calculerImpotMinimumSectoriel(
      donnees.secteurActivite,
      donnees.produitsEncaissables,
      donnees.volumeProduitsPetroliers,
      tauxMinimumSectoriel,
      CONSTANTES
    );

    // Étape 4: Déterminer l'impôt de base
    const minimumAbsolu = this.obtenirMinimumAbsolu(donnees.secteurActivite, CONSTANTES);
    const impotBase = Math.max(impotNominal, impotMinimumSectoriel, minimumAbsolu);

    // Étape 5: Appliquer les réductions
    const facteurReduction = this.obtenirFacteurReduction(donnees.conditionsReduction);
    const impotApresReduction = impotBase * facteurReduction;

    // Étape 6: Calcul final
    const iba = impotApresReduction + CONSTANTES.REDEVANCE_SRTB;

    return {
      iba: Math.round(iba),
      impotNominal: Math.round(impotNominal),
      impotMinimumSectoriel: Math.round(impotMinimumSectoriel),
      impotBase: Math.round(impotBase),
      impotApresReduction: Math.round(impotApresReduction),
      redevanceSRTB: CONSTANTES.REDEVANCE_SRTB,
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
  private static obtenirTauxNominal(
    typeActivite: TypeActivite,
    constantes: ConstantesIBA
  ): number {
    switch (typeActivite) {
      case TypeActivite.ENSEIGNEMENT_PRIVE:
        return constantes.TAUX_ENSEIGNEMENT;
      default:
        return constantes.TAUX_GENERAL;
    }
  }

  /**
   * Fonction de minimum sectoriel
   */
  private static obtenirTauxMinimumSectoriel(
    secteur: SecteurActivite,
    constantes: ConstantesIBA
  ): number {
    switch (secteur) {
      case SecteurActivite.BTP:
        return constantes.MINIMUM_BTP;
      case SecteurActivite.IMMOBILIER:
        return constantes.MINIMUM_IMMOBILIER;
      default:
        return constantes.MINIMUM_GENERAL;
    }
  }

  /**
   * Calcul de l'impôt minimum sectoriel
   */
  private static calculerImpotMinimumSectoriel(
    secteur: SecteurActivite,
    produitsEncaissables: number,
    volumeProduitsPetroliers: number | undefined,
    tauxMinimum: number,
    constantes: ConstantesIBA
  ): number {
    if (secteur === SecteurActivite.STATIONS_SERVICES) {
      if (!volumeProduitsPetroliers) {
        throw new Error('Volume de produits pétroliers requis pour les stations-services');
      }
      return volumeProduitsPetroliers * constantes.TAUX_PETROLIER;
    }
    
    return produitsEncaissables * tauxMinimum;
  }

  /**
   * Fonction de minimum absolu
   */
  private static obtenirMinimumAbsolu(
    secteur: SecteurActivite,
    constantes: ConstantesIBA
  ): number {
    switch (secteur) {
      case SecteurActivite.STATIONS_SERVICES:
        return constantes.MINIMUM_ABSOLU_STATIONS;
      default:
        return constantes.MINIMUM_ABSOLU_GENERAL;
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
      redevanceSRTB: 0,
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
  private static validerDonnees(donnees: DonneesIBA, constantes: ConstantesIBA): void {
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
    if (donnees.chiffreAffaires > constantes.SEUIL_REGIME_REEL) {
      console.warn('Attention: CA > 50M FCFA, passage au régime réel recommandé');
    }
  }

  /**
   * Estime l'IBA pour une période partielle de l'année (en mois)
   */
  public static async estimerIBAProportionnel(
    donnees: DonneesIBA,
    dureeEnMois: number,
    anneeFiscale: number = new Date().getFullYear()
  ): Promise<ResultatIBA> {
    if (dureeEnMois <= 0 || dureeEnMois > 12) {
      throw new Error('La durée doit être comprise entre 1 et 12 mois');
    }

    const resultatAnnuel = await this.calculerIBA(donnees, anneeFiscale);
    const coefficient = dureeEnMois / 12;

    return {
      ...resultatAnnuel,
      iba: Math.round(resultatAnnuel.iba * coefficient),
      impotNominal: Math.round(resultatAnnuel.impotNominal * coefficient),
      impotMinimumSectoriel: Math.round(resultatAnnuel.impotMinimumSectoriel * coefficient),
      impotBase: Math.round(resultatAnnuel.impotBase * coefficient),
      impotApresReduction: Math.round(resultatAnnuel.impotApresReduction * coefficient),
    };
  }
}

