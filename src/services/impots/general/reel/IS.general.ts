import { BackendEstimationFailureResponse } from "@/types/frontend.errors.estomation.type";
import { GlobalEstimationInfoData, VariableEnter } from "@/types/frontend.result.return.type";

interface ISInput {
    chiffreAffaire: number;
    charges: number;
    secteur: 'education' | 'industry' | 'real-estate' | 'construction' | 'gas-station' | 'general';
    dureeCreation?: number;
    pourcentageActionsNonCotees?: number;
    estExoneree?: boolean;
    nbrLitreParAn?: number;
    periodeFiscale: string;
}

// Options de calcul pour IS
interface ISCalculationOptions {
    includeRedevanceORTB?: boolean;
    customRedevanceORTB?: number;
    includeCCI?: boolean;
    customCCIRate?: number;
    customTauxSecteur?: number; // Remplace le taux sectoriel standard
    customTauxMinimumSecteur?: number; // Remplace le taux minimum sectoriel
}

export type ISCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

// Configuration centrale
class ISConfig {
    static readonly REDEVANCE_ORTB = 4_000;
    static readonly IMPOT_MINIMUM_ABSOLU_ENTREPRISE = 250_000;
    static readonly TAUX_TAXE_STATION_PAR_LITRE = 0.6;

    static readonly TITLE = 'Impôt sur les Sociétés (IS)';
    static readonly LABEL = 'IS';
    static readonly DESCRIPTION = `L'Impôt sur les Sociétés est un impôt direct calculé sur le bénéfice imposable des entreprises.
            Le taux varie selon le secteur d'activité et s'applique après déduction des charges.
            Des acomptes trimestriels sont obligatoires, avec un solde au 30 avril.`;
    static readonly COMPETENT_CENTER = "Centre des Impôts des Petites Entreprises (CIPE) de votre ressort territorial.";

    static readonly CCI_RATES = [
        { maxRevenue: 5_000_000, individual: 20_000, company: 100_000 },
        { maxRevenue: 25_000_000, individual: 50_000, company: 200_000 },
        { maxRevenue: 50_000_000, individual: 150_000, company: 300_000 },
        { maxRevenue: 400_000_000, individual: 400_000, company: 400_000 },
        { maxRevenue: 800_000_000, individual: 600_000, company: 600_000 },
        { maxRevenue: 1_000_000_000, individual: 800_000, company: 800_000 },
        { maxRevenue: 2_000_000_000, individual: 1_200_000, company: 1_200_000 },
        { maxRevenue: 4_000_000_000, individual: 1_600_000, company: 1_600_000 },
        { maxRevenue: Infinity, individual: 2_000_000, company: 2_000_000 },
    ] as const;
}

// Gestion d'erreurs
class ISErrorHandler {
    static genererErreurAnnee(input: ISInput, annee: number): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'CONSTANTES_NON_DISPONIBLES',
                    message: `Les taux IS pour l'année ${annee} ne sont pas encore disponibles.`,
                    details: `Le calcul de l'Impôt sur les Sociétés pour l'année ${annee} ne peut pas être effectué car les taux officiels n'ont pas encore été publiés par l'administration fiscale béninoise.`,
                    severity: 'info'
                }
            ],
            context: {
                typeContribuable: 'Entreprise',
                regime: 'IS',
                chiffreAffaire: input.chiffreAffaire,
                missingData: ['taux_is', 'seuils_imposition', 'barèmes_sectoriels']
            },
            timestamp: new Date().toISOString(),
            requestId: `is_calc_${Date.now()}`
        };
    }

    static genererErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'VALIDATION_ERROR',
                    message: message,
                    details: `Erreur de validation des données d'entrée pour le calcul de l'IS.`,
                    severity: 'error'
                }
            ],
            context: {
                typeContribuable: 'Entreprise',
                regime: 'IS',
                missingData: ['donnees_entree', 'chiffre_affaires', 'charges']
            },
            timestamp: new Date().toISOString(),
            requestId: `is_calc_${Date.now()}`
        };
    }
}

// Utilitaires
class DateUtils {
    static extraireAnnee(periodeFiscale: string): number {
        const anneeMatch = periodeFiscale.match(/(\d{4})/);
        return anneeMatch ? parseInt(anneeMatch[1], 10) : new Date().getFullYear();
    }
}

class CCICalculator {
    static calculerPourIS(chiffreAffaire: number): number {
        const cciRate = ISConfig.CCI_RATES.find(rate => chiffreAffaire <= rate.maxRevenue);
        if (!cciRate) return 2_000_000;
        return cciRate.company; // IS concerne les sociétés
    }

