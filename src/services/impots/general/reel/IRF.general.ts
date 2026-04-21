import { GlobalEstimationInfoData } from '../../../../types/frontend.result.return.type';
import { BackendEstimationFailureResponse } from '../../../../types/frontend.errors.estomation.type';
import { buildFiscalParametersFailureResponse, FiscalParametersError } from '@/services/fiscal-parameters/errors';
import { fiscalParameterResolver } from '@/services/fiscal-parameters/FiscalParameterResolver';
import { IrfFiscalParams } from '@/types/fiscal-parameters';

export type IRFCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

interface IRFInput {
  revenuLocatif: number;
  isAlreadyTaxed: boolean;
  periodeFiscale: string;
}

interface IRFCalculationOptions {
    includeRedevanceSRTB?: boolean;
    customRedevanceSRTB?: number;
    customTauxIRF?: number;
}

class IRFErrorHandler {
    static genererErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [{ code: 'VALIDATION_ERROR', message, details: `Erreur de validation des données d'entrée pour le calcul de l'IRF.`, severity: 'error' }],
            context: { typeContribuable: 'Propriétaire foncier', regime: 'IRF', missingData: ['donnees_entree'] },
            timestamp: new Date().toISOString(),
            requestId: `irf_calc_${Date.now()}`
        };
    }
}

class IRFResponseBuilder {
    private readonly tauxIRF: number;
    private readonly tauxPourcentage: string;
    private readonly irfArrondi: number;
    private readonly redevanceSRTB: number;

    constructor(
        private readonly input: IRFInput,
        private readonly params: IrfFiscalParams,
        private readonly options: IRFCalculationOptions = {}
    ) {
        this.options = { includeRedevanceSRTB: true, ...options };
        this.tauxIRF = options.customTauxIRF ?? (input.isAlreadyTaxed ? params.taux_reduit : params.taux_standard);
        this.tauxPourcentage = `${(this.tauxIRF * 100).toFixed(1)}%`;
        this.irfArrondi = Math.round(input.revenuLocatif * this.tauxIRF);
        this.redevanceSRTB = this.options.includeRedevanceSRTB ? (this.options.customRedevanceSRTB ?? params.redevance_srtb) : 0;
    }

    build(): GlobalEstimationInfoData {
        return {
            totalEstimation: this.irfArrondi + this.redevanceSRTB,
            totalEstimationCurrency: 'FCFA',
            contribuableRegime: 'Régime IRF',
            VariableEnter: [
                { label: "Revenu locatif annuel", description: "Montant total des revenus locatifs perçus durant l'année fiscale.", value: this.input.revenuLocatif, currency: 'FCFA' }
            ],
            impotDetailCalcule: [
                {
                    impotTitle: 'IRF (Impôt sur les Revenus Fonciers)',
                    impotDescription: `Calculé sur le revenu locatif avec un taux de ${this.tauxPourcentage}`,
                    impotValue: this.irfArrondi,
                    impotValueCurrency: 'FCFA',
                    impotTaux: this.tauxPourcentage,
                    importCalculeDescription: `IRF = ${this.input.revenuLocatif.toLocaleString('fr-FR')} FCFA x ${this.tauxPourcentage} = ${this.irfArrondi.toLocaleString('fr-FR')} FCFA`
                }
            ],
            obligationEcheance: [
                {
                    impotTitle: 'IRF - Déclaration et paiement',
                    echeancePaiement: { echeancePeriodeLimite: '30 avril', echeanceDescription: "Déclaration annuelle et paiement de l'IRF." },
                    obligationDescription: "Déclarer vos revenus fonciers annuellement avant le 30 avril."
                }
            ],
            infosSupplementaires: [
                {
                    infosTitle: 'Taux d\'imposition',
                    infosDescription: [
                        this.input.isAlreadyTaxed ? `Taux réduit appliqué: ${(this.params.taux_reduit * 100).toFixed(1)}%` : `Taux standard appliqué: ${(this.params.taux_standard * 100).toFixed(1)}%`,
                        `Redevance SRTB: ${this.redevanceSRTB.toLocaleString('fr-FR')} FCFA`
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

class MoteurIRF {
    public static async calculerIRF(input: IRFInput): Promise<IRFCalculationResult> {
        return this.calculerIRFvecOptions(input, {});
    }

    public static async calculerIRFWithoutRedevanceSRTB(input: IRFInput): Promise<IRFCalculationResult> {
        return this.calculerIRFvecOptions(input, { includeRedevanceSRTB: false });
    }

    public static async calculerIRFWithCustomTaux(input: IRFInput, customTaux: number): Promise<IRFCalculationResult> {
        return this.calculerIRFvecOptions(input, { customTauxIRF: customTaux });
    }

    public static async calculerIRFWithCustomRedevanceSRTB(input: IRFInput, customRedevanceSRTB: number): Promise<IRFCalculationResult> {
        return this.calculerIRFvecOptions(input, { customRedevanceSRTB });
    }

    public static async calculerIRFPersonnalise(input: IRFInput, customTaux?: number, customRedevanceSRTB?: number): Promise<IRFCalculationResult> {
        return this.calculerIRFvecOptions(input, { customTauxIRF: customTaux, customRedevanceSRTB });
    }

    public static async calculerIRFvecOptions(input: IRFInput, options: IRFCalculationOptions): Promise<IRFCalculationResult> {
        try {
            if (!input.revenuLocatif || input.revenuLocatif <= 0) {
                return IRFErrorHandler.genererErreurValidation('Le revenu locatif doit être un montant positif');
            }

            const params = await fiscalParameterResolver.resolveRequiredParams<'IRF'>({
                codeImpot: 'IRF',
                typeContribuable: 'ENTREPRISE',
                periodeFiscale: input.periodeFiscale
            });

            return new IRFResponseBuilder(input, params, options).build();
        } catch (error) {
            if (error instanceof FiscalParametersError) {
                return buildFiscalParametersFailureResponse(error, {
                    typeContribuable: 'Propriétaire foncier',
                    regime: 'IRF',
                    chiffreAffaire: input.revenuLocatif
                });
            }
            return IRFErrorHandler.genererErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de l\'IRF');
        }
    }
}

export default MoteurIRF;
