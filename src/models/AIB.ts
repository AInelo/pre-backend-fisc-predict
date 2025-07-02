// AIB.ts - Calculateur d'Acompte sur Impôt sur le Bénéfice (Bénin)

/**
 * Types d'opérations fiscales
 */
export enum TypeOperation {
    IMPORTATION = "Importation",
    ACHAT_COMMERCIAL = "AchatCommercial",
    FOURNITURE_TRAVAUX = "FournitureTravaux",
    PRESTATION_SERVICE = "PrestationService"
}

/**
 * Types de bénéficiaires
 */
export enum TypeBeneficiaire {
    PUBLIC = "Public",
    PRIVE = "Prive"
}

/**
 * Statut d'immatriculation
 */
export enum StatutImmatriculation {
    IMMATRICULE = "Oui",
    NON_IMMATRICULE = "Non"
}

/**
 * Interface pour les paramètres de calcul AIB
 */
export interface ParametresAIB {
    montant: number;
    typeOperation: TypeOperation;
    statutImmatriculation: StatutImmatriculation;
    typeBeneficiaire: TypeBeneficiaire;
    mois: string;
    estNouvelleEntreprise?: boolean;
    releveTPS?: boolean;
    ancienneteEnMois?: number;
}

/**
 * Interface pour le résultat du calcul AIB
 */
export interface ResultatAIB {
    montantTransaction: number;
    taux: number;
    acompteAIB: number;
    redevanceORTB: number;
    montantTotal: number;
    exonerationAppliquee: boolean;
    dateEcheance: string;
}

/**
 * Constantes fiscales
 */
const TAUX = {
    T1: 0.01, // 1%
    T3: 0.03, // 3%
    T5: 0.05  // 5%
} as const;

const REDEVANCE_ORTB = 4000; // FCFA

/**
 * Classe principale pour le calcul de l'AIB
 */
export class CalculateurAIB {

    /**
     * Détermine le taux d'acompte applicable selon les règles fiscales
     */
    private static determinerTaux(
        typeOperation: TypeOperation,
        statutImmatriculation: StatutImmatriculation,
        typeBeneficiaire: TypeBeneficiaire
    ): number {
        switch (typeOperation) {
            case TypeOperation.IMPORTATION:
                return TAUX.T1; // 1% pour toutes les importations

            case TypeOperation.ACHAT_COMMERCIAL:
                return statutImmatriculation === StatutImmatriculation.IMMATRICULE
                    ? TAUX.T1  // 1% si immatriculé
                    : TAUX.T5; // 5% si non immatriculé

            case TypeOperation.FOURNITURE_TRAVAUX:
                if (typeBeneficiaire === TypeBeneficiaire.PUBLIC) {
                    return statutImmatriculation === StatutImmatriculation.IMMATRICULE
                        ? TAUX.T1  // 1% si immatriculé et bénéficiaire public
                        : TAUX.T5; // 5% si non immatriculé et bénéficiaire public
                }
                return TAUX.T5; // 5% pour bénéficiaire privé

            case TypeOperation.PRESTATION_SERVICE:
                return statutImmatriculation === StatutImmatriculation.IMMATRICULE
                    ? TAUX.T3  // 3% si immatriculé
                    : TAUX.T5; // 5% si non immatriculé

            default:
                return TAUX.T5; // Taux par défaut
        }
    }

    /**
     * Vérifie si l'entreprise est éligible à l'exonération
     */
    private static verifierExoneration(
        estNouvelleEntreprise: boolean = false,
        releveTPS: boolean = false,
        ancienneteEnMois: number = 0
    ): boolean {
        return estNouvelleEntreprise && releveTPS && ancienneteEnMois <= 12;
    }

    /**
     * Calcule la redevance ORTB
     */
    private static calculerRedevanceORTB(mois: string): number {
        return mois.toLowerCase() === "mars" ? REDEVANCE_ORTB : 0;
    }

