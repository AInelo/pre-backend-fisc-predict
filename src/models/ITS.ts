// ITS.ts - Calculateur d'Impôt sur les Traitements et Salaires (Bénin)

/**
 * Interface pour les paramètres de calcul ITS
 */
export interface ParametresITS {
  salaireBrut: number;
  mois: number; // 1-12 pour janvier-décembre
}

/**
 * Interface pour le résultat du calcul ITS
 */
export interface ResultatITS {
  salaireBrut: number;
  baseImposable: number;
  impotITS: number;
  redevanceORTB: number;
  totalPrelevements: number;
  salaireNet: number;
  trancheAppliquee: number;
  detailTranches: DetailTranche[];
}

/**
 * Interface pour le détail d'une tranche fiscale
 */
export interface DetailTranche {
  numero: number;
  borneInferieure: number;
  borneSuperieure: number | null;
  taux: number;
  montantImposable: number;
  impotTranche: number;
}

/**
 * Tranche fiscale
 */
interface TrancheITS {
  numero: number;
  borneInf: number;
  borneSup: number | null;
  taux: number;
  libelle: string;
}

/**
 * Constantes fiscales pour l'ITS
 */
const TRANCHES_ITS: TrancheITS[] = [
  { numero: 1, borneInf: 0, borneSup: 60000, taux: 0.00, libelle: "Tranche 1 (0%)" },
  { numero: 2, borneInf: 60000, borneSup: 150000, taux: 0.10, libelle: "Tranche 2 (10%)" },
  { numero: 3, borneInf: 150000, borneSup: 250000, taux: 0.15, libelle: "Tranche 3 (15%)" },
  { numero: 4, borneInf: 250000, borneSup: 500000, taux: 0.19, libelle: "Tranche 4 (19%)" },
  { numero: 5, borneInf: 500000, borneSup: null, taux: 0.30, libelle: "Tranche 5 (30%)" }
];

/**
 * Constantes ORTB
 */
const ORTB_MARS = 1000; // FCFA
const ORTB_JUIN = 3000; // FCFA
const SEUIL_EXONERATION_ORTB_JUIN = 60000; // FCFA

/**
 * Classe principale pour le calcul de l'ITS
 */
export class CalculateurITS {

  /**
   * Calcule l'impôt ITS selon le barème progressif
   */
  private static calculerITSProgresif(baseImposable: number): { impot: number, detailTranches: DetailTranche[] } {
    let impotTotal = 0;
    const detailTranches: DetailTranche[] = [];

    for (const tranche of TRANCHES_ITS) {
      const borneInf = tranche.borneInf;
      const borneSup = tranche.borneSup ?? Number.MAX_SAFE_INTEGER;
      
      if (baseImposable <= borneInf) {
        // Base imposable inférieure à la borne inférieure de cette tranche
        detailTranches.push({
          numero: tranche.numero,
          borneInferieure: borneInf,
          borneSuperieure: tranche.borneSup,
          taux: tranche.taux,
          montantImposable: 0,
          impotTranche: 0
        });
        continue;
      }

      // Calcul du montant imposable dans cette tranche
      const montantDansTranche = Math.min(baseImposable - borneInf, borneSup - borneInf);
      const impotTranche = montantDansTranche * tranche.taux;
      
      impotTotal += impotTranche;

      detailTranches.push({
        numero: tranche.numero,
        borneInferieure: borneInf,
        borneSuperieure: tranche.borneSup,
        taux: tranche.taux,
        montantImposable: montantDansTranche,
        impotTranche: impotTranche
      });

      // Si on a atteint la dernière tranche applicable
      if (tranche.borneSup === null || baseImposable <= borneSup) {
        break;
      }
    }

    return { impot: Math.round(impotTotal), detailTranches };
  }

  /**
   * Calcule l'ITS selon les formules développées (méthode alternative pour vérification)
   */
  private static calculerITSFormuleDeveloppe(baseImposable: number): number {
    const B = baseImposable;

    if (B <= 60000) {
      // Tranche 1
      return 0;
    } else if (B <= 150000) {
      // Tranche 2
      return 0.10 * (B - 60000);
    } else if (B <= 250000) {
      // Tranche 3
      return 9000 + 0.15 * (B - 150000);
    } else if (B <= 500000) {
      // Tranche 4
      return 24000 + 0.19 * (B - 250000);
    } else {
      // Tranche 5
      return 71500 + 0.30 * (B - 500000);
    }
  }

