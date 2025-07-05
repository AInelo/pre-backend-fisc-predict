// Service for IBA
import CalculateurIBA, { DonneesIBA } from '../models/reel/IBA';

export class IBAService {
  // TODO: implement service methods for IBA

  static calculerIBA(donnees: DonneesIBA) {
    return CalculateurIBA.calculerIBA(donnees);
  }

  static estimerIBAProportionnel(donnees: DonneesIBA, dureeEnMois: number) {
    return CalculateurIBA.estimerIBAProportionnel(donnees, dureeEnMois);
  }

  static simulerReduction(donnees: DonneesIBA) {
    return CalculateurIBA.simulerReduction(donnees);
  }

  static verifierEligibiliteRegimeReel(donnees: DonneesIBA) {
    return CalculateurIBA.verifierEligibiliteRegimeReel(donnees);
  }

  static simulerBusinessPlan(donnees: DonneesIBA, dureeEnMois: number) {
    return CalculateurIBA.simulerBusinessPlan(donnees, dureeEnMois);
  }

  static verifierCoherenceAudit(donnees: DonneesIBA, ibaDeclare: number) {
    return CalculateurIBA.verifierCoherenceAudit(donnees, ibaDeclare);
  }
}
