// Service for PATENTE
import { CalculateurPatentes, DonneesPatente } from '../models/reel/PATENTE';

export class PATENTEService {
  static calculerPatente(donnees: DonneesPatente) {
    return CalculateurPatentes.calculer(donnees);
  }

  static estimerCreationEntreprise(donnees: DonneesPatente) {
    const calc = new CalculateurPatentes(donnees);
    return calc.estimerCreationEntreprise();
  }

  static estimerDeclarationAnnuelle(donnees: DonneesPatente) {
    const calc = new CalculateurPatentes(donnees);
    return calc.estimerDeclarationAnnuelle();
  }

  static estimerPatenteComplementaire(donnees: DonneesPatente) {
    const calc = new CalculateurPatentes(donnees);
    return calc.estimerPatenteComplementaire();
  }

  static estimerPatenteSupplementaire(donnees: DonneesPatente) {
    const calc = new CalculateurPatentes(donnees);
    return calc.estimerPatenteSupplementaire();
  }

  static estimerPourZone(donnees: DonneesPatente) {
    const calc = new CalculateurPatentes(donnees);
    return calc.estimerPourZone();
  }

  static estimerFinExoneration(donnees: DonneesPatente) {
    const calc = new CalculateurPatentes(donnees);
    return calc.estimerFinExoneration();
  }
}