  /**
   * Calcule la redevance ORTB selon le mois et le salaire
   */
  private static calculerRedevanceORTB(baseImposable: number, mois: number): number {
    if (mois === 3) {
      // Mars
      return ORTB_MARS;
    } else if (mois === 6) {
      // Juin
      return baseImposable > SEUIL_EXONERATION_ORTB_JUIN ? ORTB_JUIN : 0;
    }
    return 0;
  }

  /**
   * Détermine la tranche fiscale principale applicable
   */
  private static determinerTrancheAppliquee(baseImposable: number): number {
    for (let i = TRANCHES_ITS.length - 1; i >= 0; i--) {
      const tranche = TRANCHES_ITS[i];
      if (baseImposable > tranche.borneInf) {
        return tranche.numero;
      }
    }
    return 1;
  }

  /**
   * Méthode principale de calcul de l'ITS
   */
  public static calculerITS(parametres: ParametresITS): ResultatITS {
    const { salaireBrut, mois } = parametres;

    // Validation des paramètres
    if (salaireBrut < 0) {
      throw new Error("Le salaire brut ne peut pas être négatif");
    }

    if (mois < 1 || mois > 12) {
      throw new Error("Le mois doit être compris entre 1 et 12");
    }

    // Base imposable = salaire brut (pas d'abattement mentionné dans la doc)
    const baseImposable = salaireBrut;

    // Calcul de l'ITS
    const { impot: impotITS, detailTranches } = this.calculerITSProgresif(baseImposable);

    // Calcul de la redevance ORTB
    const redevanceORTB = this.calculerRedevanceORTB(baseImposable, mois);

    // Total des prélèvements
    const totalPrelevements = impotITS + redevanceORTB;

    // Salaire net
    const salaireNet = salaireBrut - totalPrelevements;

    // Tranche appliquée
    const trancheAppliquee = this.determinerTrancheAppliquee(baseImposable);

    return {
      salaireBrut: salaireBrut,
      baseImposable: baseImposable,
      impotITS: impotITS,
      redevanceORTB: redevanceORTB,
      totalPrelevements: totalPrelevements,
      salaireNet: salaireNet,
      trancheAppliquee: trancheAppliquee,
      detailTranches: detailTranches
    };
  }

  /**
   * Vérifie la cohérence entre les deux méthodes de calcul
   */
  public static verifierCoherence(baseImposable: number): boolean {
    const resultatProgressif = this.calculerITSProgresif(baseImposable).impot;
    const resultatFormule = Math.round(this.calculerITSFormuleDeveloppe(baseImposable));
    
    return Math.abs(resultatProgressif - resultatFormule) <= 1; // Tolérance d'arrondi
  }

  /**
   * Formate un montant en FCFA
   */
  public static formaterMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(montant).replace('XOF', 'FCFA');
  }

  /**
   * Affiche un résumé détaillé du calcul
   */
  public static afficherResume(resultat: ResultatITS, mois: number): string {
    const nomsMois = [
      '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];

    let resume = `
            === CALCUL ITS - ${nomsMois[mois]} ===
            Salaire brut: ${this.formaterMontant(resultat.salaireBrut)}
            Base imposable: ${this.formaterMontant(resultat.baseImposable)}
            Tranche fiscale applicable: ${resultat.trancheAppliquee}

            --- DÉTAIL PAR TRANCHES ---
        `;

    for (const tranche of resultat.detailTranches) {
      if (tranche.montantImposable > 0) {
            const borneSup = tranche.borneSuperieure === null ? '+∞' : this.formaterMontant(tranche.borneSuperieure);
            resume += `
            Tranche ${tranche.numero} (${this.formaterMontant(tranche.borneInferieure)} - ${borneSup}) à ${(tranche.taux * 100).toFixed(0)}%:
            Montant imposable: ${this.formaterMontant(tranche.montantImposable)}
            Impôt: ${this.formaterMontant(tranche.impotTranche)}`;
        }
    }

    resume += `
        --- RÉCAPITULATIF ---
        Impôt ITS: ${this.formaterMontant(resultat.impotITS)}
        Redevance ORTB: ${this.formaterMontant(resultat.redevanceORTB)}
    `;

    if (resultat.redevanceORTB > 0) {
      if (mois === 3) {
        resume += ` (Mars)`;
      } else if (mois === 6) {
        resume += ` (Juin - salaire > 60 000)`;
      }
    }

    resume += `
        ============================
        TOTAL PRÉLÈVEMENTS: ${this.formaterMontant(resultat.totalPrelevements)}
        SALAIRE NET: ${this.formaterMontant(resultat.salaireNet)}
        ============================
    `;

    return resume.trim();
  }

  /**
   * Calcule l'ITS pour toute l'année
   */
  public static calculerITSAnnuel(salaireBrutMensuel: number): {
    totalITS: number;
    totalORTB: number;
    totalPrelevements: number;
    detailMensuel: ResultatITS[];
  } {
    const detailMensuel: ResultatITS[] = [];
    let totalITS = 0;
    let totalORTB = 0;

    for (let mois = 1; mois <= 12; mois++) {
      const resultat = this.calculerITS({ salaireBrut: salaireBrutMensuel, mois });
      detailMensuel.push(resultat);
      totalITS += resultat.impotITS;
      totalORTB += resultat.redevanceORTB;
    }

    return {
      totalITS,
      totalORTB,
      totalPrelevements: totalITS + totalORTB,
      detailMensuel
    };
  }
}







