// Service for IRF
import { CalculateurIRF } from '../models/reel/IRF';
import type { ParametresCalculMensuel, ParametresCalculAnnuel, TransactionLoyer, StatutFiscal } from '../models/reel/IRF';

export class IRFService {
  private static calculateur = new CalculateurIRF();

  static calculerMensuel(params: ParametresCalculMensuel, datePaiement?: Date) {
    return this.calculateur.calculerMensuel(params, datePaiement);
  }

  static calculerAnnuel(params: ParametresCalculAnnuel) {
    return this.calculateur.calculerAnnuel(params);
  }

  static calculerAvecChangementStatut(loyersMensuels: number[], ancienStatut: StatutFiscal, nouveauStatut: StatutFiscal, moisChangement: number) {
    return this.calculateur.calculerAvecChangementStatut(loyersMensuels, ancienStatut, nouveauStatut, moisChangement);
  }

  static calculerLoyersVariables(loyersEtStatuts: Array<{ loyer: number; statut: StatutFiscal }>) {
    return this.calculateur.calculerLoyersVariables(loyersEtStatuts);
  }

  static calculerJusquaCession(transactions: TransactionLoyer[], dateCession: Date) {
    return this.calculateur.calculerJusquaCession(transactions, dateCession);
  }

  static evaluerRentabiliteNet(loyerMensuel: number, statutFiscal: StatutFiscal, montantAchat: number, chargesAnnuelles: number) {
    return this.calculateur.evaluerRentabiliteNet(loyerMensuel, statutFiscal, montantAchat, chargesAnnuelles);
  }

  static detecterRetards(transactions: TransactionLoyer[]) {
    return this.calculateur.detecterRetards(transactions);
  }

  static simulationContrat(loyerMensuel: number, statutFiscal: StatutFiscal) {
    return this.calculateur.simulationContrat(loyerMensuel, statutFiscal);
  }

  static synthesePeriode(transactions: TransactionLoyer[], dateDebut: Date, dateFin: Date) {
    return this.calculateur.synthesePeriode(transactions, dateDebut, dateFin);
  }
}
