// Service for TPS
import { TPS } from '../models/tps/TPS';
import { MoteurCalculTPS } from '../models/tps/TPS';
import type { ConfigurationTPS } from '../models/tps/TPS';

export class TPSService {
  static calculerTPS(config: ConfigurationTPS) {
    // On utilise la méthode statique pour créer et calculer directement
    const moteur = (global as any).MoteurCalculTPS
      ? (global as any).MoteurCalculTPS.creerAvecConfiguration(config)
      : require('../models/tps/TPS').MoteurCalculTPS.creerAvecConfiguration(config);
    return moteur.calculer();
  }

  static validerConfiguration(config: ConfigurationTPS) {
    const moteur = (global as any).MoteurCalculTPS
      ? (global as any).MoteurCalculTPS.creerAvecConfiguration(config)
      : require('../models/tps/TPS').MoteurCalculTPS.creerAvecConfiguration(config);
    return moteur.validerConfiguration();
  }

  static genererRapport(config: ConfigurationTPS) {
    const moteur = (global as any).MoteurCalculTPS
      ? (global as any).MoteurCalculTPS.creerAvecConfiguration(config)
      : require('../models/tps/TPS').MoteurCalculTPS.creerAvecConfiguration(config);
    return moteur.genererRapport();
  }
}