    static getDescriptionBareme(chiffreAffaire: number): string {
        const cciRate = ISConfig.CCI_RATES.find(rate => chiffreAffaire <= rate.maxRevenue);
        if (!cciRate) return "Échelon maximum du barème";
        const index = ISConfig.CCI_RATES.indexOf(cciRate);
        const minRevenue = index > 0 ? ISConfig.CCI_RATES[index - 1].maxRevenue + 1 : 0;
        const maxRevenue = cciRate.maxRevenue === Infinity ? "et plus" : cciRate.maxRevenue.toLocaleString('fr-FR');
        const minRevenueStr = minRevenue === 0 ? "0" : (minRevenue - 1).toLocaleString('fr-FR');
        return `Tranche ${minRevenueStr} - ${maxRevenue} FCFA`;
    }
}

// Builder de réponse
class ISResponseBuilder {
    private input: ISInput;
    private options: ISCalculationOptions;

    private beneficeImposable: number = 0;
    private tauxPrincipal: number = 0;
    private tauxMinimum: number = 0;
    private taxeStation: number = 0;
    private impotBrut: number = 0;
    private impotNet: number = 0;
    private impotNetArrondi: number = 0;
    private redevanceORTB: number = 0;
    private contributionCCI: number = 0;

    constructor(input: ISInput, options: ISCalculationOptions = {}) {
        this.input = input;
        this.options = {
            includeRedevanceORTB: true,
            includeCCI: true,
            ...options
        };
        this.initializeCalculations();
    }

    private initializeCalculations() {
        this.beneficeImposable = Math.max(0, this.input.chiffreAffaire - this.input.charges);
        this.tauxPrincipal = this.options.customTauxSecteur ?? MoteurIS.calculerTauxPrincipal(this.input.secteur);
        this.tauxMinimum = this.options.customTauxMinimumSecteur ?? MoteurIS.calculerTauxMinimum(this.input.secteur);

        this.impotBrut = this.beneficeImposable * this.tauxPrincipal;
        const impotMinimum = Math.max(
            this.input.chiffreAffaire * this.tauxMinimum,
            ISConfig.IMPOT_MINIMUM_ABSOLU_ENTREPRISE
        );
        if (this.impotBrut < impotMinimum) {
            this.impotBrut = impotMinimum;
        }

        if (this.input.secteur === 'gas-station' && this.input.nbrLitreParAn) {
            this.taxeStation = this.input.nbrLitreParAn * ISConfig.TAUX_TAXE_STATION_PAR_LITRE;
        } else {
            this.taxeStation = 0;
        }

        this.impotNet = Math.max(0, this.impotBrut + this.taxeStation);
        this.impotNetArrondi = Math.round(this.impotNet);

        this.redevanceORTB = this.options.includeRedevanceORTB ? (this.options.customRedevanceORTB ?? ISConfig.REDEVANCE_ORTB) : 0;
        this.contributionCCI = this.options.includeCCI ? (this.options.customCCIRate ?? CCICalculator.calculerPourIS(this.input.chiffreAffaire)) : 0;
    }

    private buildVariablesEnter() {
        const variables: VariableEnter[] = [
            {
                label: "Chiffre d'affaires",
                description: "Revenus totaux de l'entreprise",
                value: this.input.chiffreAffaire,
                currency: 'FCFA'
            },
            {
                label: "Charges déductibles",
                description: "Charges et dépenses déductibles du bénéfice imposable",
                value: this.input.charges,
                currency: 'FCFA'
            },
            {
                label: "Bénéfice imposable",
                description: "Différence entre revenus et charges",
                value: this.beneficeImposable,
                currency: 'FCFA'
            }
        ];

        if (this.input.secteur === 'gas-station' && this.input.nbrLitreParAn) {
            variables.push({
                label: 'Volume de carburant annuel',
                description: 'Nombre de litres vendus dans l\'année',
                value: this.input.nbrLitreParAn,
                currency: 'litres'
            });
        }

        if (this.options.includeRedevanceORTB && this.redevanceORTB > 0) {
            variables.push({
                label: 'Redevance ORTB',
                description: "Redevance audiovisuelle obligatoire",
                value: this.redevanceORTB,
                currency: 'FCFA'
            });
        }

        if (this.options.includeCCI && this.contributionCCI > 0) {
            variables.push({
                label: 'Contribution CCI Bénin',
                description: this.options.customCCIRate ? 'Montant CCI personnalisé' : `Montant selon barème (${CCICalculator.getDescriptionBareme(this.input.chiffreAffaire)})`,
                value: this.contributionCCI,
                currency: 'FCFA'
            });
        }

        if (this.options.customTauxSecteur !== undefined) {
            variables.push({
                label: 'Taux sectoriel personnalisé',
                description: 'Taux appliqué au calcul de l\'impôt',
                value: `${(this.options.customTauxSecteur * 100).toFixed(1)}%`,
                currency: ''
            });
        }

        if (this.options.customTauxMinimumSecteur !== undefined) {
            variables.push({
                label: 'Taux minimum personnalisé',
                description: 'Taux minimum appliqué sur le CA',
                value: `${(this.options.customTauxMinimumSecteur * 100).toFixed(1)}%`,
                currency: ''
            });
        }

        return variables;
    }

