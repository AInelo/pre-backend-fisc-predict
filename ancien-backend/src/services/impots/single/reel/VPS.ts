/**
 * Calcul du Versement Patronal sur Salaires (VPS) au Bénin
 * Basé sur la modélisation fiscale officielle
 */

// Types et interfaces
export interface Salarie {
  salaire: number;
  emoluments: number;
  retributions_accessoires: number;
  est_beninois: boolean;
  date_embauche?: Date;
  est_premier_emploi_beninois?: boolean;
  est_declare_cnss?: boolean;
  est_stagiaire_art120?: boolean;
}

export interface Entreprise {
  date_creation: Date;
  est_representation_diplomatique: boolean;
  est_organisation_internationale: boolean;
  est_assujetti_tps: boolean;
  est_etablissement_enseignement_prive: boolean;
}

export interface CalculVPSResult {
  masse_salariale_totale: number;
  taux_applicable: number;
  est_exempte: boolean;
  montant_vps: number;
  details_exemption: {
    representation_diplomatique: boolean;
    organisation_internationale: boolean;
    assujetti_tps: boolean;
    entreprise_nouvelle_premier_exercice: boolean;
    premier_emploi_beninois: boolean;
    stagiaire_art120: boolean;
  };
}

export class CalculateurVPS {
  
  /**
   * Calcule la masse salariale totale
   * S = Σ(Salaire_i + Emoluments_i + Retributions_accessoires_i)
   */
  private calculerMasseSalarialeTotale(salaries: Salarie[]): number {
    return salaries.reduce((total, salarie) => {
      return total + salarie.salaire + salarie.emoluments + salarie.retributions_accessoires;
    }, 0);
  }

  /**
   * Détermine le taux applicable selon le type d'établissement
   * τ = 0.04 si établissement général
   * τ = 0.02 si établissement d'enseignement privé
   */
  private obtenirTauxApplicable(entreprise: Entreprise): number {
    return entreprise.est_etablissement_enseignement_prive ? 0.02 : 0.04;
  }

  /**
   * Vérifie si l'entreprise est nouvelle et dans son premier exercice
   */
  private estEntrepriseNouvellePremierExercice(
    entreprise: Entreprise, 
    salaries: Salarie[], 
    dateCalcul: Date = new Date()
  ): boolean {
    // Vérifier si moins d'un exercice depuis la création
    const unAnDepuisCreation = new Date(entreprise.date_creation);
    unAnDepuisCreation.setFullYear(unAnDepuisCreation.getFullYear() + 1);
    
    const estPremierExercice = dateCalcul <= unAnDepuisCreation;
    
    // Vérifier s'il y a au moins un salarié béninois
    const aSalarieBéninois = salaries.some(s => s.est_beninois);
    
    return estPremierExercice && aSalarieBéninois;
  }

  /**
   * Vérifie l'exemption pour premier emploi béninois
   */
  private estPremierEmploiBeninoisExempte(
    salaries: Salarie[], 
    dateCalcul: Date = new Date()
  ): boolean {
    return salaries.some(salarie => {
      if (!salarie.est_premier_emploi_beninois || !salarie.date_embauche || !salarie.est_declare_cnss) {
        return false;
      }
      
      // Vérifier si moins de 2 ans depuis l'embauche
      const deuxAnsDepuisEmbauche = new Date(salarie.date_embauche);
      deuxAnsDepuisEmbauche.setFullYear(deuxAnsDepuisEmbauche.getFullYear() + 2);
      
      return dateCalcul <= deuxAnsDepuisEmbauche;
    });
  }

  /**
   * Vérifie s'il y a des stagiaires selon l'article 120
   */
  private aStagiaireArt120(salaries: Salarie[]): boolean {
    return salaries.some(s => s.est_stagiaire_art120);
  }

