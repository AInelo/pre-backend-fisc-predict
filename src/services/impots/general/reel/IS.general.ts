import { BackendEstimationFailureResponse } from "@/types/frontend.errors.estomation.type";
import { GlobalEstimationInfoData, VariableEnter } from "@/types/frontend.result.return.type";
import { buildFiscalParametersFailureResponse, FiscalParametersError } from '@/services/fiscal-parameters/errors';
import { fiscalParameterResolver } from '@/services/fiscal-parameters/FiscalParameterResolver';
import { describeRevenueBracket, findAmountFromRevenueBrackets } from '@/services/fiscal-parameters/helpers';
import { IsFiscalParams } from '@/types/fiscal-parameters';

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

interface ISCalculationOptions {
    includeRedevanceSRTB?: boolean;
    customRedevanceSRTB?: number;
    includeCCI?: boolean;
    customCCIRate?: number;
    customTauxSecteur?: number;
    customTauxMinimumSecteur?: number;
}

export type ISCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

class ISErrorHandler {
    static genererErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'VALIDATION_ERROR',
                    message,
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

class ISResponseBuilder {
    private beneficeImposable = 0;
    private tauxPrincipal = 0;
    private tauxMinimum = 0;
    private taxeStation = 0;
    private impotBrut = 0;
    private impotNetArrondi = 0;
    private redevanceSRTB = 0;
    private contributionCCI = 0;

    constructor(
        private readonly input: ISInput,
        private readonly params: IsFiscalParams,
        private readonly options: ISCalculationOptions = {}
    ) {
        this.options = {
            includeRedevanceSRTB: true,
            includeCCI: true,
            ...options
        };
        this.initializeCalculations();
    }

    private initializeCalculations() {
        this.beneficeImposable = Math.max(0, this.input.chiffreAffaire - this.input.charges);
        this.tauxPrincipal = this.options.customTauxSecteur ?? (this.params.taux_principal_par_secteur[this.input.secteur] ?? this.params.taux_principal_par_secteur.general);
        this.tauxMinimum = this.options.customTauxMinimumSecteur ?? (this.params.taux_minimum_par_secteur[this.input.secteur] ?? this.params.taux_minimum_par_secteur.general);
        this.impotBrut = this.beneficeImposable * this.tauxPrincipal;

        const impotMinimum = Math.max(
            this.input.chiffreAffaire * this.tauxMinimum,
            this.params.impot_minimum_absolu_entreprise
        );

        if (this.impotBrut < impotMinimum) {
            this.impotBrut = impotMinimum;
        }

        if (this.input.secteur === 'gas-station' && this.input.nbrLitreParAn) {
            this.taxeStation = this.input.nbrLitreParAn * this.params.taux_taxe_station_par_litre;
        }

        this.impotNetArrondi = Math.round(this.impotBrut + this.taxeStation);
        this.redevanceSRTB = this.options.includeRedevanceSRTB ? (this.options.customRedevanceSRTB ?? this.params.redevance_srtb) : 0;
        this.contributionCCI = this.options.includeCCI ? (this.options.customCCIRate ?? findAmountFromRevenueBrackets(this.input.chiffreAffaire, this.params.cci_rates)) : 0;
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
                importCalculeDescription: `IS = ${this.beneficeImposable.toLocaleString('fr-FR')} FCFA x ${(this.tauxPrincipal * 100).toFixed(1)}% = ${Math.round(this.impotBrut).toLocaleString('fr-FR')} FCFA${this.taxeStation > 0 ? ` + Taxe station ${Math.round(this.taxeStation).toLocaleString('fr-FR')} FCFA` : ''}`
            }
        ];

        if (this.taxeStation > 0) {
            details.push({
                impotTitle: 'Taxe station-service',
                impotDescription: 'Taxe calculée sur la base du comptage des litres vendus',
                impotValue: Math.round(this.taxeStation),
                impotValueCurrency: 'FCFA',
                impotTaux: `${this.params.taux_taxe_station_par_litre} FCFA par litre`,
                importCalculeDescription: `Taxe station = ${this.input.nbrLitreParAn} litres x ${this.params.taux_taxe_station_par_litre} FCFA = ${Math.round(this.taxeStation).toLocaleString('fr-FR')} FCFA`
            });
        }

        if (this.redevanceSRTB > 0 && this.options.includeRedevanceSRTB) {
            details.push({
                impotTitle: 'Redevance SRTB',
                impotDescription: "Redevance audiovisuelle obligatoire.",
                impotValue: this.redevanceSRTB,
                impotValueCurrency: 'FCFA',
                impotTaux: 'Forfait',
                importCalculeDescription: `Redevance SRTB = ${this.redevanceSRTB.toLocaleString('fr-FR')} FCFA`
            });
        }

