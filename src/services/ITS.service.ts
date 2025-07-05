// Service for ITS

import { CalculateurITS, ParametresITS } from '../models/reel/ITS';

export class ITSService {
  static calculerITS(params: ParametresITS) {
    return CalculateurITS.calculerITS(params);
  }

  static calculerITSAnnuel(salaireBrutMensuel: number) {
    return CalculateurITS.calculerITSAnnuel(salaireBrutMensuel);
  }

  static calculerITSParPeriode(salaireBrutMensuel: number, moisDebut: number, moisFin: number) {
    return CalculateurITS.calculerITSParPeriode(salaireBrutMensuel, moisDebut, moisFin);
  }

  static calculerScenariosITS(salaireBruts: number[], mois: number) {
    return CalculateurITS.calculerScenariosITS(salaireBruts, mois);
  }

  static verifierPrelevementITS(salaireBrut: number, mois: number, montantPreleve: number) {
    return CalculateurITS.verifierPrelevementITS(salaireBrut, mois, montantPreleve);
  }

  static estimerRevenuNet(salaireBrut: number, mois: number) {
    return CalculateurITS.estimerRevenuNet(salaireBrut, mois);
  }

  static calculerITSAvecChangement(salaireBrutAvant: number, moisAvantFin: number, salaireBrutApres: number, moisApresDebut: number) {
    return CalculateurITS.calculerITSAvecChangement(salaireBrutAvant, moisAvantFin, salaireBrutApres, moisApresDebut);
  }

  static calculerRevenuNetSurPeriode(salaireBrutMensuel: number, moisDebut: number, moisFin: number) {
    return CalculateurITS.calculerRevenuNetSurPeriode(salaireBrutMensuel, moisDebut, moisFin);
  }
}