    private buildImpotDetailCalcule() {
        const details = [
            {
                impotTitle: 'Impôt sur les Sociétés (IS)',
                impotDescription: `Calculé selon le taux de ${(this.tauxPrincipal * 100).toFixed(1)}% applicable au secteur ${this.input.secteur}`,
                impotValue: this.impotNetArrondi,
                impotValueCurrency: 'FCFA',
                impotTaux: `${(this.tauxPrincipal * 100).toFixed(1)}%`,
                importCalculeDescription: `IS = ${this.beneficeImposable.toLocaleString('fr-FR')} FCFA × ${(this.tauxPrincipal * 100).toFixed(1)}% = ${Math.round(this.impotBrut).toLocaleString('fr-FR')} FCFA${this.taxeStation > 0 ? ` + Taxe station ${Math.round(this.taxeStation).toLocaleString('fr-FR')} FCFA` : ''}`
            }
        ];

        if (this.taxeStation > 0) {
            details.push({
                impotTitle: 'Taxe station-service',
                impotDescription: 'Taxe calculée sur la base du comptage des litres vendus',
                impotValue: Math.round(this.taxeStation),
                impotValueCurrency: 'FCFA',
                impotTaux: `${ISConfig.TAUX_TAXE_STATION_PAR_LITRE} FCFA par litre`,
                importCalculeDescription: `Taxe station = ${this.input.nbrLitreParAn} litres × ${ISConfig.TAUX_TAXE_STATION_PAR_LITRE} FCFA = ${Math.round(this.taxeStation).toLocaleString('fr-FR')} FCFA`
            });
        }

        if (this.options.includeRedevanceORTB && this.redevanceORTB > 0) {
            details.push({
                impotTitle: 'Redevance ORTB',
                impotDescription: "Redevance audiovisuelle obligatoire pour l'Office de Radiodiffusion et Télévision du Bénin.",
                impotValue: this.redevanceORTB,
                impotValueCurrency: 'FCFA',
                impotTaux: 'Forfait',
                importCalculeDescription: `Redevance ORTB ${this.options.customRedevanceORTB ? 'personnalisée' : 'fixe'} de ${this.redevanceORTB.toLocaleString('fr-FR')} FCFA`
            });
        }

        if (this.options.includeCCI && this.contributionCCI > 0) {
            details.push({
                impotTitle: 'Contribution CCI Bénin',
                impotDescription: this.options.customCCIRate ? 'Contribution CCI personnalisée' : `Contribution CCI selon barème (${CCICalculator.getDescriptionBareme(this.input.chiffreAffaire)})`,
                impotValue: this.contributionCCI,
                impotValueCurrency: 'FCFA',
                impotTaux: `${this.contributionCCI.toLocaleString('fr-FR')} FCFA`,
                importCalculeDescription: this.options.customCCIRate ? `Montant CCI personnalisé de ${this.contributionCCI.toLocaleString('fr-FR')} FCFA` : `Montant calculé selon le barème CCI pour société avec CA de ${this.input.chiffreAffaire.toLocaleString('fr-FR')} FCFA.`
            });
        }

        return details;
    }

