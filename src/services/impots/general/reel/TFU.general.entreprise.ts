import { BackendEstimationFailureResponse } from "@/types/frontend.errors.estomation.type";
import { GlobalEstimationInfoData, ImpotDetailCalcule, VariableEnter } from "@/types/frontend.result.return.type";
import { buildFiscalParametersFailureResponse, FiscalParametersError } from '@/services/fiscal-parameters/errors';
import { fiscalParameterResolver } from '@/services/fiscal-parameters/FiscalParameterResolver';
import { TfuEntrepriseFiscalParams } from '@/types/fiscal-parameters';

interface TFUEntrepriseInput {
    possessionProprietes: boolean;
    NbrProprietes: number;
    proprietes: ProprieteInformation[];
    periodeFiscale: string;
}

interface ProprieteInformation {
    ville: string;
    valeurLocative: number;
    proprieteBatie: boolean;
    tauxTfu: number;
}

interface TFUEntrepriseCalculationOptions {
    includeDetailsParPropriete?: boolean;
    customTauxParVille?: Record<string, number>;
}

export type TFUEntrepriseCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

class TFUEntrepriseErrorHandler {
    static genererErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [{ code: 'VALIDATION_ERROR', message, details: `Erreur de validation des données d'entrée pour le calcul de la TFU Entreprise.`, severity: 'error' }],
            context: { typeContribuable: 'Entreprise propriétaire foncière', regime: 'TFU Entreprise', missingData: ['donnees_entree', 'proprietes', 'taux_tfu'] },
            timestamp: new Date().toISOString(),
            requestId: `tfu_entreprise_calc_${Date.now()}`
        };
    }
}

class TFUEntrepriseResponseBuilder {
    private totalTFU = 0;
    private variablesEnter: VariableEnter[] = [];
    private details: ImpotDetailCalcule[] = [];

    constructor(private readonly input: TFUEntrepriseInput, private readonly params: TfuEntrepriseFiscalParams, private readonly options: TFUEntrepriseCalculationOptions = {}) {
        this.options = { includeDetailsParPropriete: true, ...options };
        this.initializeCalculations();
    }

    private resolveRate(ville: string): number {
        const override = this.options.customTauxParVille?.[ville];
        if (override !== undefined) {
            return override;
        }

        const cityRate = this.params.taux_par_ville.find((item) => item.ville.toLowerCase() === ville.toLowerCase());
        return cityRate?.taux ?? this.params.taux_standard;
    }

    private initializeCalculations() {
        this.variablesEnter.push(
            { label: "Nombre de propriétés", description: "Nombre total de propriétés imposables à la TFU", value: this.input.NbrProprietes, currency: '' },
            { label: "Valeur locative totale", description: "Somme des valeurs locatives de toutes les propriétés", value: this.input.proprietes.reduce((sum, p) => sum + p.valeurLocative, 0), currency: 'FCFA' }
        );

        for (const propriete of this.input.proprietes) {
            const taux = this.resolveRate(propriete.ville);
            const taxe = propriete.valeurLocative * taux;
            this.totalTFU += taxe;

            if (this.options.includeDetailsParPropriete) {
                this.details.push({
                    impotTitle: `TFU - ${propriete.ville}`,
                    impotDescription: propriete.proprieteBatie ? 'Propriété bâtie' : 'Propriété non bâtie',
                    impotValue: Math.round(taxe),
                    impotValueCurrency: 'FCFA',
                    impotTaux: `${(taux * 100).toFixed(2)}%`,
                    importCalculeDescription: `TFU = ${propriete.valeurLocative.toLocaleString('fr-FR')} FCFA x ${(taux * 100).toFixed(2)}% = ${Math.round(taxe).toLocaleString('fr-FR')} FCFA`
                });
            }
        }

        this.totalTFU = Math.round(this.totalTFU);
    }

    build(): GlobalEstimationInfoData {
        return {
            totalEstimation: this.totalTFU,
            totalEstimationCurrency: 'FCFA',
            VariableEnter: this.variablesEnter,
            impotDetailCalcule: this.details,
            obligationEcheance: [
                {
                    impotTitle: 'TFU - Solde',
                    echeancePaiement: { echeancePeriodeLimite: '30 avril', echeanceDescription: "Solde de 50% du montant total de la taxe due." },
                    obligationDescription: "Le solde de 50% doit être versé au plus tard le 30 avril."
                }
            ],
            infosSupplementaires: [
                { infosTitle: 'Obligations spécifiques entreprises', infosDescription: ["Les taux appliqués sont lus par ville depuis le paramétrage fiscal annuel en base MongoDB."] }
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

class MoteurTFUEntreprise {
    public static async calculerTFUEntreprise(input: TFUEntrepriseInput): Promise<TFUEntrepriseCalculationResult> {
        return this.calculerTFUEntrepriseAvecOptions(input, {});
    }

    public static async calculerTFUEntrepriseAvecOptions(input: TFUEntrepriseInput, options: TFUEntrepriseCalculationOptions): Promise<TFUEntrepriseCalculationResult> {
        try {
            if (!input.possessionProprietes) {
                return TFUEntrepriseErrorHandler.genererErreurValidation('Aucune propriété déclarée');
            }
            if (!input.proprietes || input.proprietes.length === 0) {
                return TFUEntrepriseErrorHandler.genererErreurValidation('La liste des propriétés est vide');
            }
            if (input.NbrProprietes !== input.proprietes.length) {
                return TFUEntrepriseErrorHandler.genererErreurValidation('Le nombre de propriétés ne correspond pas à la liste fournie');
            }

            const params = await fiscalParameterResolver.resolveRequiredParams<'TFU'>({
                codeImpot: 'TFU',
                typeContribuable: 'ENTREPRISE',
                periodeFiscale: input.periodeFiscale
            });

            return new TFUEntrepriseResponseBuilder(input, params, options).build();
        } catch (error) {
            if (error instanceof FiscalParametersError) {
                return buildFiscalParametersFailureResponse(error, {
                    typeContribuable: 'Entreprise propriétaire foncière',
                    regime: 'TFU Entreprise',
                    chiffreAffaire: input.proprietes.reduce((sum, p) => sum + p.valeurLocative, 0)
                });
            }
            return TFUEntrepriseErrorHandler.genererErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de la TFU Entreprise');
        }
    }

    public static async calculerTFUEntreprisePersonnalise(input: TFUEntrepriseInput, customTauxParVille?: Record<string, number>, includeDetailsParPropriete: boolean = true): Promise<TFUEntrepriseCalculationResult> {
        return this.calculerTFUEntrepriseAvecOptions(input, {
            customTauxParVille,
            includeDetailsParPropriete
        });
    }
}

export default MoteurTFUEntreprise;
