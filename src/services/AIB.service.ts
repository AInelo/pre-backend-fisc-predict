// aib.service.ts

import {
  CalculateurAIB,
  ParametresAIB,
  ResultatAIB
} from '../models/reel/AIB';

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

  /**
   * Estimation avant transaction commerciale
   */
  static estimerAvantTransaction(params: ParametresAIB) {
    return CalculateurAIB.estimerAvantTransaction(params);
  }

  /**
   * Vérification lors de la déclaration fiscale (multi-opérations)
   */
  static verifierPourDeclaration(operations: ParametresAIB[]) {
    return CalculateurAIB.verifierPourDeclaration(operations);
  }

  /**
   * Simulation en phase de négociation avec un client/public
   */
  static simulerRetenuePourNegociation(params: ParametresAIB) {
    return CalculateurAIB.simulerRetenuePourNegociation(params);
  }

  /**
   * Estimation pour planification financière (multi-mois / prévisions)
   */
  static planifierChargesFiscales(previsions: ParametresAIB[]) {
    return CalculateurAIB.planifierChargesFiscales(previsions);
  }

  /**
   * Reconstitution pour contrôle fiscal ou audit
   */
  static reconstituerPourControle(operations: ParametresAIB[]) {
    return CalculateurAIB.reconstituerPourControle(operations);
  }
}
