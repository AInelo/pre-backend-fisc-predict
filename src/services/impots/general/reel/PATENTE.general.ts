import { BackendEstimationFailureResponse } from "@/types/frontend.errors.estomation.type";
import { GlobalEstimationInfoData, ImpotDetailCalcule, VariableEnter } from "@/types/frontend.result.return.type";
import { buildFiscalParametersFailureResponse, FiscalParametersError } from '@/services/fiscal-parameters/errors';
import { fiscalParameterResolver } from '@/services/fiscal-parameters/FiscalParameterResolver';
import { PatenteFiscalParams } from '@/types/fiscal-parameters';

interface PatenteInput {
    chiffreAffaire: number;
    periodeFiscale: string;
    etablissements: Etablissement[];
    isImporter?: boolean;
    importExportAmount?: number;
}

interface Etablissement {
    location: 'cotonou' | 'porto-novo' | 'ouidah' | 'abomey' | 'parakou' | 'other-zone1' | 'other-zone2' | 'alibori' | 'atacora' | 'borgou' | 'donga' | 'atlantique' | 'collines' | 'couffo' | 'littoral' | 'mono' | 'oueme' | 'plateau' | 'zou';
    rentalValue: number;
    nom?: string;
    adresse?: string;
}

interface PatenteCalculationOptions {
    includeImportExportAdjustment?: boolean;
}

export type PatenteCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

class PatenteErrorHandler {
    static genererErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [{ code: 'VALIDATION_ERROR', message, details: `Erreur de validation des données d'entrée pour le calcul de la patente.`, severity: 'error' }],
            context: { typeContribuable: 'Entreprise/Entrepreneur', regime: 'Patente', missingData: ['donnees_entree', 'etablissements', 'localisation'] },
            timestamp: new Date().toISOString(),
            requestId: `patente_calc_${Date.now()}`
        };
    }
}

class PatenteResponseBuilder {
    private totalPatente = 0;
    private variablesEnter: VariableEnter[] = [];
    private details: ImpotDetailCalcule[] = [];

    constructor(private readonly input: PatenteInput, private readonly params: PatenteFiscalParams, private readonly options: PatenteCalculationOptions = {}) {
        this.options = { includeImportExportAdjustment: true, ...options };
        this.initializeCalculations();
    }

    private isFirstZone(location: string): boolean {
        return this.params.first_zone_locations.includes(location);
    }

    private getProportionalRate(location: string): number {
        return this.params.proportional_rates[location] ?? this.params.proportional_rates['other-zone1'] ?? 0;
    }

    private getImportExportAmount(amount: number): number {
        const rule = this.params.import_export_fixed_rates.find((item) => item.maxAmount === null || amount <= item.maxAmount);
        return rule?.amount ?? 0;
    }

    private initializeCalculations() {
        this.variablesEnter.push(
            { label: "Chiffre d'affaires global", description: "Revenus totaux de tous les établissements", value: this.input.chiffreAffaire, currency: 'FCFA' },
            { label: "Nombre d'établissements", description: "Nombre total d'établissements déclarés", value: this.input.etablissements.length, currency: '' }
        );

        this.input.etablissements.forEach((etablissement, index) => {
            const baseFixedRate = this.isFirstZone(etablissement.location) ? this.params.fixed_rate_zone1 : this.params.fixed_rate_zone2;
            const additionalBillions = this.input.chiffreAffaire > 1_000_000_000 ? Math.floor(this.input.chiffreAffaire / 1_000_000_000) : 0;
            let fixedRate = baseFixedRate + additionalBillions * this.params.add_per_billion_ca;

            if (index === 0 && this.options.includeImportExportAdjustment && this.input.isImporter && this.input.importExportAmount) {
                fixedRate = this.getImportExportAmount(this.input.importExportAmount);
            }

            const proportionalRate = this.getProportionalRate(etablissement.location);
            const proportional = etablissement.rentalValue <= 0 ? 0 : Math.max(etablissement.rentalValue * (proportionalRate / 100), fixedRate / 3);
            const total = fixedRate + proportional;
            this.totalPatente += total;

            this.details.push({
                impotTitle: `${etablissement.nom || `Établissement ${index + 1}`} - Total`,
                impotDescription: `Patente pour ${etablissement.location}`,
                impotValue: Math.round(total),
                impotValueCurrency: 'FCFA',
                impotTaux: `${proportionalRate}%`,
                importCalculeDescription: `Part fixe ${Math.round(fixedRate).toLocaleString('fr-FR')} FCFA + part proportionnelle ${Math.round(proportional).toLocaleString('fr-FR')} FCFA`
            });
        });

        this.totalPatente = Math.round(this.totalPatente);
    }

    build(): GlobalEstimationInfoData {
        return {
            totalEstimation: this.totalPatente,
            totalEstimationCurrency: 'FCFA',
            VariableEnter: this.variablesEnter,
            impotDetailCalcule: this.details,
            obligationEcheance: [
                {
                    impotTitle: 'Patente - Paiement annuel',
                    echeancePaiement: { echeancePeriodeLimite: '30 avril', echeanceDescription: "Paiement de la patente annuelle pour tous les établissements." },
                    obligationDescription: "La patente doit être payée au plus tard le 30 avril de chaque année pour tous les établissements."
                }
            ],
            infosSupplementaires: [
                {
                    infosTitle: 'Calcul multi-établissements',
                    infosDescription: [
                        `Nombre d'établissements : ${this.input.etablissements.length}`,
                        "Les zones et taux proportionnels sont lus depuis le paramétrage fiscal annuel en base MongoDB."
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

class MoteurPatente {
    public static async calculerPatente(input: PatenteInput): Promise<PatenteCalculationResult> {
        return this.calculerPatenteAvecOptions(input, {});
    }

    public static async calculerPatenteWithoutImportExportAdjustment(input: PatenteInput): Promise<PatenteCalculationResult> {
        return this.calculerPatenteAvecOptions(input, { includeImportExportAdjustment: false });
    }

    public static async calculerPatenteAvecOptions(input: PatenteInput, options: PatenteCalculationOptions): Promise<PatenteCalculationResult> {
        try {
            if (input.chiffreAffaire <= 0) {
                return PatenteErrorHandler.genererErreurValidation("Le chiffre d'affaires doit être positif");
            }
            if (!input.etablissements || input.etablissements.length === 0) {
                return PatenteErrorHandler.genererErreurValidation('Aucun établissement défini');
            }

            const params = await fiscalParameterResolver.resolveRequiredParams<'PATENTE'>({
                codeImpot: 'PATENTE',
                typeContribuable: 'ENTREPRISE',
                periodeFiscale: input.periodeFiscale
            });

            return new PatenteResponseBuilder(input, params, options).build();
        } catch (error) {
            if (error instanceof FiscalParametersError) {
                return buildFiscalParametersFailureResponse(error, {
                    typeContribuable: 'Entreprise/Entrepreneur',
                    regime: 'Patente',
                    chiffreAffaire: input.chiffreAffaire
                });
            }
            return PatenteErrorHandler.genererErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de la patente');
        }
    }
}

export default MoteurPatente;