    private buildObligationEcheance() {
        return [
            {
                impotTitle: 'IS - Premier acompte',
                echeancePaiement: {
                    echeancePeriodeLimite: '10 mars',
                    echeanceDescription: "25% du montant de l'IS de l'année précédente."
                },
                obligationDescription: "Premier acompte à verser au plus tard le 10 mars."
            },
            {
                impotTitle: 'IS - Deuxième acompte',
                echeancePaiement: {
                    echeancePeriodeLimite: '10 juin',
                    echeanceDescription: "25% du montant de l'IS de l'année précédente."
                },
                obligationDescription: "Deuxième acompte à verser au plus tard le 10 juin."
            },
            {
                impotTitle: 'IS - Troisième acompte',
                echeancePaiement: {
                    echeancePeriodeLimite: '10 septembre',
                    echeanceDescription: "25% du montant de l'IS de l'année précédente."
                },
                obligationDescription: "Troisième acompte à verser au plus tard le 10 septembre."
            },
            {
                impotTitle: 'IS - Quatrième acompte',
                echeancePaiement: {
                    echeancePeriodeLimite: '10 décembre',
                    echeanceDescription: "25% du montant de l'IS de l'année précédente."
                },
                obligationDescription: "Quatrième acompte à verser au plus tard le 10 décembre."
            },
            {
                impotTitle: 'IS - Solde et déclaration annuelle',
                echeancePaiement: {
                    echeancePeriodeLimite: '30 avril',
                    echeanceDescription: "Solde de l'IS et déclaration annuelle avec bilan OHADA."
                },
                obligationDescription: "Le solde de l'IS doit être versé et la déclaration annuelle déposée avant le 30 avril."
            }
        ];
    }

    private buildInfosSupplementaires() {
        const infos = [
            {
                infosTitle: "Taux d'imposition par secteur",
                infosDescription: [
                    `Secteur Éducation : ${(MoteurIS.calculerTauxPrincipal('education') * 100).toFixed(1)}%`,
                    `Secteur Industrie : ${(MoteurIS.calculerTauxPrincipal('industry') * 100).toFixed(1)}%`,
                    `Secteur Immobilier : ${(MoteurIS.calculerTauxPrincipal('real-estate') * 100).toFixed(1)}%`,
                    `Secteur Construction : ${(MoteurIS.calculerTauxPrincipal('construction') * 100).toFixed(1)}%`,
                    `Secteur Station-service : ${(MoteurIS.calculerTauxPrincipal('gas-station') * 100).toFixed(1)}%`,
                    `Secteur Général : ${(MoteurIS.calculerTauxPrincipal('general') * 100).toFixed(1)}%`
                ]
            },
            {
                infosTitle: "Impôt minimum",
                infosDescription: [
                    "L'impôt minimum est calculé sur le chiffre d'affaires selon le secteur d'activité.",
                    "Il s'applique si l'impôt calculé sur le bénéfice est inférieur à ce minimum.",
                    `L'impôt minimum absolu est de ${ISConfig.IMPOT_MINIMUM_ABSOLU_ENTREPRISE.toLocaleString('fr-FR')} FCFA pour toutes les entreprises.`
                ]
            }
        ];

        if (this.options.includeCCI && this.contributionCCI > 0) {
            infos.push({
                infosTitle: 'Contribution CCI Bénin',
                infosDescription: [
                    this.options.customCCIRate ? 'La contribution CCI a été personnalisée.' : 'La contribution CCI varie selon le chiffre d\'affaires.',
                    `Pour votre situation (société, CA: ${this.input.chiffreAffaire.toLocaleString('fr-FR')} FCFA), la contribution est de ${this.contributionCCI.toLocaleString('fr-FR')} FCFA.`
                ]
            });
        }

        if (this.options.includeRedevanceORTB && this.redevanceORTB > 0) {
            infos.push({
                infosTitle: 'Redevance ORTB',
                infosDescription: [
                    `Redevance ORTB ${this.options.customRedevanceORTB ? 'personnalisée' : 'fixe'} de ${this.redevanceORTB.toLocaleString('fr-FR')} FCFA appliquée.`
                ]
            });
        }

        return infos;
    }

    private buildImpotConfig() {
        return {
            impotTitle: ISConfig.TITLE,
            label: ISConfig.LABEL,
            description: ISConfig.DESCRIPTION,
            competentCenter: ISConfig.COMPETENT_CENTER,
            paymentSchedule: [
                {
                    date: "10 mars",
                    description: "Premier acompte (25% de l'IS de l'année précédente)"
                },
                {
                    date: "10 juin",
                    description: "Deuxième acompte (25% de l'IS de l'année précédente)"
                },
                {
                    date: "10 septembre",
                    description: "Troisième acompte (25% de l'IS de l'année précédente)"
                },
                {
                    date: "10 décembre",
                    description: "Quatrième acompte (25% de l'IS de l'année précédente)"
                },
                {
                    date: "30 avril",
                    description: "Solde et déclaration annuelle"
                }
            ]
        };
    }

    build(): GlobalEstimationInfoData {
        const suffixe = this.getSuffixeCalcul();
        return {
            totalEstimation: this.impotNetArrondi + (this.options.includeRedevanceORTB ? this.redevanceORTB : 0) + (this.options.includeCCI ? this.contributionCCI : 0),
            totalEstimationCurrency: 'FCFA',
            contribuableRegime: `Régime IS${suffixe}`,
            VariableEnter: this.buildVariablesEnter(),
            impotDetailCalcule: this.buildImpotDetailCalcule(),
            obligationEcheance: this.buildObligationEcheance(),
            infosSupplementaires: this.buildInfosSupplementaires(),
            impotConfig: this.buildImpotConfig()
        };
    }

