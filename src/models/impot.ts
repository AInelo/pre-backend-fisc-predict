/**
 * Modèle de données pour les impôts et leurs constantes fiscales
 */

export interface ConstanteFiscale {
  code: string;                    // Code unique de la constante (ex: "TAUX_GENERAL")
  valeur: number | number[] | { [key: string]: number }; // Valeur de la constante
  type: 'number' | 'array' | 'object'; // Type de la valeur
  description?: string;            // Description de la constante
  unite?: string;                  // Unité (ex: "FCFA", "%", "litre")
  anneeApplicable?: number;        // Année d'application (optionnel)
}

export interface Impot {
  _id?: string;                    // ID MongoDB
  code: string;                    // Code unique de l'impôt (ex: "IBA", "IS", "PATENTE")
  nom: string;                     // Nom complet de l'impôt
  description?: string;            // Description de l'impôt
  type: 'reel' | 'tps' | 'autre'; // Type d'impôt
  anneeFiscale: number;           // Année fiscale (ex: 2025, 2026)
  constantes: ConstanteFiscale[]; // Liste des constantes fiscales
  actif: boolean;                  // Si l'impôt est actif pour cette année
  dateCreation?: Date;            // Date de création
  dateModification?: Date;        // Date de dernière modification
  version?: number;                // Version du schéma (pour migrations)
}

export interface ImpotDocument extends Impot {
  _id: string;
  dateCreation: Date;
  dateModification: Date;
}

