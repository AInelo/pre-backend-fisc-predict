// Service for IS
import { CalculateurIS, DonneesFiscales } from '../models/reel/IS';

export class ISService {
  // TODO: implement service methods for IS

  static calculerIS(donnees: DonneesFiscales) {
    return CalculateurIS.calculerRapide(donnees);
  }

  static calculerCreationEntreprise(donnees: DonneesFiscales) {
    const calc = new CalculateurIS(donnees);
    return calc.calculerCreationEntreprise();
  }

  static calculerSimulationFinanciere(donnees: DonneesFiscales) {
    const calc = new CalculateurIS(donnees);
    return calc.calculerSimulationFinanciere();
  }

  static calculerDeclarationFiscale(donnees: DonneesFiscales) {
    const calc = new CalculateurIS(donnees);
    return calc.calculerDeclarationFiscale();
  }

  static calculerImpactExoneration(donnees: DonneesFiscales) {
    const calc = new CalculateurIS(donnees);
    return calc.calculerImpactExoneration();
  }

  static calculerBilanAuditFiscal(donnees: DonneesFiscales) {
    const calc = new CalculateurIS(donnees);
    return calc.calculerBilanAuditFiscal();
  }

  static calculerRepriseCession(donnees: DonneesFiscales, dureeActivite: number) {
    const calc = new CalculateurIS(donnees);
    return calc.calculerRepriseCession(dureeActivite);
  }
}
