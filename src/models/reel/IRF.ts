// 🧠 Comment connaît-on ce statut fiscal Sb en pratique ?
// Le statut fiscal dépend du type d'immatriculation fiscale du bailleur :

// Type de bailleur	Régime fiscal typique	Statut Sb
// Personne physique exerçant en nom propre et immatriculée	IBA (Impôt sur les Bénéfices d’Affaires)	"IBA"
// Personne morale (société)	IS (Impôt sur les Sociétés)	"IS"
// Bailleur non immatriculé (souvent personne physique non enregistrée)	Autres statuts — non IBA/IS	autre (donc τ = 12%)








/**
 * IRF - Impôt sur les Revenus Fonciers
 * République du Bénin - Système de Taxation Immobilière
 */

// Constantes du système
export const CONSTANTES_IRF = {
  TAUX_NORMAL: 0.12,      // 12%
  TAUX_REDUIT: 0.10,      // 10%
  RORTB: 4000,            // FCFA
  JOUR_ECHEANCE: 10       // 10ème jour du mois
} as const;

// Types et énumérations
export enum StatutFiscal {
  IBA = 'IBA',  // Impôt sur les Bénéfices d'Affaires
  IS = 'IS',    // Impôt sur les Sociétés
  AUTRE = 'AUTRE'
}

export enum TypeVersement {
  NORMAL = 'NORMAL',
  ANTICIPE = 'ANTICIPE'
}

// Interface pour une transaction de loyer
export interface TransactionLoyer {
  loyerBrut: number;
  statutFiscal: StatutFiscal;
  dateVersement: Date;
  moisConcerne?: number; // Pour les loyers anticipés
}

// Interface pour les paramètres de calcul mensuel
export interface ParametresCalculMensuel {
  loyerBrut: number;
  statutFiscal: StatutFiscal;
  dateVersement: Date;
  typeVersement?: TypeVersement;
  moisAvance?: number; // Nombre de mois d'avance pour loyer anticipé
}

// Interface pour les paramètres de calcul annuel
export interface ParametresCalculAnnuel {
  transactions: TransactionLoyer[];
  annee: number;
}

// Interface pour les résultats
export interface ResultatCalculIRF {
  loyerBrut: number;
  tauxApplique: number;
  retenuesFiscales: number;
  loyerNet: number;
  dateEcheance: Date;
  conforme: boolean;
  retard: number; // en jours
  // details: string;
}

export interface ResultatCalculAnnuel {
  retenuesTotales: number;
  obligationTotale: number; // Retenues + RORTB
  tauxEffectif: number;
  impactFinancier: number;
  nombreTransactions: number;
  loyerBrutTotal: number;
  // details: string;
}





export class CalculateurIRF {

  /**
   * Détermine le taux d'imposition selon le statut fiscal
   */
  private determinerTaux(statutFiscal: StatutFiscal): number {
    switch (statutFiscal) {
      case StatutFiscal.IBA:
      case StatutFiscal.IS:
        return CONSTANTES_IRF.TAUX_REDUIT;
      default:
        return CONSTANTES_IRF.TAUX_NORMAL;
    }
  }

  /**
   * Calcule la date d'échéance selon le type de versement
   */
  private calculerDateEcheance(dateVersement: Date, typeVersement: TypeVersement = TypeVersement.NORMAL, moisAvance: number = 0): Date {
    const dateEcheance = new Date(dateVersement);
    
    if (typeVersement === TypeVersement.NORMAL) {
      // Échéance au 10 du mois suivant
      dateEcheance.setMonth(dateEcheance.getMonth() + 1);
    } else {
      // Loyer anticipé : échéance au 10 du mois suivant le versement
      dateEcheance.setMonth(dateEcheance.getMonth() + 1);
    }
    
    dateEcheance.setDate(CONSTANTES_IRF.JOUR_ECHEANCE);
    return dateEcheance;
  }