    private getSuffixeCalcul(): string {
        if (!this.options.includeCCI && !this.options.includeRedevanceORTB) {
            return ' (Base uniquement)';
        } else if (!this.options.includeCCI) {
            return ' (Sans CCI)';
        } else if (!this.options.includeRedevanceORTB) {
            return ' (Sans ORTB)';
        } else if (this.options.customCCIRate !== undefined || this.options.customRedevanceORTB !== undefined || this.options.customTauxSecteur !== undefined || this.options.customTauxMinimumSecteur !== undefined) {
            return ' (Personnalisé)';
        }
        return '';
    }
}

class MoteurIS {
    // API principale historique (compatibilité)
    public static calculerIS(input: ISInput): ISCalculationResult {
        return this.calculerISAvecOptions(input, {});
    }

    // Méthode sans contribution CCI
    public static calculerISWithoutCCI(input: ISInput): ISCalculationResult {
        return this.calculerISAvecOptions(input, { includeCCI: false });
    }

    // Méthode sans redevance ORTB
    public static calculerISWithoutRedevanceORTB(input: ISInput): ISCalculationResult {
        return this.calculerISAvecOptions(input, { includeRedevanceORTB: false });
    }

    // Méthode sans CCI ni redevance ORTB
    public static calculerISWithoutCCI_RedevanceORTB(input: ISInput): ISCalculationResult {
        return this.calculerISAvecOptions(input, { includeCCI: false, includeRedevanceORTB: false });
    }

    // Méthode personnalisée (CCI et ORTB)
    public static calculerISPersonnalise(
        input: ISInput,
        customCCIRate?: number,
        customRedevanceORTB?: number,
        customTauxSecteur?: number,
        customTauxMinimumSecteur?: number
    ): ISCalculationResult {
        return this.calculerISAvecOptions(input, {
            customCCIRate,
            customRedevanceORTB,
            customTauxSecteur,
            customTauxMinimumSecteur,
            includeCCI: customCCIRate !== undefined,
            includeRedevanceORTB: customRedevanceORTB !== undefined
        });
    }

    // Méthode générique avec options
    public static calculerISAvecOptions(input: ISInput, options: ISCalculationOptions): ISCalculationResult {
        try {
            if (input.chiffreAffaire <= 0) {
                return ISErrorHandler.genererErreurValidation("Le chiffre d'affaires doit être positif");
            }
            if (input.charges < 0) {
                return ISErrorHandler.genererErreurValidation('Les charges ne peuvent pas être négatives');
            }
            if (input.secteur === 'gas-station' && (!input.nbrLitreParAn || input.nbrLitreParAn <= 0)) {
                return ISErrorHandler.genererErreurValidation('Le nombre de litres vendus annuellement est requis et doit être positif pour les stations-services');
            }

            const annee = DateUtils.extraireAnnee(input.periodeFiscale);
            if (annee >= 2026) {
                return ISErrorHandler.genererErreurAnnee(input, annee);
            }

            return new ISResponseBuilder(input, options).build();
        } catch (error) {
            return ISErrorHandler.genererErreurValidation(error instanceof Error ? error.message : "Erreur lors du calcul de l'IS");
        }
    }

    // Anciennes méthodes utilitaires conservées (utilisées par le builder)
    static calculerTauxPrincipal(secteur: string): number {
        if (secteur === 'education') return 0.25;
        if (secteur === 'industry') return 0.25;
        return 0.30; // Taux général pour les autres secteurs
    }

    static calculerTauxMinimum(secteur: string): number {
        if (secteur === 'real-estate') return 0.10;
        if (secteur === 'construction') return 0.03;
        return 0.01; // Taux minimum pour les autres secteurs
    }

    static verifierExonerationCapitalRisque(dureeCreation?: number, pourcentageActionsNonCotees?: number): boolean {
        if (!dureeCreation || !pourcentageActionsNonCotees) return false;
        return dureeCreation <= 5 && pourcentageActionsNonCotees >= 70;
    }

    static getSecteurValue(secteur: string): number {
        const secteurValues: Record<string, number> = {
            'education': 1,
            'industry': 2,
            'real-estate': 3,
            'construction': 4,
            'gas-station': 5,
            'general': 6
        };
        return secteurValues[secteur] || 6;
    }
}

export default MoteurIS;
