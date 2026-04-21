import { GlobalEstimationInfoData, ObligationEcheance } from '../../../../types/frontend.result.return.type';
import { BackendEstimationFailureResponse } from '../../../../types/frontend.errors.estomation.type';
import { buildFiscalParametersFailureResponse, FiscalParametersError } from '@/services/fiscal-parameters/errors';
import { fiscalParameterResolver } from '@/services/fiscal-parameters/FiscalParameterResolver';
import { describeRevenueBracket, findAmountFromRevenueBrackets } from '@/services/fiscal-parameters/helpers';
import { TpsFiscalParams } from '@/types/fiscal-parameters';

interface TPSInput {
    dateCreation?: Date;
    chiffreAffaire: number;
    periodeFiscale: string;
    typeEntreprise: TypeEntreprise;
}

enum TypeEntreprise {
    ENTREPRISE_INDIVIDUELLE = 'entreprise_individuelle',
    SOCIETE = 'societe'
}

export type TPSCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

interface TPSCalculationOptions {
    includeCCI?: boolean;
    includeRedevanceSRTB?: boolean;
    customRedevance?: number;
    customCCIRate?: number;
}

class TPSErrorHandler {
    static genererErreurRegimeReel(chiffreAffaire: number, seuilRegimeReel: number): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [{
                code: 'CHIFFRE_AFFAIRES_DEPASSE_SEUIL_TPS',
                message: `Chiffre d'affaires supérieur au seuil du régime TPS (${seuilRegimeReel.toLocaleString('fr-FR')} FCFA).`,
                details: `Avec un chiffre d'affaires de ${chiffreAffaire.toLocaleString('fr-FR')} FCFA, vous dépassez le seuil de ${seuilRegimeReel.toLocaleString('fr-FR')} FCFA et devez obligatoirement être soumis au régime réel.`,
                severity: 'warning'
            }],
            context: {
                typeContribuable: 'Entreprise',
                regime: 'Régime Réel',
                chiffreAffaire,
                missingData: ['regime_reel_parameters']
            },
            timestamp: new Date().toISOString(),
            requestId: `tps_seuil_depasse_${Date.now()}`
        };
    }

    static genererErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [{
                code: 'VALIDATION_ERROR',
                message,
                details: `Erreur de validation des données d'entrée pour le calcul de la TPS.`,
                severity: 'error'
            }],
            context: {
                typeContribuable: 'Entreprise',
                regime: 'Régime TPS',
                missingData: ['donnees_entree']
            },
            timestamp: new Date().toISOString(),
            requestId: `tps_validation_${Date.now()}`
        };
    }
}

class TPSResponseBuilder {
    private readonly anneeCourante: number;
    private readonly estPremiereAnnee: boolean;
    private readonly tpsBase: number;
    private readonly contributionCCI: number;
    private readonly redevanceSRTB: number;
    private readonly tpsTotale: number;

    constructor(
        private readonly input: TPSInput,
        private readonly params: TpsFiscalParams,
        private readonly options: TPSCalculationOptions = {}
    ) {
        this.options = {
            includeCCI: true,
            includeRedevanceSRTB: true,
            ...options
        };

        this.anneeCourante = fiscalParameterResolver.extractYear(input.periodeFiscale);
        this.estPremiereAnnee = this.determinerPremiereAnnee();
        this.tpsBase = Math.max(input.chiffreAffaire * params.taux_tps, params.montant_minimum);
        this.contributionCCI = this.options.includeCCI
            ? (this.options.customCCIRate ?? findAmountFromRevenueBrackets(input.chiffreAffaire, params.cci_rates))
            : 0;
        this.redevanceSRTB = this.options.includeRedevanceSRTB
            ? (this.options.customRedevance ?? params.redevance_rtb)
            : 0;
        this.tpsTotale = Math.round(this.tpsBase + this.contributionCCI + this.redevanceSRTB);
    }

    private determinerPremiereAnnee(): boolean {
        if (!this.input.dateCreation) {
            return false;
        }
        return this.input.dateCreation.getFullYear() === this.anneeCourante;
    }