        if (this.contributionCCI > 0 && this.options.includeCCI) {
            details.push({
                impotTitle: 'Contribution CCI Bénin',
                impotDescription: `Contribution CCI selon barème (${describeRevenueBracket(this.input.chiffreAffaire, this.params.cci_rates)})`,
                impotValue: this.contributionCCI,
                impotValueCurrency: 'FCFA',
                impotTaux: `${this.contributionCCI.toLocaleString('fr-FR')} FCFA`,
                importCalculeDescription: `Contribution CCI = ${this.contributionCCI.toLocaleString('fr-FR')} FCFA`
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
        return [
            {
                infosTitle: "Taux d'imposition par secteur",
                infosDescription: Object.entries(this.params.taux_principal_par_secteur).map(([secteur, taux]) => `${secteur} : ${(taux * 100).toFixed(1)}%`)
            },
            {
                infosTitle: "Impôt minimum",
                infosDescription: [
                    "L'impôt minimum est calculé sur le chiffre d'affaires selon le secteur d'activité.",
                    "Il s'applique si l'impôt calculé sur le bénéfice est inférieur à ce minimum.",
                    `L'impôt minimum absolu est de ${this.params.impot_minimum_absolu_entreprise.toLocaleString('fr-FR')} FCFA pour toutes les entreprises.`
                ]
            }
        ];
    }

    private buildImpotConfig() {
        return {
            impotTitle: this.params.title,
            label: this.params.label,
            description: this.params.description,
            competentCenter: this.params.competent_center,
        };
    }

    build(): GlobalEstimationInfoData {
        return {
            totalEstimation: this.impotNetArrondi + this.redevanceSRTB + this.contributionCCI,
            totalEstimationCurrency: 'FCFA',
            contribuableRegime: 'Régime IS',
            VariableEnter: this.buildVariablesEnter(),
            impotDetailCalcule: this.buildImpotDetailCalcule(),
            obligationEcheance: this.buildObligationEcheance(),
            infosSupplementaires: this.buildInfosSupplementaires(),
            impotConfig: this.buildImpotConfig()
        };
    }
}

class MoteurIS {
    public static async calculerIS(input: ISInput): Promise<ISCalculationResult> {
        return this.calculerISAvecOptions(input, {});
    }

    public static async calculerISWithoutCCI(input: ISInput): Promise<ISCalculationResult> {
        return this.calculerISAvecOptions(input, { includeCCI: false });
    }

    public static async calculerISWithoutRedevanceSRTB(input: ISInput): Promise<ISCalculationResult> {
        return this.calculerISAvecOptions(input, { includeRedevanceSRTB: false });
    }

    public static async calculerISWithoutCCI_RedevanceSRTB(input: ISInput): Promise<ISCalculationResult> {
        return this.calculerISAvecOptions(input, { includeCCI: false, includeRedevanceSRTB: false });
    }

    public static async calculerISPersonnalise(
        input: ISInput,
        customCCIRate?: number,
        customRedevanceSRTB?: number,
        customTauxSecteur?: number,
        customTauxMinimumSecteur?: number
    ): Promise<ISCalculationResult> {
        return this.calculerISAvecOptions(input, {
            customCCIRate,
            customRedevanceSRTB,
            customTauxSecteur,
            customTauxMinimumSecteur,
            includeCCI: customCCIRate !== undefined,
            includeRedevanceSRTB: customRedevanceSRTB !== undefined
        });
    }

    public static async calculerISAvecOptions(input: ISInput, options: ISCalculationOptions): Promise<ISCalculationResult> {
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

            const params = await fiscalParameterResolver.resolveRequiredParams<'IS'>({
                codeImpot: 'IS',
                typeContribuable: 'ENTREPRISE',
                periodeFiscale: input.periodeFiscale
            });

            return new ISResponseBuilder(input, params, options).build();
        } catch (error) {
            if (error instanceof FiscalParametersError) {
                return buildFiscalParametersFailureResponse(error, {
                    typeContribuable: 'Entreprise',
                    regime: 'IS',
                    chiffreAffaire: input.chiffreAffaire
                });
            }

            return ISErrorHandler.genererErreurValidation(error instanceof Error ? error.message : "Erreur lors du calcul de l'IS");
        }
    }
}

export default MoteurIS;
