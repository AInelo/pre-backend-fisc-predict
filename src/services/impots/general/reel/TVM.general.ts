import { BackendEstimationFailureResponse } from "@/types/frontend.errors.estomation.type";
import { GlobalEstimationInfoData, VariableEnter, ImpotDetailCalcule } from "@/types/frontend.result.return.type";

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

// Options de calcul
interface TVMCalculationOptions {
    includeDetailsParVehicule?: boolean; // affiche les lignes par véhicule (true par défaut)
}

export type TVMCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

// Configuration centrale
class TVMConfig {
    static readonly TITLE = 'Taxe sur les Véhicules à Moteur (TVM)';
    static readonly LABEL = 'TVM';
    static readonly DESCRIPTION = `La TVM est un impôt local annuel calculé sur chaque véhicule à moteur possédé.
            Le montant varie selon le type de véhicule (particulier, société, transport) et ses caractéristiques techniques.
            La taxe est due annuellement et doit être payée avant le 30 avril.`;
    static readonly COMPETENT_CENTER = "Centre des Impôts des Petites Entreprises (CIPE) de votre ressort territorial.";
}

// Gestion d'erreurs
class TVMErrorHandler {
    static genererErreurAnnee(input: TVMInput, annee: number): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'CONSTANTES_NON_DISPONIBLES',
                    message: `Les taux TVM pour l'année ${annee} ne sont pas encore disponibles.`,
                    details: `Le calcul de la Taxe sur les Véhicules à Moteur pour l'année ${annee} ne peut pas être effectué car les taux officiels n'ont pas encore été publiés par l'administration fiscale béninoise.`,
                    severity: 'info'
                }
            ],
            context: {
                typeContribuable: 'Propriétaire de véhicule',
                regime: 'TVM',
                chiffreAffaire: 0,
                missingData: ['taux_tvm', 'seuils_imposition', 'tarifs_vehicules']
            },
            timestamp: new Date().toISOString(),
            requestId: `tvm_calc_${Date.now()}`
        };
    }

    static genererErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'VALIDATION_ERROR',
                    message: message,
                    details: `Erreur de validation des données d'entrée pour le calcul de la TVM.`,
                    severity: 'error'
                }
            ],
            context: {
                typeContribuable: 'Propriétaire de véhicule',
                regime: 'TVM',
                missingData: ['donnees_entree', 'vehicules', 'caracteristiques']
            },
            timestamp: new Date().toISOString(),
            requestId: `tvm_calc_${Date.now()}`
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

// Builder de réponse
class TVMResponseBuilder {
    private input: TVMInput;
    private options: TVMCalculationOptions;

    private totalTVM: number = 0;
    private detailsVehicules: { vehicleType: VehicleInput['vehicleType']; power?: number; capacity?: number; taxeCalculee: number }[] = [];

    constructor(input: TVMInput, options: TVMCalculationOptions = {}) {
        this.input = input;
        this.options = { includeDetailsParVehicule: true, ...options };
        this.initializeCalculations();
    }

    private initializeCalculations() {
        let totalTVM = 0;
        for (const vehicle of this.input.vehicles) {
            const taxe = TVMResponseBuilder.calculerTaxeVehicule(vehicle);
            totalTVM += taxe;
            this.detailsVehicules.push({
                vehicleType: vehicle.vehicleType,
                power: vehicle.power,
                capacity: vehicle.capacity,
                taxeCalculee: Math.round(taxe)
            });
        }
        this.totalTVM = Math.round(totalTVM);
    }

    private buildVariablesEnter(): VariableEnter[] {
        return [
            {
                label: "Nombre de véhicules",
                description: "Nombre total de véhicules imposables à la TVM",
                value: this.input.vehicles.length,
                currency: ''
            },
            {
                label: "Types de véhicules",
                description: "Répartition par type de véhicule",
                value: TVMResponseBuilder.getVehicleTypeCount(this.input.vehicles),
                currency: ''
            }
        ];
    }