    private buildVariablesEnter() {
        return [
            {
                label: "Chiffre d'affaires annuel",
                description: "Montant total des ventes ou revenus encaissés durant l'année fiscale.",
                value: this.input.chiffreAffaire,
                currency: 'FCFA',
            },
            {
                label: "Type d'entreprise",
                description: "Statut juridique de l'entreprise (individuelle ou société).",
                value: this.input.typeEntreprise === TypeEntreprise.ENTREPRISE_INDIVIDUELLE ? 'Entreprise Individuelle' : 'Société',
                currency: '',
            }
        ];
    }

    private buildImpotDetailCalcule() {
        const details = [
            {
                impotTitle: 'TPS (Taxe Professionnelle Synthétique)',
                impotDescription: `Calculée à ${(this.params.taux_tps * 100).toFixed(1)}% du chiffre d'affaires annuel avec un minimum de ${this.params.montant_minimum.toLocaleString('fr-FR')} FCFA.`,
                impotValue: Math.round(this.tpsBase),
                impotValueCurrency: 'FCFA',
                impotTaux: `${(this.params.taux_tps * 100).toFixed(1)}%`,
                importCalculeDescription: `TPS = max(${(this.params.taux_tps * 100).toFixed(1)}% du chiffre d'affaires, ${this.params.montant_minimum.toLocaleString('fr-FR')} FCFA) -> ${Math.round(this.tpsBase).toLocaleString('fr-FR')} FCFA`
            }
        ];

        if (this.options.includeRedevanceSRTB && this.redevanceSRTB > 0) {
            details.push({
                impotTitle: 'Redevance SRTB',
                impotDescription: `Montant ${this.options.customRedevance ? 'personnalisé' : 'fixe'} de ${this.redevanceSRTB.toLocaleString('fr-FR')} FCFA ajouté à la TPS.`,
                impotValue: this.redevanceSRTB,
                impotTaux: `${this.redevanceSRTB.toLocaleString('fr-FR')} FCFA`,
                impotValueCurrency: 'FCFA',
                importCalculeDescription: `Redevance SRTB = ${this.redevanceSRTB.toLocaleString('fr-FR')} FCFA`
            });
        }

        if (this.options.includeCCI && this.contributionCCI > 0) {
            details.push({
                impotTitle: 'Contribution CCI Bénin',
                impotDescription: `Contribution à la Chambre de Commerce et d'Industrie du Bénin ${this.options.customCCIRate ? 'personnalisée' : `selon le barème en vigueur (${describeRevenueBracket(this.input.chiffreAffaire, this.params.cci_rates)})`}.`,
                impotValue: this.contributionCCI,
                impotTaux: `${this.contributionCCI.toLocaleString('fr-FR')} FCFA`,
                impotValueCurrency: 'FCFA',
                importCalculeDescription: `Contribution CCI = ${this.contributionCCI.toLocaleString('fr-FR')} FCFA`
            });
        }

        return details;
    }

    private buildObligationEcheance(): ObligationEcheance[] {
        const obligations: ObligationEcheance[] = [
            {
                impotTitle: 'TPS - Solde à payer',
                echeancePaiement: {
                    echeancePeriodeLimite: '30 avril N+1',
                    echeanceDescription: "Solde à verser au plus tard le 30 avril de l'année suivante."
                },
                obligationDescription: this.estPremiereAnnee
                    ? 'En première année d\'activité, aucun acompte n\'est dû. Le solde correspond à la TPS totale.'
                    : 'Le solde de la TPS est calculé après déduction des acomptes éventuels.'
            }
        ];

        if (!this.estPremiereAnnee) {
            obligations.push({
                impotTitle: 'TPS - Acomptes provisionnels',
                echeancePaiement: [
                    {
                        echeancePeriodeLimite: '10 février',
                        echeanceDescription: "Premier acompte égal à 50% de la TPS de l'année précédente."
                    },
                    {
                        echeancePeriodeLimite: '10 juin',
                        echeanceDescription: "Deuxième acompte égal à 50% de la TPS de l'année précédente."
                    }
                ],
                obligationDescription: "Applicable sauf pour la première année d'activité."
            });
        }

        return obligations;
    }

