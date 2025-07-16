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






export interface ParametresAIBExemple {
    montant: number;
    typeOperation: TypeOperation;
    statutImmatriculation: StatutImmatriculation;
    typeBeneficiaire: TypeBeneficiaire;
    mois: string;
    dateCreation?: Date; // Date de création de l'entreprise
    // estNouvelleEntreprise?: boolean;
    // releveTPS?: boolean;
    // ancienneteEnMois?: number;
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
 * 
 * 

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
     * 1. Estimation avant transaction commerciale
     */
        public static estimerAvantTransaction(parametres: ParametresAIB): ResultatAIB {
            return this.calculerAIB(parametres);
        }
    
        /**
         * 2. Vérification lors de la déclaration fiscale (multi-opérations)
         */
        public static verifierPourDeclaration(operations: ParametresAIB[]): ResultatAIB[] {
            return operations.map(op => this.calculerAIB(op));
        }
    
        /**
         * 3. Simulation en phase de négociation avec un client/public
         * Fournit le net attendu après AIB + ORTB
         */
        public static simulerRetenuePourNegociation(parametres: ParametresAIB): {
            resultat: ResultatAIB;
            montantNetPerçu: number;
        } {
            const resultat = this.calculerAIB(parametres);
            const montantNetPerçu = parametres.montant - resultat.acompteAIB - resultat.redevanceORTB;
            return { resultat, montantNetPerçu };
        }
    
        /**
         * 4. Estimation pour planification financière (multi-mois / prévisions)
         */
        public static planifierChargesFiscales(previsions: ParametresAIB[]): {
            totalAIB: number;
            totalORTB: number;
            totalGlobal: number;
            resultats: ResultatAIB[];
        } {
            const resultats = previsions.map(p => this.calculerAIB(p));
            const totalAIB = resultats.reduce((sum, r) => sum + r.acompteAIB, 0);
            const totalORTB = resultats.reduce((sum, r) => sum + r.redevanceORTB, 0);
            const totalGlobal = totalAIB + totalORTB;
    
            return { totalAIB, totalORTB, totalGlobal, resultats };
        }
    
        /**
         * 5. Reconstitution pour contrôle fiscal ou audit
         * Retourne la liste détaillée des calculs avec explication de l'exonération
         */
        public static reconstituerPourControle(operations: ParametresAIB[]): {
            resultats: ResultatAIB[];
            totalAIB: number;
            totalORTB: number;
            montantTotal: number;
            recapitulatif: {
                exonerations: number;
                nonExonerations: number;
            };
        } {
            const resultats = operations.map(op => this.calculerAIB(op));
            const totalAIB = resultats.reduce((acc, r) => acc + r.acompteAIB, 0);
            const totalORTB = resultats.reduce((acc, r) => acc + r.redevanceORTB, 0);
            const montantTotal = totalAIB + totalORTB;
            const exonerations = resultats.filter(r => r.exonerationAppliquee).length;
            const nonExonerations = resultats.length - exonerations;
    
            return {
                resultats,
                totalAIB,
                totalORTB,
                montantTotal,
                recapitulatif: {
                    exonerations,
                    nonExonerations
                }
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

   
}
