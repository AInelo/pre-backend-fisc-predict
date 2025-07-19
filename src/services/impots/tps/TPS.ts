/**
 * Interface pour les résultats du calcul TPS
 */
interface ResultatCalculTPS {
    tpsBase: number;
    tpsTotale: number;
    acompte1: number;
    acompte2: number;
    solde: number;
    redevanceRtb: number;
    regimeReel: boolean;
    premiereAnnee: boolean;
    tpsImputableEtat: number;
    tpsImputableLocaux: number;
    messages: string[];
    amendes: Record<string, number>;
  }
  
  /**
   * Interface pour la configuration du moteur
   */
  interface ConfigurationTPS {
    chiffreAffaires: number;
    estPersonnePhysique?: boolean;
    estEntrepriseIndividuelle?: boolean;
    anneeCreation?: number;
    anneeCourante?: number;
    tpsAnneePrecedente?: number;
  }
  
  /**
   * Moteur de calcul pour la TPS (Taxe Professionnelle Synthétique) au Bénin
   * Conforme aux formules fiscales béninoises
   */
  class MoteurCalculTPS {
    // Constantes
    private static readonly TAUX_TPS = 0.05; // 5%
    private static readonly MONTANT_MINIMUM = 10_000; // 10 000 FCFA
    private static readonly REDEVANCE_RTB = 4_000; // 4 000 FCFA
    private static readonly SEUIL_REGIME_REEL = 50_000_000; // 50 millions FCFA
    private static readonly SEUIL_PAIEMENT_BANCAIRE = 100_000; // 100 000 FCFA
    private static readonly AMENDE_ESPECES = 0.05; // 5%
    private static readonly AMENDE_COMPTABILITE = 1_000_000; // 1 million FCFA par exercice
  
    // Propriétés privées
    private chiffreAffaires: number = 0;
    private estPersonnePhysique: boolean = false;
    private estEntrepriseIndividuelle: boolean = false;
    private anneeCreation: number;
    private anneeCourante: number;
    private tpsAnneePrecedente: number = 0;
    private messages: string[] = [];
    private amendes: Record<string, number> = {};
  
    constructor() {
      const currentYear = new Date().getFullYear();
      this.anneeCreation = currentYear;
      this.anneeCourante = currentYear;
      this.reset();
    }
  
    /**
     * Réinitialise le moteur
     */
    public reset(): void {
      this.chiffreAffaires = 0;
      this.estPersonnePhysique = false;
      this.estEntrepriseIndividuelle = false;
      this.anneeCreation = new Date().getFullYear();
      this.anneeCourante = new Date().getFullYear();
      this.tpsAnneePrecedente = 0;
      this.messages = [];
      this.amendes = {};
    }
  
    /**
     * Configure les paramètres de calcul
     */
    public configurer(config: ConfigurationTPS): void {
      this.chiffreAffaires = config.chiffreAffaires;
      this.estPersonnePhysique = config.estPersonnePhysique ?? false;
      this.estEntrepriseIndividuelle = config.estEntrepriseIndividuelle ?? false;
      this.anneeCreation = config.anneeCreation ?? new Date().getFullYear();
      this.anneeCourante = config.anneeCourante ?? new Date().getFullYear();
      this.tpsAnneePrecedente = config.tpsAnneePrecedente ?? 0;
      this.messages = [];
      this.amendes = {};
    }

    /**
     * Calcule la TPS de base selon la formule principale
     */
    private calculerTpsBase(): number {
      const tpsCalculee = MoteurCalculTPS.TAUX_TPS * this.chiffreAffaires;
      return Math.max(tpsCalculee, MoteurCalculTPS.MONTANT_MINIMUM);
    }
  
    /**
     * Vérifie si le passage au régime réel est nécessaire
     */
    private verifierRegimeReel(): boolean {
      return this.chiffreAffaires > MoteurCalculTPS.SEUIL_REGIME_REEL;
    }
  
    /**
     * Vérifie si c'est la première année d'activité
     */
    private estPremiereAnnee(): boolean {
      return this.anneeCreation === this.anneeCourante;
    }
  
    /**
     * Calcule les acomptes provisionnels
     */
    private calculerAcomptes(): [number, number] {
      if (this.estPremiereAnnee()) {
        return [0, 0];
      }
  
      const acompte = this.tpsAnneePrecedente * 0.5;
      return [acompte, acompte];
    }
  
    /**
     * Calcule la TPS imputable en cas de passage au régime réel
     */
    private calculerTpsImputable(tpsBase: number): [number, number] {
      if (this.verifierRegimeReel()) {
        const tpsImputable = tpsBase * 0.5;
        return [tpsImputable, tpsImputable];
      }
      return [0, 0];
    }
  
    /**
     * Vérifie les amendes applicables
     */
    private verifierAmendes(montantPaiement: number = 0): void {
      // Amende pour paiement en espèces
      if (montantPaiement >= MoteurCalculTPS.SEUIL_PAIEMENT_BANCAIRE) {
        const amendeEspeces = montantPaiement * MoteurCalculTPS.AMENDE_ESPECES;
        this.amendes.amendeEspeces = amendeEspeces;
        this.messages.push(
          `⚠️ Amende pour paiement en espèces: ${this.formatMontant(amendeEspeces)} FCFA`
        );
      }
    }
  
    /**
     * Calcule l'amende pour non-présentation de comptabilité
     */
    public calculerAmendeComptabilite(nombreExercices: number): number {
      return MoteurCalculTPS.AMENDE_COMPTABILITE * nombreExercices;
    }
  
    /**
     * Effectue le calcul complet de la TPS
     */
    public calculer(): ResultatCalculTPS {
      // Calcul TPS de base
      const tpsBase = this.calculerTpsBase();
  
      // Ajout de la redevance RTB
      const tpsTotale = tpsBase + MoteurCalculTPS.REDEVANCE_RTB;
  
      // Calcul des acomptes
      const [acompte1, acompte2] = this.calculerAcomptes();
  
      // Calcul du solde
      const solde = tpsBase - (acompte1 + acompte2);
  
      // Vérification du régime réel
      const regimeReel = this.verifierRegimeReel();
  
      // Calcul TPS imputable
      const [tpsImputableEtat, tpsImputableLocaux] = this.calculerTpsImputable(tpsBase);
  
      // Première année
      const premiereAnnee = this.estPremiereAnnee();
  
      // Messages informatifs
      this.genererMessages(tpsBase, regimeReel, premiereAnnee);
  
      // Vérification des amendes
      this.verifierAmendes(tpsTotale);
  
      return {
        tpsBase,
        tpsTotale,
        acompte1,
        acompte2,
        solde,
        redevanceRtb: MoteurCalculTPS.REDEVANCE_RTB,
        regimeReel,
        premiereAnnee,
        tpsImputableEtat,
        tpsImputableLocaux,
        messages: [...this.messages],
        amendes: { ...this.amendes }
      };
    }
  
    /**
     * Génère les messages informatifs
     */
    private genererMessages(tpsBase: number, regimeReel: boolean, premiereAnnee: boolean): void {
      // Message TPS minimum
      if (tpsBase === MoteurCalculTPS.MONTANT_MINIMUM) {
        this.messages.push(
          `💡 TPS minimum appliquée: ${this.formatMontant(MoteurCalculTPS.MONTANT_MINIMUM)} FCFA`
        );
      }
  
      // Message régime réel
      if (regimeReel) {
        this.messages.push(
          `🚨 ATTENTION: Passage obligatoire au régime réel (CA > ${this.formatMontant(MoteurCalculTPS.SEUIL_REGIME_REEL)} FCFA)`
        );
        this.messages.push(
          "📋 La TPS devient un acompte réparti à parts égales:"
        );
        this.messages.push(
          `   • 50% imputable sur les impôts d'État: ${this.formatMontant(tpsBase * 0.5)} FCFA`
        );
        this.messages.push(
          `   • 50% imputable sur les impôts locaux: ${this.formatMontant(tpsBase * 0.5)} FCFA`
        );
      }
  
      // Message première année
      if (premiereAnnee) {
        this.messages.push(
          "🎯 Première année d'activité: Dispense d'acomptes provisionnels"
        );
      }
  
      // Message redevance RTB
      this.messages.push(
        `📺 Redevance RTB automatiquement ajoutée: ${this.formatMontant(MoteurCalculTPS.REDEVANCE_RTB)} FCFA`
      );
  
      // Messages de dates limites
      if (!premiereAnnee) {
        this.messages.push(
          "📅 Dates limites:",
          "   • 1er acompte: 10 février",
          "   • 2e acompte: 10 juin",
          "   • Solde: 30 avril de l'année suivante"
        );
      }
    }
  
    /**
     * Formate un montant avec des séparateurs de milliers
     */
    private formatMontant(montant: number): string {
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(montant);
    }
  
    /**
     * Génère un rapport détaillé des calculs
     */
    public genererRapport(): string {
      const resultat = this.calculer();
  
      let rapport = `
  === RAPPORT DE CALCUL TPS - BÉNIN ===
  
  PARAMÈTRES:
  • Chiffre d'affaires: ${this.formatMontant(this.chiffreAffaires)} FCFA
  • Personne physique: ${this.estPersonnePhysique ? 'Oui' : 'Non'}
  • Entreprise individuelle: ${this.estEntrepriseIndividuelle ? 'Oui' : 'Non'}
  • Année de création: ${this.anneeCreation}
  • Année courante: ${this.anneeCourante}
  • TPS année précédente: ${this.formatMontant(this.tpsAnneePrecedente)} FCFA
  
  CALCULS:
  • TPS de base (5%): ${this.formatMontant(resultat.tpsBase)} FCFA
  • Redevance RTB: ${this.formatMontant(resultat.redevanceRtb)} FCFA
  • TPS TOTALE: ${this.formatMontant(resultat.tpsTotale)} FCFA
  
  ACOMPTES:
  • 1er acompte (10 février): ${this.formatMontant(resultat.acompte1)} FCFA
  • 2e acompte (10 juin): ${this.formatMontant(resultat.acompte2)} FCFA
  • Solde (30 avril N+1): ${this.formatMontant(resultat.solde)} FCFA
  
  INFORMATIONS:
  `;
  
      resultat.messages.forEach(message => {
        rapport += `• ${message}\n`;
      });
  
      if (Object.keys(resultat.amendes).length > 0) {
        rapport += '\nAMENDES:\n';
        Object.entries(resultat.amendes).forEach(([typeAmende, montant]) => {
          rapport += `• ${typeAmende}: ${this.formatMontant(montant)} FCFA\n`;
        });
      }
  
      return rapport;
    }
  
    /**
     * Valide la configuration avant le calcul
     */
    public validerConfiguration(): { valide: boolean; erreurs: string[] } {
      const erreurs: string[] = [];
  
      if (this.chiffreAffaires < 0) {
        erreurs.push('Le chiffre d\'affaires ne peut pas être négatif');
      }
  
      if (this.anneeCreation > this.anneeCourante) {
        erreurs.push('L\'année de création ne peut pas être postérieure à l\'année courante');
      }
  
      if (this.tpsAnneePrecedente < 0) {
        erreurs.push('La TPS de l\'année précédente ne peut pas être négative');
      }
  
      return {
        valide: erreurs.length === 0,
        erreurs
      };
    }
  
    /**
     * Méthode utilitaire pour créer une instance pré-configurée
     */
    public static creerAvecConfiguration(config: ConfigurationTPS): MoteurCalculTPS {
      const moteur = new MoteurCalculTPS();
      moteur.configurer(config);
      return moteur;
    }
  }

export type { ConfigurationTPS };
export { MoteurCalculTPS };
