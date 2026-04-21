import { GlobalEstimationInfoData, VariableEnter } from '../../../../types/frontend.result.return.type';
import { BackendEstimationFailureResponse } from '../../../../types/frontend.errors.estomation.type';
import { buildFiscalParametersFailureResponse, FiscalParametersError } from '@/services/fiscal-parameters/errors';
import { fiscalParameterResolver } from '@/services/fiscal-parameters/FiscalParameterResolver';
import { ItsFiscalParams } from '@/types/fiscal-parameters';

export type ITSCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

interface ITSCalculationOptions {
    includeRedevanceSRTB?: boolean;
    customRedevanceSRTB?: number;
}

class ITSErrorHandler {
    static genererErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [{ code: 'VALIDATION_ERROR', message, details: `Erreur de validation des données d'entrée pour le calcul de l'ITS.`, severity: 'error' }],
            context: { typeContribuable: 'Salarié', regime: 'ITS', missingData: ['donnees_entree'] },
            timestamp: new Date().toISOString(),
            requestId: `its_calc_${Date.now()}`
        };
    }
}

class ITSResponseBuilder {
    private itsTaxAmount = 0;
    private redevanceSRTB = 0;
    private readonly detailsITS: string[] = [];

    constructor(
        private readonly salaireMensuel: number,
        private readonly periodeFiscale: string,
        private readonly params: ItsFiscalParams,
        private readonly options: ITSCalculationOptions = {}
    ) {
        this.options = { includeRedevanceSRTB: true, ...options };
        this.initializeCalculations();
    }

    private initializeCalculations() {
        const tranche = this.params.bareme.find((item) => this.salaireMensuel > item.borneInf && (item.borneSup === null || this.salaireMensuel <= item.borneSup));
        if (!tranche) {
            this.itsTaxAmount = 0;
        } else {
            const taxable = this.salaireMensuel - tranche.borneInf;
            this.itsTaxAmount = Math.round(tranche.montantFixe + taxable * tranche.taux);
            this.detailsITS.push(`Tranche ${tranche.borneInf.toLocaleString('fr-FR')} - ${(tranche.borneSup ?? 0).toLocaleString('fr-FR')} FCFA: montant fixe ${tranche.montantFixe.toLocaleString('fr-FR')} FCFA + ${(tranche.taux * 100).toFixed(0)}%`);
        }

        if (this.options.includeRedevanceSRTB && this.salaireMensuel > this.params.seuil_exoneration) {
            this.redevanceSRTB = this.options.customRedevanceSRTB ?? this.params.redevance_srtb_cumulee;
        }
    }

    private buildVariablesEnter(): VariableEnter[] {
        return [
            {
                label: "Salaire mensuel",
                description: "Salaire mensuel brut du contribuable.",
                value: this.salaireMensuel,
                currency: 'FCFA',
            }
        ];
    }

    build(): GlobalEstimationInfoData {
        return {
            totalEstimation: this.itsTaxAmount + this.redevanceSRTB,
            totalEstimationCurrency: 'FCFA',
            contribuableRegime: 'ITS',
            VariableEnter: this.buildVariablesEnter(),
            impotDetailCalcule: [
                {
                    impotTitle: 'ITS (Impôt sur les Traitements et Salaires)',
                    impotDescription: "Impôt progressif calculé sur le salaire mensuel selon le barème en vigueur.",
                    impotValue: this.itsTaxAmount,
                    impotValueCurrency: 'FCFA',
                    impotTaux: 'Barème progressif',
                    importCalculeDescription: this.detailsITS.join(' ; ')
                }
            ],
            obligationEcheance: [
                {
                    impotTitle: 'ITS - Prélèvement mensuel',
                    echeancePaiement: { echeancePeriodeLimite: 'Mensuel', echeanceDescription: "L'ITS est prélevé mensuellement à la source par l'employeur." },
                    obligationDescription: "L'employeur doit prélever et verser l'ITS mensuellement."
                }
            ],
            infosSupplementaires: [
                {
                    infosTitle: 'Barème progressif ITS',
                    infosDescription: this.params.bareme.map((tranche) => `${tranche.borneInf.toLocaleString('fr-FR')} - ${(tranche.borneSup ?? 0).toLocaleString('fr-FR')} : ${(tranche.taux * 100).toFixed(0)}%`)
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

class MoteurITS {
    public static async calculerITS(salaireMensuel: number, periodeFiscale: string): Promise<ITSCalculationResult> {
        return this.calculerITSAvecOptions(salaireMensuel, periodeFiscale, {});
    }

    public static async calculerITSWithoutRedevanceSRTB(salaireMensuel: number, periodeFiscale: string): Promise<ITSCalculationResult> {
        return this.calculerITSAvecOptions(salaireMensuel, periodeFiscale, { includeRedevanceSRTB: false });
    }

    public static async calculerITSPersonnalise(salaireMensuel: number, periodeFiscale: string, customRedevanceSRTB?: number): Promise<ITSCalculationResult> {
        return this.calculerITSAvecOptions(salaireMensuel, periodeFiscale, {
            includeRedevanceSRTB: customRedevanceSRTB !== undefined,
            customRedevanceSRTB
        });
    }

    public static async calculerITSAvecOptions(salaireMensuel: number, periodeFiscale: string, options: ITSCalculationOptions): Promise<ITSCalculationResult> {
        try {
            if (!salaireMensuel || salaireMensuel <= 0) {
                return ITSErrorHandler.genererErreurValidation('Le salaire doit être un montant positif');
            }

            const params = await fiscalParameterResolver.resolveRequiredParams<'ITS'>({
                codeImpot: 'ITS',
                typeContribuable: 'ENTREPRISE',
                periodeFiscale
            });

            return new ITSResponseBuilder(salaireMensuel, periodeFiscale, params, options).build();
        } catch (error) {
            if (error instanceof FiscalParametersError) {
                return buildFiscalParametersFailureResponse(error, {
                    typeContribuable: 'Salarié',
                    regime: 'ITS',
                    chiffreAffaire: salaireMensuel
                });
            }
            return ITSErrorHandler.genererErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de l\'ITS');
        }
    }
}

export default MoteurITS;