/**
 * Classe d'exemples pour l'ITS
 */
export class ExemplesITS {

  /**
   * Exemple 1: Salaire de 200 000 FCFA
   */
  static exemple1(mois: number = 1): ResultatITS {
    return CalculateurITS.calculerITS({
      salaireBrut: 200000,
      mois: mois
    });
  }

  /**
   * Exemple 2: Salaire de 600 000 FCFA
   */
  static exemple2(mois: number = 1): ResultatITS {
    return CalculateurITS.calculerITS({
      salaireBrut: 600000,
      mois: mois
    });
  }

  /**
   * Exemple avec ORTB Mars
   */
  static exempleORTBMars(): ResultatITS {
    return CalculateurITS.calculerITS({
      salaireBrut: 200000,
      mois: 3 // Mars
    });
  }

  /**
   * Exemple avec ORTB Juin (salaire > 60 000)
   */
  static exempleORTBJuin(): ResultatITS {
    return CalculateurITS.calculerITS({
      salaireBrut: 100000,
      mois: 6 // Juin
    });
  }

  /**
   * Exemple avec ORTB Juin exonéré (salaire ≤ 60 000)
   */
  static exempleORTBJuinExonere(): ResultatITS {
    return CalculateurITS.calculerITS({
      salaireBrut: 50000,
      mois: 6 // Juin
    });
  }

  /**
   * Exécute tous les exemples
   */
  static executerTousLesExemples(): void {
    console.log("=== EXEMPLES DE CALCUL ITS ===\n");

    console.log("Exemple 1 - Salaire 200 000 FCFA (Janvier):");
    console.log(CalculateurITS.afficherResume(this.exemple1(1), 1));
    console.log("\n");

    console.log("Exemple 2 - Salaire 600 000 FCFA (Janvier):");
    console.log(CalculateurITS.afficherResume(this.exemple2(1), 1));
    console.log("\n");

    console.log("Exemple 3 - Salaire 200 000 FCFA avec ORTB Mars:");
    console.log(CalculateurITS.afficherResume(this.exempleORTBMars(), 3));
    console.log("\n");

    console.log("Exemple 4 - Salaire 100 000 FCFA avec ORTB Juin:");
    console.log(CalculateurITS.afficherResume(this.exempleORTBJuin(), 6));
    console.log("\n");

    console.log("Exemple 5 - Salaire 50 000 FCFA en Juin (ORTB exonéré):");
    console.log(CalculateurITS.afficherResume(this.exempleORTBJuinExonere(), 6));
  }

  /**
   * Test de cohérence des calculs
   */
  static testerCoherence(): void {
    console.log("=== TEST DE COHÉRENCE DES CALCULS ===\n");
    
    const montantsTest = [50000, 100000, 200000, 300000, 600000, 1000000];
    
    for (const montant of montantsTest) {
      const coherent = CalculateurITS.verifierCoherence(montant);
      console.log(`Montant ${CalculateurITS.formaterMontant(montant)}: ${coherent ? '✓ Cohérent' : '✗ Incohérent'}`);
    }
  }
}