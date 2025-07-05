// Service for VPS
import { CalculateurVPS, Entreprise, Salarie } from '../models/reel/VPS';

export class VPSService {
  // TODO: implement service methods for VPS

  static calculerVPS(entreprise: Entreprise, salaries: Salarie[], dateCalcul?: Date) {
    const calc = new CalculateurVPS();
    return calc.calculerVPS(entreprise, salaries, dateCalcul);
  }
}