    private buildImpotDetailCalcule(): ImpotDetailCalcule[] {
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
                    impotTitle: `Véhicule ${index + 1} - ${TVMResponseBuilder.getVehicleTypeLabel(detail.vehicleType)}`,
                    impotDescription: TVMResponseBuilder.getVehicleDescription(detail),
                    impotValue: detail.taxeCalculee,
                    impotValueCurrency: 'FCFA',
                    impotTaux: TVMResponseBuilder.getVehicleRate(detail),
                    importCalculeDescription: `${TVMResponseBuilder.getVehicleTypeLabel(detail.vehicleType)} : ${detail.taxeCalculee.toLocaleString('fr-FR')} FCFA`
                });
            });
        }

        return details;
    }

    private buildObligationEcheance() {
        return [
            {
                impotTitle: 'TVM - Paiement annuel',
                echeancePaiement: {
                    echeancePeriodeLimite: '30 avril',
                    echeanceDescription: "Paiement de la TVM annuelle."
                },
                obligationDescription: "La TVM doit être payée au plus tard le 30 avril de chaque année."
            },
            {
                impotTitle: 'TVM - Déclaration des véhicules',
                echeancePaiement: {
                    echeancePeriodeLimite: '30 jours après acquisition',
                    echeanceDescription: "Déclaration de l'acquisition d'un nouveau véhicule."
                },
                obligationDescription: "Tout nouveau véhicule doit être déclaré dans les 30 jours suivant son acquisition."
            },
            {
                impotTitle: 'TVM - Mise à jour des informations',
                echeancePaiement: {
                    echeancePeriodeLimite: '30 jours après changement',
                    echeanceDescription: "Déclaration des modifications importantes du véhicule."
                },
                obligationDescription: "Les modifications importantes (changement de propriétaire, destruction, etc.) doivent être déclarées dans les 30 jours."
            }
        ];
    }

    private buildInfosSupplementaires() {
        return [
            {
                infosTitle: 'Tarifs par type de véhicule',
                infosDescription: [
                    "Tricycles : 15 000 FCFA (montant fixe)",
                    "Véhicules de société : 150 000 FCFA (≤7 CV) ou 200 000 FCFA (>7 CV)",
                    "Véhicules particuliers : 20 000 FCFA (≤7 CV), 30 000 FCFA (≤10 CV), 40 000 FCFA (≤15 CV), 60 000 FCFA (>15 CV)",
                    "Transports de personnes : 38 000 FCFA (≤9 places), 59 800 FCFA (≤20 places), 86 800 FCFA (>20 places)",
                    "Transports de marchandises : 49 500 FCFA (≤2.5T), 68 200 FCFA (≤5T), 102 300 FCFA (≤10T), 136 400 FCFA (>10T)"
                ]
            },
            {
                infosTitle: 'Calcul de la TVM',
                infosDescription: [
                    "La TVM est calculée selon le type de véhicule et ses caractéristiques techniques.",
                    "Pour les véhicules particuliers, la taxe varie selon la puissance fiscale.",
                    "Pour les véhicules de transport, la taxe varie selon la capacité.",
                    "La TVM est due pour chaque véhicule possédé par le contribuable."
                ]
            },
            {
                infosTitle: 'Obligations et sanctions',
                infosDescription: [
                    "Paiement annuel obligatoire avant le 30 avril.",
                    "Déclaration des nouveaux véhicules dans les 30 jours.",
                    "Sanctions en cas de retard de paiement ou de non-déclaration.",
                    "Possibilité de vérification par les services fiscaux."
                ]
            }
        ];
    }

    private buildImpotConfig() {
        return {
            impotTitle: TVMConfig.TITLE,
            label: TVMConfig.LABEL,
            description: TVMConfig.DESCRIPTION,
            competentCenter: TVMConfig.COMPETENT_CENTER,
            paymentSchedule: [
                {
                    date: "30 avril",
                    description: "Paiement annuel de la TVM"
                }
            ]
        };
    }

    build(): GlobalEstimationInfoData {
        return {
            totalEstimation: this.totalTVM,
            totalEstimationCurrency: 'FCFA',
            VariableEnter: this.buildVariablesEnter(),
            impotDetailCalcule: this.buildImpotDetailCalcule(),
            obligationEcheance: this.buildObligationEcheance(),
            infosSupplementaires: this.buildInfosSupplementaires(),
            impotConfig: this.buildImpotConfig()
        };
    }

    // ----- Méthodes utilitaires de calcul (issues de l'implémentation d'origine) -----
    private static calculerTaxeVehicule(vehicle: VehicleInput): number {
        const rateMap = {
            tricycle: () => 15000,
            company: (vehicle: VehicleInput) => (vehicle.power ?? 0) <= 7 ? 150000 : 200000,
            private: (vehicle: VehicleInput) => {
                const power = vehicle.power ?? 0;
                if (power <= 7) return 20000;
                if (power <= 10) return 30000;
                if (power <= 15) return 40000;
                return 60000;
            },
            'public-persons': (vehicle: VehicleInput) => {
                const capacity = vehicle.capacity ?? 0;
                if (capacity <= 9) return 38000;
                if (capacity <= 20) return 59800;
                return 86800;
            },
            'public-goods': (vehicle: VehicleInput) => {
                const capacity = vehicle.capacity ?? 0;
                if (capacity <= 2.5) return 49500;
                if (capacity <= 5) return 68200;
                if (capacity <= 10) return 102300;
                return 136400;
            }
        };
        const calculator = rateMap[vehicle.vehicleType];
        if (typeof calculator === 'function') {
            return calculator(vehicle);
        }
        return 0;
    }

    private static getVehicleTypeCount(vehicles: VehicleInput[]): number {
        const typeCount: Record<string, number> = {};
        vehicles.forEach(vehicle => {
            typeCount[vehicle.vehicleType] = (typeCount[vehicle.vehicleType] || 0) + 1;
        });
        return Object.keys(typeCount).length;
    }

    private static getVehicleTypeLabel(vehicleType: string): string {
        const labels: Record<string, string> = {
            'tricycle': 'Tricycle',
            'company': 'Véhicule de société',
            'private': 'Véhicule particulier',
            'public-persons': 'Transport de personnes',
            'public-goods': 'Transport de marchandises'
        };
        return labels[vehicleType] || vehicleType;
    }

    private static getVehicleDescription(detail: { vehicleType: VehicleInput['vehicleType']; power?: number; capacity?: number }): string {
        switch (detail.vehicleType) {
            case 'tricycle':
                return 'Tricycle à moteur (montant fixe)';
            case 'company':
                return `Véhicule de société (${detail.power || 0} CV)`;
            case 'private':
                return `Véhicule particulier (${detail.power || 0} CV)`;
            case 'public-persons':
                return `Transport de personnes (${detail.capacity || 0} places)`;
            case 'public-goods':
                return `Transport de marchandises (${detail.capacity || 0} tonnes)`;
            default:
                return 'Véhicule non spécifié';
        }
    }

    private static getVehicleRate(detail: { vehicleType: VehicleInput['vehicleType']; power?: number; capacity?: number }): string {
        switch (detail.vehicleType) {
            case 'tricycle':
                return '15 000 FCFA (fixe)';
            case 'company':
                return (detail.power || 0) <= 7 ? '150 000 FCFA' : '200 000 FCFA';
            case 'private':
                const power = detail.power || 0;
                if (power <= 7) return '20 000 FCFA';
                if (power <= 10) return '30 000 FCFA';
                if (power <= 15) return '40 000 FCFA';
                return '60 000 FCFA';
            case 'public-persons':
                const capacityPersons = detail.capacity || 0;
                if (capacityPersons <= 9) return '38 000 FCFA';
                if (capacityPersons <= 20) return '59 800 FCFA';
                return '86 800 FCFA';
            case 'public-goods':
                const capacityGoods = detail.capacity || 0;
                if (capacityGoods <= 2.5) return '49 500 FCFA';
                if (capacityGoods <= 5) return '68 200 FCFA';
                if (capacityGoods <= 10) return '102 300 FCFA';
                return '136 400 FCFA';
            default:
                return 'Tarif non défini';
        }
    }
}

