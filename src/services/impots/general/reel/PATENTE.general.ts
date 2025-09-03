import { BackendEstimationFailureResponse } from "@/types/frontend.errors.estomation.type";
import { GlobalEstimationInfoData, VariableEnter, ImpotDetailCalcule } from "@/types/frontend.result.return.type";

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
    nom?: string; // Nom de l'établissement (optionnel)
    adresse?: string; // Adresse (optionnel)
}

// Options de calcul
interface PatenteCalculationOptions {
    includeImportExportAdjustment?: boolean; // appliquer l'ajustement import/export sur la part fixe (par défaut true)
}

export type PatenteCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

// Configuration centrale
class PatenteConfig {
    static readonly FIXED_RATE_ZONE1 = 70_000; // Part fixe zone 1
    static readonly FIXED_RATE_ZONE2 = 60_000; // Part fixe zone 2
    static readonly ADD_PER_BILLION_CA = 10_000; // Majoration par milliard de CA global

    static readonly TITLE = 'Patente Multi-Établissements';
    static readonly LABEL = 'Patente';
    static readonly DESCRIPTION = `La patente est un impôt local annuel calculé pour chaque établissement sur la base :
            - d'une part fixe selon la zone géographique (70 000 ou 60 000 FCFA)
            - d'une part proportionnelle sur la valeur locative de l'établissement (12% à 25%)
            Elle s'applique à tous les établissements commerciaux, industriels et artisanaux.
            Pour les entreprises multi-établissements, chaque établissement paie sa propre patente.
            Le paiement est annuel et doit être effectué avant le 30 avril.`;
    static readonly COMPETENT_CENTER = "Centre des Impôts des Petites Entreprises (CIPE) du ressort territorial de chaque établissement.";
}

// Gestion d'erreurs
class PatenteErrorHandler {
    static genererErreurAnnee(input: PatenteInput, annee: number): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'CONSTANTES_NON_DISPONIBLES',
                    message: `Les taux de patente pour l'année ${annee} ne sont pas encore disponibles.`,
                    details: `Le calcul de la patente pour l'année ${annee} ne peut pas être effectué car les taux officiels n'ont pas encore été publiés par l'administration fiscale béninoise.`,
                    severity: 'info'
                }
            ],
            context: {
                typeContribuable: 'Entreprise/Entrepreneur',
                regime: 'Patente',
                chiffreAffaire: input.chiffreAffaire,
                missingData: ['taux_patente', 'seuils_imposition', 'tarifs_geographiques']
            },
            timestamp: new Date().toISOString(),
            requestId: `patente_calc_${Date.now()}`
        };
    }

    static genererErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'VALIDATION_ERROR',
                    message: message,
                    details: `Erreur de validation des données d'entrée pour le calcul de la patente.`,
                    severity: 'error'
                }
            ],
            context: {
                typeContribuable: 'Entreprise/Entrepreneur',
                regime: 'Patente',
                missingData: ['donnees_entree', 'etablissements', 'localisation']
            },
            timestamp: new Date().toISOString(),
            requestId: `patente_calc_${Date.now()}`
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
class PatenteResponseBuilder {
    private input: PatenteInput;
    private options: PatenteCalculationOptions;

    private totalPatente: number = 0;
    private variablesEnter: VariableEnter[] = [];
    private details: ImpotDetailCalcule[] = [];

    constructor(input: PatenteInput, options: PatenteCalculationOptions = {}) {
        this.input = input;
        this.options = { includeImportExportAdjustment: true, ...options };
        this.initializeCalculations();
    }