  /**
   * Calcule le retard en jours
   */
  private calculerRetard(datePaiement: Date, dateEcheance: Date): number {
    if (datePaiement <= dateEcheance) {
      return 0;
    }
    const diffTime = datePaiement.getTime() - dateEcheance.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Vérifie la conformité du paiement
   */
  private verifierConformite(datePaiement: Date, dateEcheance: Date): boolean {
    return this.calculerRetard(datePaiement, dateEcheance) === 0;
  }

  /**
   * Calcul principal pour une transaction mensuelle
   */
  public calculerMensuel(params: ParametresCalculMensuel, datePaiement: Date = new Date()): ResultatCalculIRF {
    // Validation des paramètres
    if (params.loyerBrut <= 0) {
      throw new Error('Le loyer brut doit être positif');
    }

    // Détermination du taux
    const taux = this.determinerTaux(params.statutFiscal);

    // Calculs fondamentaux
    const retenuesFiscales = params.loyerBrut * taux;
    const loyerNet = params.loyerBrut - retenuesFiscales;

    // Calcul de la date d'échéance
    const dateEcheance = this.calculerDateEcheance(
      params.dateVersement, 
      params.typeVersement, 
      params.moisAvance
    );

    // Vérification de conformité
    const retard = this.calculerRetard(datePaiement, dateEcheance);
    const conforme = this.verifierConformite(datePaiement, dateEcheance);

    return {
      loyerBrut: params.loyerBrut,
      tauxApplique: taux,
      retenuesFiscales: Math.round(retenuesFiscales),
      loyerNet: Math.round(loyerNet),
      dateEcheance,
      conforme,
      retard,
      // details: this.genererDetailsMensuel(params, taux, retenuesFiscales, loyerNet, dateEcheance, conforme, retard)
    };
  }

  /**
   * Calcul annuel pour multiple transactions
   */
  public calculerAnnuel(params: ParametresCalculAnnuel): ResultatCalculAnnuel {
    if (params.transactions.length === 0) {
      throw new Error('Aucune transaction fournie pour le calcul annuel');
    }

    let retenuesTotales = 0;
    let loyerBrutTotal = 0;

    // Calcul des retenues pour chaque transaction
    for (const transaction of params.transactions) {
      const taux = this.determinerTaux(transaction.statutFiscal);
      const retenue = transaction.loyerBrut * taux;
      
      retenuesTotales += retenue;
      loyerBrutTotal += transaction.loyerBrut;
    }

    // Calculs des métriques
    const obligationTotale = retenuesTotales + CONSTANTES_IRF.RORTB;
    const tauxEffectif = loyerBrutTotal > 0 ? (retenuesTotales / loyerBrutTotal) * 100 : 0;
    const impactFinancier = tauxEffectif / 100;

    return {
      retenuesTotales: Math.round(retenuesTotales),
      obligationTotale: Math.round(obligationTotale),
      tauxEffectif: Math.round(tauxEffectif * 100) / 100,
      impactFinancier: Math.round(impactFinancier * 10000) / 10000,
      nombreTransactions: params.transactions.length,
      loyerBrutTotal: Math.round(loyerBrutTotal),
      // details: this.genererDetailsAnnuel(params, retenuesTotales, obligationTotale, tauxEffectif, loyerBrutTotal)
    };
  }

  /**
   * Calcul pour changement de statut en cours d'année
   */
  public calculerAvecChangementStatut(
    loyersMensuels: number[],
    ancienStatut: StatutFiscal,
    nouveauStatut: StatutFiscal,
    moisChangement: number
  ): { 
    retenuesTotales: number; 
    // details: string 
  } {
    if (moisChangement < 1 || moisChangement > 12) {
      throw new Error('Le mois de changement doit être entre 1 et 12');
    }

    const tauxAncien = this.determinerTaux(ancienStatut);
    const tauxNouveau = this.determinerTaux(nouveauStatut);

    let retenuesTotales = 0;

    // Calcul avec ancien statut (mois 1 à moisChangement-1)
    for (let i = 0; i < moisChangement - 1; i++) {
      if (loyersMensuels[i]) {
        retenuesTotales += loyersMensuels[i] * tauxAncien;
      }
    }

    // Calcul avec nouveau statut (mois moisChangement à 12)
    for (let i = moisChangement - 1; i < 12; i++) {
      if (loyersMensuels[i] && loyersMensuels[i] > 0) {
        retenuesTotales += loyersMensuels[i] * tauxNouveau;
      }
    }

    const details = `Changement de statut au mois ${moisChangement}:\n` +
                   `- Ancien statut (${ancienStatut}): ${(tauxAncien * 100).toFixed(1)}%\n` +
                   `- Nouveau statut (${nouveauStatut}): ${(tauxNouveau * 100).toFixed(1)}%\n` +
                   `- Retenues totales: ${Math.round(retenuesTotales)} FCFA`;

    return {
      retenuesTotales: Math.round(retenuesTotales),
      // details
    };
  }

  /**
   * Calcul pour loyers variables
   */
  public calculerLoyersVariables(
    loyersEtStatuts: Array<{ loyer: number; statut: StatutFiscal }>
  ): { 
    retenuesTotales: number; 
    // details: string 
  } {
    let retenuesTotales = 0;
    let details = 'Calcul loyers variables:\n';

    loyersEtStatuts.forEach((item, index) => {
      const taux = this.determinerTaux(item.statut);
      const retenue = item.loyer * taux;
      retenuesTotales += retenue;
      
      details += `- Mois ${index + 1}: ${item.loyer} FCFA × ${(taux * 100).toFixed(1)}% = ${Math.round(retenue)} FCFA\n`;
    });

    details += `Total des retenues: ${Math.round(retenuesTotales)} FCFA`;

    return {
      retenuesTotales: Math.round(retenuesTotales),
      // details
    };
  }

 

  /**
   * Génération des détails pour le calcul annuel
   */
  private genererDetailsAnnuel(
    params: ParametresCalculAnnuel,
    retenuesTotales: number,
    obligationTotale: number,
    tauxEffectif: number,
    loyerBrutTotal: number
  ): string {
    let details = `Calcul IRF annuel ${params.annee}:\n`;
    details += `- Nombre de transactions: ${params.transactions.length}\n`;
    details += `- Loyers bruts totaux: ${Math.round(loyerBrutTotal).toLocaleString()} FCFA\n`;
    details += `- Retenues fiscales totales: ${Math.round(retenuesTotales).toLocaleString()} FCFA\n`;
    details += `- RORTB: ${CONSTANTES_IRF.RORTB.toLocaleString()} FCFA\n`;
    details += `- Obligation totale: ${Math.round(obligationTotale).toLocaleString()} FCFA\n`;
    details += `- Taux effectif: ${tauxEffectif.toFixed(2)}%\n`;
    details += `- Impact financier: ${(tauxEffectif / 100).toFixed(4)}`;
    
    return details;
  }

  /**
   * Fonction utilitaire pour calculer rapidement le loyer net
   */
  public calculerLoyerNet(loyerBrut: number, statutFiscal: StatutFiscal): number {
    const taux = this.determinerTaux(statutFiscal);
    return loyerBrut * (1 - taux);
  }

  /**
   * Fonction utilitaire pour calculer rapidement les retenues
   */
  public calculerRetenues(loyerBrut: number, statutFiscal: StatutFiscal): number {
    const taux = this.determinerTaux(statutFiscal);
    return loyerBrut * taux;
  }








  /**
 * Calcul de l'IRF jusqu'à une date de cession (ex: vente du bien)
 */
public calculerJusquaCession(
  transactions: TransactionLoyer[],
  dateCession: Date
): {
  retenuesTotales: number;
  nombreTransactions: number;
  loyerBrutTotal: number;
} {
  const transactionsFiltrees = transactions.filter(tx => tx.dateVersement <= dateCession);

  let retenuesTotales = 0;
  let loyerBrutTotal = 0;

  for (const tx of transactionsFiltrees) {
    const taux = this.determinerTaux(tx.statutFiscal);
    const retenue = tx.loyerBrut * taux;
    retenuesTotales += retenue;
    loyerBrutTotal += tx.loyerBrut;
  }

  return {
    retenuesTotales: Math.round(retenuesTotales),
    nombreTransactions: transactionsFiltrees.length,
    loyerBrutTotal: Math.round(loyerBrutTotal),
  };
}





/**
 * Évalue la rentabilité nette d'un investissement immobilier après IRF
 */
public evaluerRentabiliteNet(
  loyerMensuel: number,
  statutFiscal: StatutFiscal,
  montantAchat: number,
  chargesAnnuelles: number
): {
  revenuAnnuelNet: number;
  rentabiliteNetPourcent: number;
} {
  const loyerNetMensuel = this.calculerLoyerNet(loyerMensuel, statutFiscal);
  const revenuAnnuelNet = (loyerNetMensuel * 12) - chargesAnnuelles;
  const rentabilite = (revenuAnnuelNet / montantAchat) * 100;

  return {
    revenuAnnuelNet: Math.round(revenuAnnuelNet),
    rentabiliteNetPourcent: Math.round(rentabilite * 100) / 100,
  };
}









/**
 * Calcule les montants dus et détecte les retards pour chaque transaction
 */
public detecterRetards(
  transactions: TransactionLoyer[]
): Array<ResultatCalculIRF> {
  const resultats: ResultatCalculIRF[] = [];

  for (const tx of transactions) {
    const params: ParametresCalculMensuel = {
      loyerBrut: tx.loyerBrut,
      statutFiscal: tx.statutFiscal,
      dateVersement: tx.dateVersement,
      typeVersement: TypeVersement.NORMAL
    };

    const result = this.calculerMensuel(params, tx.dateVersement);
    resultats.push(result);
  }

  return resultats;
}






/**
 * Simule le montant net perçu par le bailleur sur un loyer proposé
 */
public simulationContrat(
  loyerMensuel: number,
  statutFiscal: StatutFiscal
): {
  tauxApplique: number;
  retenueMensuelle: number;
  loyerNet: number;
} {
  const taux = this.determinerTaux(statutFiscal);
  const retenue = loyerMensuel * taux;
  const net = loyerMensuel - retenue;

  return {
    tauxApplique: taux,
    retenueMensuelle: Math.round(retenue),
    loyerNet: Math.round(net)
  };
}



/**
 * Synthèse d'une période d'imposition (utile pour voir tout en un)
 */
public synthesePeriode(
  transactions: TransactionLoyer[],
  dateDebut: Date,
  dateFin: Date
): {
  totalIRF: number;
  totalLoyerBrut: number;
  moyenneMensuelle: number;
  tauxEffectif: number;
} {
  const periodTransactions = transactions.filter(tx => tx.dateVersement >= dateDebut && tx.dateVersement <= dateFin);
  let totalIRF = 0;
  let totalBrut = 0;

  for (const tx of periodTransactions) {
    const taux = this.determinerTaux(tx.statutFiscal);
    totalIRF += tx.loyerBrut * taux;
    totalBrut += tx.loyerBrut;
  }

  const nombreMois = (dateFin.getFullYear() - dateDebut.getFullYear()) * 12 + (dateFin.getMonth() - dateDebut.getMonth()) + 1;

  return {
    totalIRF: Math.round(totalIRF),
    totalLoyerBrut: Math.round(totalBrut),
    moyenneMensuelle: Math.round(totalBrut / nombreMois),
    tauxEffectif: totalBrut > 0 ? Math.round((totalIRF / totalBrut) * 10000) / 100 : 0
  };
}








}

























// // Export d'une instance par défaut
// export const calculateurIRF = new CalculateurIRF();

// // Fonctions utilitaires pour un accès rapide
// export function calculerIRFMensuel(params: ParametresCalculMensuel, datePaiement?: Date): ResultatCalculIRF {
//   return calculateurIRF.calculerMensuel(params, datePaiement);
// }

// export function calculerIRFAnnuel(params: ParametresCalculAnnuel): ResultatCalculAnnuel {
//   return calculateurIRF.calculerAnnuel(params);
// }

// export function calculerLoyerNet(loyerBrut: number, statutFiscal: StatutFiscal): number {
//   return calculateurIRF.calculerLoyerNet(loyerBrut, statutFiscal);
// }

// export function calculerRetenues(loyerBrut: number, statutFiscal: StatutFiscal): number {
//   return calculateurIRF.calculerRetenues(loyerBrut, statutFiscal);
// }





// /**
  //  * Génération des détails pour le calcul mensuel
  //  */
  // private genererDetailsMensuel(
  //   params: ParametresCalculMensuel,
  //   taux: number,
  //   retenues: number,
  //   loyerNet: number,
  //   dateEcheance: Date,
  //   conforme: boolean,
  //   retard: number
  // ): string {
  //   let details = `Calcul IRF mensuel:\n`;
  //   details += `- Loyer brut: ${params.loyerBrut.toLocaleString()} FCFA\n`;
  //   details += `- Statut fiscal: ${params.statutFiscal}\n`;
  //   details += `- Taux appliqué: ${(taux * 100).toFixed(1)}%\n`;
  //   details += `- Retenues fiscales: ${Math.round(retenues).toLocaleString()} FCFA\n`;
  //   details += `- Loyer net: ${Math.round(loyerNet).toLocaleString()} FCFA\n`;
  //   details += `- Date d'échéance: ${dateEcheance.toLocaleDateString('fr-FR')}\n`;
  //   details += `- Statut: ${conforme ? 'Conforme' : `En retard de ${retard} jour(s)`}`;
    
  //   return details;
  // }