    private buildInfosSupplementaires() {
        return [
            {
                infosTitle: 'Acomptes et Solde',
                infosDescription: this.estPremiereAnnee
                    ? [
                        "Première année d'activité : dispense d'acomptes provisionnels.",
                        "Le solde total de la TPS sera à payer le 30 avril de l'année suivante."
                    ]
                    : [
                        "Deux acomptes provisionnels égaux à 50% de la TPS de l'année précédente sont exigés.",
                        "Le solde à payer est : TPS année en cours – (acompte 1 + acompte 2)."
                    ]
            },
            {
                infosTitle: 'Contribution CCI Bénin',
                infosDescription: [
                    `Pour votre situation (CA: ${this.input.chiffreAffaire.toLocaleString('fr-FR')} FCFA), la contribution est de ${this.contributionCCI.toLocaleString('fr-FR')} FCFA.`,
                ]
            }
        ];
    }

    private buildImpotConfig() {
        return {
            impotTitle: this.params.title,
            label: this.params.label,
            description: this.params.description,
            competentCenter: this.params.competent_center
        };
    }

    build(): GlobalEstimationInfoData {
        return {
            totalEstimation: this.tpsTotale,
            totalEstimationCurrency: 'FCFA',
            contribuableRegime: 'Régime TPS',
            VariableEnter: this.buildVariablesEnter(),
            impotDetailCalcule: this.buildImpotDetailCalcule(),
            obligationEcheance: this.buildObligationEcheance(),
            infosSupplementaires: this.buildInfosSupplementaires(),
            impotConfig: this.buildImpotConfig()
        };
    }
}

class MoteurTPSimplifie {
    public static async calculerTPS(input: TPSInput): Promise<TPSCalculationResult> {
        return this.calculerTPSAvecOptions(input, {});
    }

    public static async calculerTPSWithoutCCI(input: TPSInput): Promise<TPSCalculationResult> {
        return this.calculerTPSAvecOptions(input, { includeCCI: false });
    }

    public static async calculerTPSWithoutRedevanceSRTB(input: TPSInput): Promise<TPSCalculationResult> {
        return this.calculerTPSAvecOptions(input, { includeRedevanceSRTB: false });
    }

    public static async calculerTPSWithoutCCI_RedevanceSRTB(input: TPSInput): Promise<TPSCalculationResult> {
        return this.calculerTPSAvecOptions(input, { includeCCI: false, includeRedevanceSRTB: false });
    }

    public static async calculerTPSPersonnalise(
        input: TPSInput,
        customCCI?: number,
        customRedevance?: number
    ): Promise<TPSCalculationResult> {
        return this.calculerTPSAvecOptions(input, {
            customCCIRate: customCCI,
            customRedevance,
            includeCCI: customCCI !== undefined,
            includeRedevanceSRTB: customRedevance !== undefined
        });
    }

    public static async calculerTPSAvecOptions(
        input: TPSInput,
        options: TPSCalculationOptions
    ): Promise<TPSCalculationResult> {
        try {
            if (input.chiffreAffaire < 0) {
                return TPSErrorHandler.genererErreurValidation("Le chiffre d'affaires doit être positif");
            }

            const params = await fiscalParameterResolver.resolveRequiredParams<'TPS'>({
                codeImpot: 'TPS',
                typeContribuable: 'ENTREPRISE',
                periodeFiscale: input.periodeFiscale
            });

            if (input.chiffreAffaire > params.seuil_regime_reel) {
                return TPSErrorHandler.genererErreurRegimeReel(input.chiffreAffaire, params.seuil_regime_reel);
            }

            return new TPSResponseBuilder(input, params, options).build();
        } catch (error) {
            if (error instanceof FiscalParametersError) {
                return buildFiscalParametersFailureResponse(error, {
                    typeContribuable: 'Entreprise',
                    regime: 'Régime TPS',
                    chiffreAffaire: input.chiffreAffaire
                });
            }

            return TPSErrorHandler.genererErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de la TPS');
        }
    }
}

export { TypeEntreprise, type TPSInput, type TPSCalculationOptions };
export default MoteurTPSimplifie;