    private initializeCalculations() {
        // Variables globales
        this.variablesEnter.push(
            {
                label: "Chiffre d'affaires global",
                description: "Revenus totaux de tous les établissements",
                value: this.input.chiffreAffaire,
                currency: 'FCFA'
            },
            {
                label: "Nombre d'établissements",
                description: "Nombre total d'établissements déclarés",
                value: this.input.etablissements.length,
                currency: ''
            }
        );

        // Calcul par établissement
        this.input.etablissements.forEach((etablissement, index) => {
            const zone = PatenteResponseBuilder.getLocationZone(etablissement.location);
            const baseFixedRate = zone === 'first' ? PatenteConfig.FIXED_RATE_ZONE1 : PatenteConfig.FIXED_RATE_ZONE2;

            // Ajuster le taux fixe selon le CA global
            let patentFixedRate = PatenteResponseBuilder.adjustForChiffreAffaire(baseFixedRate, this.input.chiffreAffaire);

            // Ajuster pour import-export au premier établissement seulement (optionnel)
            if (index === 0 && this.options.includeImportExportAdjustment) {
                patentFixedRate = PatenteResponseBuilder.adjustForImportExport(patentFixedRate, this.input);
            }

            // Part proportionnelle
            const proportionalRate = PatenteResponseBuilder.calculerTauxProportionnel(etablissement.location);
            const patentProportionalRate = PatenteResponseBuilder.calculerPartProportionnelle(
                etablissement.rentalValue,
                proportionalRate,
                patentFixedRate
            );

            // Total établissement
            const patenteEtablissement = patentFixedRate + patentProportionalRate;
            this.totalPatente += patenteEtablissement;

            const etablissementNom = etablissement.nom || `Établissement ${index + 1}`;
            const locationDisplay = PatenteResponseBuilder.getLocationDisplayName(etablissement.location);

            // Variables d'entrée par établissement
            this.variablesEnter.push({
                label: `${etablissementNom} - Localisation`,
                description: `Zone géographique de l'établissement`,
                value: locationDisplay,
                currency: ''
            });

            if (etablissement.rentalValue > 0) {
                this.variablesEnter.push({
                    label: `${etablissementNom} - Valeur locative`,
                    description: `Valeur locative annuelle`,
                    value: etablissement.rentalValue,
                    currency: 'FCFA'
                });
            }

            // Détails part fixe
            this.details.push({
                impotTitle: `${etablissementNom} - Part fixe`,
                impotDescription: `Part fixe de la patente - Zone ${zone === 'first' ? '1' : '2'} (${locationDisplay})`,
                impotValue: Math.round(patentFixedRate),
                impotValueCurrency: 'FCFA',
                impotTaux: 'Montant fixe',
                importCalculeDescription: `Part fixe = ${Math.round(patentFixedRate).toLocaleString('fr-FR')} FCFA (zone ${zone === 'first' ? '1' : '2'})`
            });

            // Détails part proportionnelle
            if (etablissement.rentalValue > 0) {
                this.details.push({
                    impotTitle: `${etablissementNom} - Part proportionnelle`,
                    impotDescription: `Part proportionnelle sur la valeur locative (${proportionalRate}%)`,
                    impotValue: Math.round(patentProportionalRate),
                    impotValueCurrency: 'FCFA',
                    impotTaux: `${proportionalRate}%`,
                    importCalculeDescription: `Part proportionnelle = ${etablissement.rentalValue.toLocaleString('fr-FR')} FCFA × ${proportionalRate}% = ${Math.round(patentProportionalRate).toLocaleString('fr-FR')} FCFA`
                });
            } else {
                this.details.push({
                    impotTitle: `${etablissementNom} - Part proportionnelle`,
                    impotDescription: `Aucune valeur locative déclarée`,
                    impotValue: 0,
                    impotValueCurrency: 'FCFA',
                    impotTaux: 'N/A',
                    importCalculeDescription: `Aucune valeur locative pour cet établissement`
                });
            }

            // Détail total établissement
            this.details.push({
                impotTitle: `${etablissementNom} - Total`,
                impotDescription: `Total patente pour cet établissement`,
                impotValue: Math.round(patenteEtablissement),
                impotValueCurrency: 'FCFA',
                impotTaux: 'Somme',
                importCalculeDescription: `Total = ${Math.round(patentFixedRate).toLocaleString('fr-FR')} + ${Math.round(patentProportionalRate).toLocaleString('fr-FR')} = ${Math.round(patenteEtablissement).toLocaleString('fr-FR')} FCFA`
            });
        });

        // Détail surtaxe import-export (informatif)
        if (this.input.isImporter && this.input.importExportAmount && this.options.includeImportExportAdjustment) {
            const surtaxeImportExport = PatenteResponseBuilder.calculerSurtaxeImportExport(this.input.importExportAmount);
            this.details.push({
                impotTitle: 'Surtaxe import-export',
                impotDescription: 'Surtaxe spéciale pour les activités d\'import-export',
                impotValue: surtaxeImportExport,
                impotValueCurrency: 'FCFA',
                impotTaux: 'Variable selon le montant',
                importCalculeDescription: `Surtaxe import-export = ${surtaxeImportExport.toLocaleString('fr-FR')} FCFA (montant: ${this.input.importExportAmount.toLocaleString('fr-FR')} FCFA)`
            });
        }
    }