    /**
     * Calcule la date d'échéance (10 du mois suivant)
     */
    private static calculerDateEcheance(dateTransaction: Date): string {
        const moisSuivant = new Date(dateTransaction);
        moisSuivant.setMonth(moisSuivant.getMonth() + 1);
        moisSuivant.setDate(10);

        return moisSuivant.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    /**
     * Méthode principale de calcul de l'AIB
     */
    public static calculerAIB(parametres: ParametresAIB): ResultatAIB {
        const {
            montant,
            typeOperation,
            statutImmatriculation,
            typeBeneficiaire,
            mois,
            estNouvelleEntreprise = false,
            releveTPS = false,
            ancienneteEnMois = 0
        } = parametres;

        // Validation des paramètres
        if (montant <= 0) {
            throw new Error("Le montant de la transaction doit être positif");
        }

        // Détermination du taux
        const taux = this.determinerTaux(typeOperation, statutImmatriculation, typeBeneficiaire);

        // Vérification de l'exonération
        const exonerationAppliquee = this.verifierExoneration(
            estNouvelleEntreprise,
            releveTPS,
            ancienneteEnMois
        );

        // Calcul de l'acompte AIB
        const acompteAIB = exonerationAppliquee ? 0 : montant * taux;

        // Calcul de la redevance ORTB
        const redevanceORTB = this.calculerRedevanceORTB(mois);

        // Montant total
        const montantTotal = acompteAIB + redevanceORTB;

        // Date d'échéance
        const dateEcheance = this.calculerDateEcheance(new Date());

        return {
            montantTransaction: montant,
            taux: taux,
            acompteAIB: acompteAIB,
            redevanceORTB: redevanceORTB,
            montantTotal: montantTotal,
            exonerationAppliquee: exonerationAppliquee,
            dateEcheance: dateEcheance
        };
    }

    /**
     * Méthode utilitaire pour formater le résultat en FCFA
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
    public static afficherResume(resultat: ResultatAIB): string {
        const resume = `
            === RÉSUMÉ DU CALCUL AIB ===
            Montant de la transaction: ${this.formaterMontant(resultat.montantTransaction)}
            Taux applicable: ${(resultat.taux * 100).toFixed(1)}%
            Acompte AIB: ${this.formaterMontant(resultat.acompteAIB)}
            Redevance ORTB: ${this.formaterMontant(resultat.redevanceORTB)}
            Exonération appliquée: ${resultat.exonerationAppliquee ? 'Oui' : 'Non'}
            ===============================
            MONTANT TOTAL À PAYER: ${this.formaterMontant(resultat.montantTotal)}
            Date d'échéance: ${resultat.dateEcheance}
            ===============================
        `;

        return resume.trim();
    }
}




























// Exemples d'utilisation
export class ExemplesAIB {

    /**
     * Exemple 1: Importation de marchandises
     */
    static exemple1(): ResultatAIB {
        return CalculateurAIB.calculerAIB({
            montant: 5000000,
            typeOperation: TypeOperation.IMPORTATION,
            statutImmatriculation: StatutImmatriculation.IMMATRICULE,
            typeBeneficiaire: TypeBeneficiaire.PRIVE,
            mois: "février"
        });
    }

    /**
     * Exemple 2: Prestation de service par entreprise non immatriculée
     */
    static exemple2(): ResultatAIB {
        return CalculateurAIB.calculerAIB({
            montant: 2000000,
            typeOperation: TypeOperation.PRESTATION_SERVICE,
            statutImmatriculation: StatutImmatriculation.NON_IMMATRICULE,
            typeBeneficiaire: TypeBeneficiaire.PRIVE,
            mois: "mars"
        });
    }

    /**
     * Exemple 3: Entreprise nouvelle exonérée
     */
    static exemple3(): ResultatAIB {
        return CalculateurAIB.calculerAIB({
            montant: 1500000,
            typeOperation: TypeOperation.ACHAT_COMMERCIAL,
            statutImmatriculation: StatutImmatriculation.IMMATRICULE,
            typeBeneficiaire: TypeBeneficiaire.PRIVE,
            mois: "janvier",
            estNouvelleEntreprise: true,
            releveTPS: true,
            ancienneteEnMois: 8
        });
    }

    /**
     * Exemple 4: Fourniture de travaux à l'État
     */
    static exemple4(): ResultatAIB {
        return CalculateurAIB.calculerAIB({
            montant: 10000000,
            typeOperation: TypeOperation.FOURNITURE_TRAVAUX,
            statutImmatriculation: StatutImmatriculation.IMMATRICULE,
            typeBeneficiaire: TypeBeneficiaire.PUBLIC,
            mois: "mars"
        });
    }

    /**
     * Exécute tous les exemples
     */
    static executerTousLesExemples(): void {
        console.log("=== EXEMPLES DE CALCUL AIB ===\n");

        console.log("Exemple 1 - Importation de marchandises:");
        console.log(CalculateurAIB.afficherResume(this.exemple1()));
        console.log("\n");

        console.log("Exemple 2 - Prestation de service non immatriculée:");
        console.log(CalculateurAIB.afficherResume(this.exemple2()));
        console.log("\n");

        console.log("Exemple 3 - Entreprise nouvelle exonérée:");
        console.log(CalculateurAIB.afficherResume(this.exemple3()));
        console.log("\n");

        console.log("Exemple 4 - Fourniture de travaux à l'État:");
        console.log(CalculateurAIB.afficherResume(this.exemple4()));
    }
}