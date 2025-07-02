// aib.service.ts

import {
  CalculateurAIB,
  ParametresAIB,
  ResultatAIB
} from '../models/AIB';

export class AIBService {
  /**
   * Effectue une simulation complète de l'AIB
   * @param params Les paramètres de la transaction
   * @returns Résultat du calcul
   */
  static simulerAIB(params: ParametresAIB): ResultatAIB {
    return CalculateurAIB.calculerAIB(params);
  }

  /**
   * Retourne un résumé texte du calcul AIB
   * @param resultat Résultat du calcul
   * @returns Chaîne formatée
   */
  static resumeCalcul(resultat: ResultatAIB): string {
    return CalculateurAIB.afficherResume(resultat);
  }

  /**
   * Retourne le montant total formaté en FCFA
   * @param resultat Résultat du calcul
   * @returns Montant total formaté
   */
  static formaterMontantTotal(resultat: ResultatAIB): string {
    return CalculateurAIB.formaterMontant(resultat.montantTotal);
  }

  /**
   * Permet de tester l'éligibilité à l'exonération seule (hors simulation complète)
   * @returns Vrai si exonéré, sinon faux
   */
  static estExonere(
    estNouvelleEntreprise: boolean,
    releveTPS: boolean,
    ancienneteEnMois: number
  ): boolean {
    // Copie logique identique à celle de CalculateurAIB
    return estNouvelleEntreprise && releveTPS && ancienneteEnMois <= 12;
  }
}