    private buildObligationEcheance() {
        return [
            {
                impotTitle: 'Patente - Paiement annuel',
                echeancePaiement: {
                    echeancePeriodeLimite: '30 avril',
                    echeanceDescription: "Paiement de la patente annuelle pour tous les établissements."
                },
                obligationDescription: "La patente doit être payée au plus tard le 30 avril de chaque année pour tous les établissements."
            },
            {
                impotTitle: 'Patente - Déclaration des établissements',
                echeancePaiement: {
                    echeancePeriodeLimite: '30 jours après ouverture',
                    echeanceDescription: "Déclaration de l\'ouverture d\'un nouvel établissement."
                },
                obligationDescription: "Tout nouvel établissement doit être déclaré dans les 30 jours suivant son ouverture."
            },
            {
                impotTitle: 'Patente - Mise à jour des informations',
                echeancePaiement: {
                    echeancePeriodeLimite: '30 jours après changement',
                    echeanceDescription: "Déclaration des modifications importantes."
                },
                obligationDescription: "Les modifications importantes (changement d\'adresse, d\'activité, fermeture d\'établissement, etc.) doivent être déclarées dans les 30 jours."
            }
        ];
    }

    private buildInfosSupplementaires() {
        return [
            {
                infosTitle: 'Calcul multi-établissements',
                infosDescription: [
                    `Nombre d'établissements : ${this.input.etablissements.length}`,
                    "Chaque établissement paie sa propre patente selon sa localisation et sa valeur locative",
                    "Les ajustements liés au chiffre d'affaires global s'appliquent à tous les établissements",
                    "La surtaxe import-export ne s'applique qu'une seule fois (établissement principal)"
                ]
            },
            {
                infosTitle: 'Zones géographiques et tarifs',
                infosDescription: [
                    "Zone 1 (Cotonou, Porto-Novo, Ouidah, Abomey, etc.) : Part fixe de 70 000 FCFA",
                    "Zone 2 (Parakou, Alibori, Atacora, etc.) : Part fixe de 60 000 FCFA",
                    "Taux proportionnels variables selon la localisation (12% à 25%)",
                    "Majoration de 10 000 FCFA par milliard de CA supplémentaire"
                ]
            },
            {
                infosTitle: 'Calcul de la part proportionnelle',
                infosDescription: [
                    "La part proportionnelle est calculée sur la valeur locative annuelle de chaque établissement",
                    "Taux minimum : 1/3 de la part fixe si la valeur locative est faible",
                    "La valeur locative doit être déclarée pour chaque établissement",
                    "Si aucune valeur locative n'est déclarée, seule la part fixe s'applique"
                ]
            },
            {
                infosTitle: 'Surtaxes spéciales',
                infosDescription: [
                    "Surtaxe import-export selon le montant des transactions (appliquée une seule fois)",
                    "Majoration pour les établissements à fort chiffre d'affaires global",
                    "Les réductions éventuelles s'appliquent par établissement selon leur zone"
                ]
            }
        ];
    }

    private buildImpotConfig() {
        return {
            impotTitle: PatenteConfig.TITLE,
            label: PatenteConfig.LABEL,
            description: PatenteConfig.DESCRIPTION,
            competentCenter: PatenteConfig.COMPETENT_CENTER,
            paymentSchedule: [
                {
                    date: "30 avril",
                    description: "Paiement annuel de la patente pour tous les établissements"
                }
            ]
        };
    }

    build(): GlobalEstimationInfoData {
        return {
            totalEstimation: Math.round(this.totalPatente),
            totalEstimationCurrency: 'FCFA',
            VariableEnter: this.variablesEnter,
            impotDetailCalcule: this.details,
            obligationEcheance: this.buildObligationEcheance(),
            infosSupplementaires: this.buildInfosSupplementaires(),
            impotConfig: this.buildImpotConfig()
        };
    }

    // ----- Méthodes statiques utilitaires (reprennent la logique d'origine) -----
    private static getLocationZone(location: string): 'first' | 'second' {
        const firstZone = ['cotonou', 'porto-novo', 'ouidah', 'abomey', 'other-zone1',
            'atlantique', 'collines', 'couffo', 'littoral', 'mono', 'oueme', 'plateau', 'zou'];
        return firstZone.includes(location) ? 'first' : 'second';
    }

    private static getLocationDisplayName(location: string): string {
        const locationNames: Record<string, string> = {
            'cotonou': 'Cotonou',
            'porto-novo': 'Porto-Novo',
            'ouidah': 'Ouidah',
            'abomey': 'Abomey',
            'parakou': 'Parakou',
            'other-zone1': 'Autre ville Zone 1',
            'other-zone2': 'Autre ville Zone 2',
            'alibori': 'Alibori',
            'atacora': 'Atacora',
            'borgou': 'Borgou',
            'donga': 'Donga',
            'atlantique': 'Atlantique',
            'collines': 'Collines',
            'couffo': 'Couffo',
            'littoral': 'Littoral',
            'mono': 'Mono',
            'oueme': 'Ouémé',
            'plateau': 'Plateau',
            'zou': 'Zou'
        };
        return locationNames[location] || location;
    }

