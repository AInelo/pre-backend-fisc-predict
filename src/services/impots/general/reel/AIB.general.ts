import { BackendEstimationFailureResponse } from "@/types/frontend.errors.estomation.type";
import { GlobalEstimationInfoData } from "@/types/frontend.result.return.type";
import { AibFiscalParams } from '@/types/fiscal-parameters';
import { buildFiscalParametersFailureResponse, FiscalParametersError } from '@/services/fiscal-parameters/errors';
import { fiscalParameterResolver } from '@/services/fiscal-parameters/FiscalParameterResolver';

interface AIBInput {
    aibCollected: number;
    aibGranted: number;
    periodeFiscale: string;
}

interface AIBCalculationOptions {
    includeCCI?: boolean;
    includeRedevanceSRTB?: boolean;
    customRedevance?: number;
    customCCIRate?: number;
}

export type AIBCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

class AIBErrorHandler {
    static genererErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [{ code: 'VALIDATION_ERROR', message, details: `Erreur de validation des données d'entrée pour le calcul de l'AIB.`, severity: 'error' }],
            context: {
                typeContribuable: 'Entreprise',
                regime: 'AIB',
                missingData: ['donnees_entree', 'aib_collecte', 'aib_accorde']
            },
            timestamp: new Date().toISOString(),
            requestId: `aib_calc_${Date.now()}`
        };
    }
}

class AIBResponseBuilder {
    private readonly aibNet: number;
    private readonly aibNetArrondi: number;
    private readonly redevanceSRTB: number;
    private readonly contributionCCI: number;
    private readonly totalAIB: number;

    constructor(
        private readonly input: AIBInput,
        private readonly params: AibFiscalParams,
        private readonly options: AIBCalculationOptions = {}
    ) {
        this.options = { includeCCI: true, includeRedevanceSRTB: true, ...options };
        this.aibNet = input.aibCollected - input.aibGranted;
        this.aibNetArrondi = Math.round(this.aibNet);
        this.redevanceSRTB = this.options.includeRedevanceSRTB ? (this.options.customRedevance ?? params.redevance_srtb) : 0;
        this.contributionCCI = this.options.includeCCI ? (this.options.customCCIRate ?? 0) : 0;
        this.totalAIB = this.aibNetArrondi + this.redevanceSRTB + this.contributionCCI;
    }

    build(): GlobalEstimationInfoData {
        return {
            totalEstimation: this.totalAIB,
            totalEstimationCurrency: 'FCFA',
            contribuableRegime: 'Régime AIB',
            VariableEnter: [
                { label: "AIB Collecté", description: "Montant total d'AIB collecté", value: this.input.aibCollected, currency: 'FCFA' },
                { label: "AIB Accordé", description: "Montant total d'AIB accordé", value: this.input.aibGranted, currency: 'FCFA' }
            ],
            impotDetailCalcule: [
                {
                    impotTitle: 'AIB Net (Accompte sur l\'Impôt sur les Bénéfices)',
                    impotDescription: `Calculé comme la différence entre l'AIB collecté et l'AIB accordé`,
                    impotValue: this.aibNetArrondi,
                    impotValueCurrency: 'FCFA',
                    impotTaux: this.aibNet > 0 ? 'Débit' : 'Crédit',
                    importCalculeDescription: `AIB Net = ${this.input.aibCollected.toLocaleString('fr-FR')} FCFA - ${this.input.aibGranted.toLocaleString('fr-FR')} FCFA = ${this.aibNetArrondi.toLocaleString('fr-FR')} FCFA`
                }
            ],
            obligationEcheance: [
                {
                    impotTitle: 'AIB - Déclaration mensuelle',
                    echeancePaiement: { echeancePeriodeLimite: '10 du mois suivant', echeanceDescription: "Déclaration et paiement de l'AIB mensuel." },
                    obligationDescription: "L'AIB doit être déclaré et payé avant le 10 du mois suivant la période d'activité."
                }
            ],
            infosSupplementaires: [
                {
                    infosTitle: 'Principe de l\'AIB',
                    infosDescription: [
                        "L'AIB est un acompte sur l'impôt sur les bénéfices (IBA/IS) à payer mensuellement.",
                        "L'AIB accordé représente ce qui a été retenu à la source ou payé d'avance."
                    ]
                }
            ],
            impotConfig: {
                impotTitle: this.params.title,
                label: this.params.label,
                description: this.params.description,
                competentCenter: this.params.competent_center
            }
        };
    }
}

class MoteurAIB {
    public static async calculerAIB(input: AIBInput): Promise<AIBCalculationResult> {
        return this.calculerAIBAvecOptions(input, {});
    }

    public static async calculerAIBWithoutCCI(input: AIBInput): Promise<AIBCalculationResult> {
        return this.calculerAIBAvecOptions(input, { includeCCI: false });
    }

    public static async calculerAIBWithoutRedevanceSRTB(input: AIBInput): Promise<AIBCalculationResult> {
        return this.calculerAIBAvecOptions(input, { includeRedevanceSRTB: false });
    }

    public static async calculerAIBWithoutCCI_RedevanceSRTB(input: AIBInput): Promise<AIBCalculationResult> {
        return this.calculerAIBAvecOptions(input, { includeCCI: false, includeRedevanceSRTB: false });
    }

    public static async calculerAIBPersonnalise(input: AIBInput, customCCI?: number, customRedevance?: number): Promise<AIBCalculationResult> {
        return this.calculerAIBAvecOptions(input, {
            customCCIRate: customCCI,
            customRedevance,
            includeCCI: customCCI !== undefined,
            includeRedevanceSRTB: customRedevance !== undefined
        });
    }

    public static async calculerAIBAvecOptions(input: AIBInput, options: AIBCalculationOptions): Promise<AIBCalculationResult> {
        try {
            if (input.aibCollected < 0 || input.aibGranted < 0) {
                return AIBErrorHandler.genererErreurValidation('Les montants AIB collecté et accordé doivent être positifs');
            }

            const params = await fiscalParameterResolver.resolveRequiredParams<'AIB'>({
                codeImpot: 'AIB',
                typeContribuable: 'ENTREPRISE',
                periodeFiscale: input.periodeFiscale
            });

            return new AIBResponseBuilder(input, params, options).build();
        } catch (error) {
            if (error instanceof FiscalParametersError) {
                return buildFiscalParametersFailureResponse(error, {
                    typeContribuable: 'Entreprise',
                    regime: 'AIB',
                    chiffreAffaire: input.aibCollected
                });
            }

            return AIBErrorHandler.genererErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de l\'AIB');
        }
    }
}

export default MoteurAIB;
