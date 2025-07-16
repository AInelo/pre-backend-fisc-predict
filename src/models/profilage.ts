// ==========================
// === TYPES & INTERFACES ===
// ==========================

/**
 * Interface de base pour les informations d'un contribuable
 */
export interface Contribuable {
  nom: string;
  immatricule: boolean;
  dateCreation: Date;
  chiffreAffaireAnnuel: number; // CA sur la période fiscale
}

/**
 * Enumération des régimes fiscaux
 */
export enum RegimeFiscal {
  TPS = "TPS",
  REEL = "Réel",
}

/**
 * Interface de résultat du profilage fiscal
 */
export interface ProfilFiscal {
  regime: RegimeFiscal;
  commentaire: string;
}

// ==========================
// === LOGIQUE DE PROFILAGE ===
// ==========================

/**
 * Fonction qui détermine le régime fiscal applicable à un contribuable
 * basé sur les règles fiscales béninoises.
 */
export function profilerContribuable(contribuable: Contribuable): ProfilFiscal {
  const seuilReel = 50_000_000;

  if (!contribuable.immatricule) {
    return {
      regime: RegimeFiscal.TPS,
      commentaire: "Contribuable non immatriculé – par défaut au régime TPS.",
    };
  }

  if (contribuable.chiffreAffaireAnnuel > seuilReel) {
    return {
      regime: RegimeFiscal.REEL,
      commentaire: "Chiffre d'affaires supérieur à 50 millions – régime Réel.",
    };
  }

  return {
    regime: RegimeFiscal.TPS,
    commentaire: "Chiffre d'affaires ≤ 50 millions – régime TPS.",
  };
}