// Classe principale
class MoteurTVM {
    public static calculerTVM(input: TVMInput): TVMCalculationResult {
        try {
            if (!input.hasVehicles) {
                return TVMErrorHandler.genererErreurValidation('Aucun véhicule déclaré');
            }
            if (!input.vehicles || input.vehicles.length === 0) {
                return TVMErrorHandler.genererErreurValidation('Aucun véhicule déclaré');
            }

            const annee = DateUtils.extraireAnnee(input.periodeFiscale);
            if (annee >= 2026) {
                return TVMErrorHandler.genererErreurAnnee(input, annee);
            }

            return new TVMResponseBuilder(input, {}).build();
        } catch (error) {
            return TVMErrorHandler.genererErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de la TVM');
        }
    }

    public static calculerTVMAvecOptions(input: TVMInput, options: TVMCalculationOptions): TVMCalculationResult {
        try {
            if (!input.hasVehicles) {
                return TVMErrorHandler.genererErreurValidation('Aucun véhicule déclaré');
            }
            if (!input.vehicles || input.vehicles.length === 0) {
                return TVMErrorHandler.genererErreurValidation('Aucun véhicule déclaré');
            }

            const annee = DateUtils.extraireAnnee(input.periodeFiscale);
            if (annee >= 2026) {
                return TVMErrorHandler.genererErreurAnnee(input, annee);
            }

            return new TVMResponseBuilder(input, options).build();
        } catch (error) {
            return TVMErrorHandler.genererErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de la TVM');
        }
    }

    public static calculerTVMPersonnalise(input: TVMInput, includeDetailsParVehicule: boolean = true): TVMCalculationResult {
        return this.calculerTVMAvecOptions(input, { includeDetailsParVehicule });
    }
}

export default MoteurTVM;
