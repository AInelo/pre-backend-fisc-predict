// Constantes du système
export const CONSTANTES_IRF = {
  TAUX_NORMAL: 0.12,      // 12%
  TAUX_REDUIT: 0.10,      // 10%
  RORTB: 4000,            // FCFA
  JOUR_ECHEANCE: 10       // 10ème jour du mois
} as const;



// 1.1 Constantes du système
export const CONSTANTES_TVA = {
  TAUX_NORMAL: 0.18,           // τnormal = 18%
  TAUX_EXONERE: 0,             // τexonéré = 0%
  SEUIL_EXONERATION: 50000000, // 50 000 000 FCFA
  JOUR_LIMITE_DECLARATION: 10   // 10ème jour du mois
};
