import { BackendEstimationFailureResponse } from "@/types/frontend.errors.estomation.type";
import { GlobalEstimationInfoData, ImpotDetailCalcule, VariableEnter } from "@/types/frontend.result.return.type";
import { buildFiscalParametersFailureResponse, FiscalParametersError } from '@/services/fiscal-parameters/errors';
import { fiscalParameterResolver } from '@/services/fiscal-parameters/FiscalParameterResolver';
import { TvmFiscalParams } from '@/types/fiscal-parameters';

interface TVMInput {
    hasVehicles: boolean;
    vehicles: VehicleInput[];
    periodeFiscale: string;
}

interface VehicleInput {
    vehicleType: 'tricycle' | 'company' | 'private' | 'public-persons' | 'public-goods';
    power?: number;
    capacity?: number;
}

interface TVMCalculationOptions {
    includeDetailsParVehicule?: boolean;
}

export type TVMCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

class TVMErrorHandler {
    static genererErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [{ code: 'VALIDATION_ERROR', message, details: `Erreur de validation des données d'entrée pour le calcul de la TVM.`, severity: 'error' }],
            context: { typeContribuable: 'Propriétaire de véhicule', regime: 'TVM', missingData: ['donnees_entree', 'vehicules', 'caracteristiques'] },
            timestamp: new Date().toISOString(),
            requestId: `tvm_calc_${Date.now()}`
        };
    }
}

class TVMResponseBuilder {
    private totalTVM = 0;
    private detailsVehicules: { vehicleType: VehicleInput['vehicleType']; taxeCalculee: number }[] = [];

    constructor(private readonly input: TVMInput, private readonly params: TvmFiscalParams, private readonly options: TVMCalculationOptions = {}) {
        this.options = { includeDetailsParVehicule: true, ...options };
        this.initializeCalculations();
    }

    private computeVehicleTax(vehicle: VehicleInput): number {
        switch (vehicle.vehicleType) {
            case 'tricycle':
                return this.params.tarifs.tricycle;
            case 'company':
                return this.params.tarifs.company.find((item) => item.maxPower === null || (vehicle.power ?? 0) <= item.maxPower)?.amount ?? 0;
            case 'private':
                return this.params.tarifs.private.find((item) => item.maxPower === null || (vehicle.power ?? 0) <= item.maxPower)?.amount ?? 0;
            case 'public-persons':
                return this.params.tarifs.public_persons.find((item) => item.maxCapacity === null || (vehicle.capacity ?? 0) <= item.maxCapacity)?.amount ?? 0;
            case 'public-goods':
                return this.params.tarifs.public_goods.find((item) => item.maxCapacity === null || (vehicle.capacity ?? 0) <= item.maxCapacity)?.amount ?? 0;
            default:
                return 0;
        }
    }

    private initializeCalculations() {
        for (const vehicle of this.input.vehicles) {
            const taxe = this.computeVehicleTax(vehicle);
            this.totalTVM += taxe;
            this.detailsVehicules.push({ vehicleType: vehicle.vehicleType, taxeCalculee: Math.round(taxe) });
        }

        this.totalTVM = Math.round(this.totalTVM);
    }

    build(): GlobalEstimationInfoData {
        const details: ImpotDetailCalcule[] = [
            {
                impotTitle: 'TVM (Taxe sur les Véhicules à Moteur)',
                impotDescription: `Calculée pour ${this.input.vehicles.length} véhicule(s) selon les tarifs en vigueur`,
                impotValue: this.totalTVM,
                impotValueCurrency: 'FCFA',
                impotTaux: 'Tarifs variables selon le type et les caractéristiques',
                importCalculeDescription: `TVM totale = ${this.totalTVM.toLocaleString('fr-FR')} FCFA pour ${this.input.vehicles.length} véhicule(s)`
            }
        ];

        if (this.options.includeDetailsParVehicule) {
            this.detailsVehicules.forEach((detail, index) => {
                details.push({
                    impotTitle: `Véhicule ${index + 1} - ${detail.vehicleType}`,
                    impotDescription: 'Montant appliqué selon le paramétrage fiscal',
                    impotValue: detail.taxeCalculee,
                    impotValueCurrency: 'FCFA',
                    impotTaux: 'Tarif paramétré',
                    importCalculeDescription: `${detail.vehicleType} : ${detail.taxeCalculee.toLocaleString('fr-FR')} FCFA`
                });
            });
        }

        const variables: VariableEnter[] = [
            { label: "Nombre de véhicules", description: "Nombre total de véhicules imposables à la TVM", value: this.input.vehicles.length, currency: '' }
        ];

        return {
            totalEstimation: this.totalTVM,
            totalEstimationCurrency: 'FCFA',
            VariableEnter: variables,
            impotDetailCalcule: details,
            obligationEcheance: [
                {
                    impotTitle: 'TVM - Paiement annuel',
                    echeancePaiement: { echeancePeriodeLimite: '30 avril', echeanceDescription: "Paiement de la TVM annuelle." },
                    obligationDescription: "La TVM doit être payée au plus tard le 30 avril de chaque année."
                }
            ],
            infosSupplementaires: [
                { infosTitle: 'Tarifs par type de véhicule', infosDescription: ["Les montants sont lus depuis le paramétrage fiscal annuel en base MongoDB."] }
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

class MoteurTVM {
    public static async calculerTVM(input: TVMInput): Promise<TVMCalculationResult> {
        return this.calculerTVMAvecOptions(input, {});
    }

    public static async calculerTVMAvecOptions(input: TVMInput, options: TVMCalculationOptions): Promise<TVMCalculationResult> {
        try {
            if (!input.hasVehicles || !input.vehicles || input.vehicles.length === 0) {
                return TVMErrorHandler.genererErreurValidation('Aucun véhicule déclaré');
            }

            const params = await fiscalParameterResolver.resolveRequiredParams<'TVM'>({
                codeImpot: 'TVM',
                typeContribuable: 'ENTREPRISE',
                periodeFiscale: input.periodeFiscale
            });

            return new TVMResponseBuilder(input, params, options).build();
        } catch (error) {
            if (error instanceof FiscalParametersError) {
                return buildFiscalParametersFailureResponse(error, {
                    typeContribuable: 'Propriétaire de véhicule',
                    regime: 'TVM'
                });
            }
            return TVMErrorHandler.genererErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de la TVM');
        }
    }

    public static async calculerTVMPersonnalise(input: TVMInput, includeDetailsParVehicule: boolean = true): Promise<TVMCalculationResult> {
        return this.calculerTVMAvecOptions(input, { includeDetailsParVehicule });
    }
}

export default MoteurTVM;