    private static calculerTauxProportionnel(location: string): number {
        const rates: Record<string, number> = {
            cotonou: 17, 'porto-novo': 17, ouidah: 18, abomey: 14, parakou: 25,
            alibori: 15, borgou: 15, atacora: 15, donga: 15,
            mono: 12, couffo: 12,
            atlantique: 13.5, collines: 13.5, oueme: 13.5, plateau: 13.5, zou: 13.5,
            'other-zone1': 13.5, 'other-zone2': 13.5, littoral: 13.5,
        };
        return rates[location] || 13.5;
    }

    private static calculerPartProportionnelle(rentalValue: number, proportionalRate: number, fixedRate: number): number {
        if (rentalValue <= 0) return 0;
        const rate = rentalValue * (proportionalRate / 100);
        const minProportional = fixedRate / 3;
        return Math.max(rate, minProportional);
    }

    private static adjustForChiffreAffaire(baseRate: number, chiffreAffaire: number): number {
        if (chiffreAffaire > 1_000_000_000) {
            const additionalBillions = Math.floor(chiffreAffaire / 1_000_000_000);
            return baseRate + additionalBillions * PatenteConfig.ADD_PER_BILLION_CA;
        }
        return baseRate;
    }

    private static adjustForImportExport(rate: number, input: PatenteInput): number {
        if (!input.isImporter || !input.importExportAmount) return rate;
        const amount = input.importExportAmount;
        if (amount <= 80_000_000) return 150_000;
        if (amount <= 200_000_000) return 337_500;
        if (amount <= 500_000_000) return 525_000;
        if (amount <= 1_000_000_000) return 675_000;
        if (amount <= 2_000_000_000) return 900_000;
        if (amount <= 10_000_000_000) return 1_125_000;
        return 1_125_000 + Math.floor((amount - 10_000_000_000) / 1_000_000_000) * 10_000;
    }

    private static calculerSurtaxeImportExport(amount: number): number {
        if (amount <= 80_000_000) return 150_000;
        if (amount <= 200_000_000) return 337_500;
        if (amount <= 500_000_000) return 525_000;
        if (amount <= 1_000_000_000) return 675_000;
        if (amount <= 2_000_000_000) return 900_000;
        if (amount <= 10_000_000_000) return 1_125_000;
        return 1_125_000 + Math.floor((amount - 10_000_000_000) / 1_000_000_000) * 10_000;
    }
}

// Classe principale publique
class MoteurPatente {
    public static calculerPatente(input: PatenteInput): PatenteCalculationResult {
        try {
            // Validations
            if (input.chiffreAffaire <= 0) {
                return PatenteErrorHandler.genererErreurValidation("Le chiffre d'affaires doit être positif");
            }
            if (!input.etablissements || input.etablissements.length === 0) {
                return PatenteErrorHandler.genererErreurValidation('Aucun établissement défini');
            }
            for (const etablissement of input.etablissements) {
                if (etablissement.rentalValue < 0) {
                    return PatenteErrorHandler.genererErreurValidation(`La valeur locative de l'établissement "${etablissement.nom || etablissement.location}" ne peut pas être négative`);
                }
            }

            const annee = DateUtils.extraireAnnee(input.periodeFiscale);
            if (annee >= 2026) {
                return PatenteErrorHandler.genererErreurAnnee(input, annee);
            }

            return new PatenteResponseBuilder(input, {}).build();
        } catch (error) {
            return PatenteErrorHandler.genererErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de la patente');
        }
    }

    public static calculerPatenteWithoutImportExportAdjustment(input: PatenteInput): PatenteCalculationResult {
        return this.calculerPatenteAvecOptions(input, { includeImportExportAdjustment: false });
    }

    public static calculerPatenteAvecOptions(input: PatenteInput, options: PatenteCalculationOptions): PatenteCalculationResult {
        try {
            // Validations
            if (input.chiffreAffaire <= 0) {
                return PatenteErrorHandler.genererErreurValidation("Le chiffre d'affaires doit être positif");
            }
            if (!input.etablissements || input.etablissements.length === 0) {
                return PatenteErrorHandler.genererErreurValidation('Aucun établissement défini');
            }
            for (const etablissement of input.etablissements) {
                if (etablissement.rentalValue < 0) {
                    return PatenteErrorHandler.genererErreurValidation(`La valeur locative de l'établissement "${etablissement.nom || etablissement.location}" ne peut pas être négative`);
                }
            }

            const annee = DateUtils.extraireAnnee(input.periodeFiscale);
            if (annee >= 2026) {
                return PatenteErrorHandler.genererErreurAnnee(input, annee);
            }

            return new PatenteResponseBuilder(input, options).build();
        } catch (error) {
            return PatenteErrorHandler.genererErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de la patente');
        }
    }
}

export default MoteurPatente;