  /**
   * Calcule la fonction d'exemption E
   * E = 1 si conditions d'exemption remplies, 0 sinon
   */
  private calculerFonctionExemption(
    entreprise: Entreprise, 
    salaries: Salarie[], 
    dateCalcul: Date = new Date()
  ): { est_exempte: boolean; details: any } {
    const details = {
      representation_diplomatique: entreprise.est_representation_diplomatique,
      organisation_internationale: entreprise.est_organisation_internationale,
      assujetti_tps: entreprise.est_assujetti_tps,
      entreprise_nouvelle_premier_exercice: this.estEntrepriseNouvellePremierExercice(entreprise, salaries, dateCalcul),
      premier_emploi_beninois: this.estPremierEmploiBeninoisExempte(salaries, dateCalcul),
      stagiaire_art120: this.aStagiaireArt120(salaries)
    };

    // E = 1 si au moins une condition d'exemption est remplie
    const est_exempte = Object.values(details).some(condition => condition === true);

    return { est_exempte, details };
  }

  /**
   * Calcule le montant VPS selon la formule principale
   * VPS = S × τ × (1 - E)
   */
  public calculerVPS(
    entreprise: Entreprise, 
    salaries: Salarie[], 
    dateCalcul: Date = new Date()
  ): CalculVPSResult {
    // Calcul de la masse salariale totale (S)
    const masse_salariale_totale = this.calculerMasseSalarialeTotale(salaries);

    // Détermination du taux applicable (τ)
    const taux_applicable = this.obtenirTauxApplicable(entreprise);

    // Calcul de la fonction d'exemption (E)
    const { est_exempte, details } = this.calculerFonctionExemption(entreprise, salaries, dateCalcul);

    // Calcul du montant VPS
    // VPS = S × τ × (1 - E)
    const montant_vps = est_exempte ? 0 : masse_salariale_totale * taux_applicable;

    return {
      masse_salariale_totale,
      taux_applicable,
      est_exempte,
      montant_vps,
      details_exemption: details
    };
  }

 
}



































 // /**
  //  * Méthode utilitaire pour afficher un résumé du calcul
  //  */
  // public afficherResume(resultat: CalculVPSResult): string {
  //   let resume = `=== CALCUL VPS ===\n`;
  //   resume += `Masse salariale totale: ${resultat.masse_salariale_totale.toLocaleString()} FCFA\n`;
  //   resume += `Taux applicable: ${(resultat.taux_applicable * 100)}%\n`;
  //   resume += `Statut d'exemption: ${resultat.est_exempte ? 'EXEMPTÉ' : 'NON EXEMPTÉ'}\n`;
    
  //   if (resultat.est_exempte) {
  //     resume += `Raisons d'exemption:\n`;
  //     Object.entries(resultat.details_exemption).forEach(([cle, valeur]) => {
  //       if (valeur) {
  //         resume += `  - ${cle.replace(/_/g, ' ')}\n`;
  //       }
  //     });
  //   }
    
  //   resume += `MONTANT VPS: ${resultat.montant_vps.toLocaleString()} FCFA`;
    
  //   return resume;
  // }








// // Exemple d'utilisation
// export function exempleUtilisation(): void {
//   const calculateur = new CalculateurVPS();

//   // Exemple d'entreprise
//   const entreprise: Entreprise = {
//     date_creation: new Date('2023-01-01'),
//     est_representation_diplomatique: false,
//     est_organisation_internationale: false,
//     est_assujetti_tps: false,
//     est_etablissement_enseignement_prive: false
//   };

//   // Exemple de salariés
//   const salaries: Salarie[] = [
//     {
//       salaire: 200000,
//       emoluments: 50000,
//       retributions_accessoires: 25000,
//       est_beninois: true,
//       date_embauche: new Date('2024-01-15'),
//       est_premier_emploi_beninois: true,
//       est_declare_cnss: true,
//       est_stagiaire_art120: false
//     },
//     {
//       salaire: 150000,
//       emoluments: 30000,
//       retributions_accessoires: 15000,
//       est_beninois: false,
//       est_stagiaire_art120: false
//     }
//   ];

//   const resultat = calculateur.calculerVPS(entreprise, salaries);
//   console.log(calculateur.afficherResume(resultat));
// }