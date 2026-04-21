import { GlobalEstimationInfoData } from '../../../../types/frontend.result.return.type';
import {BackendEstimationError, BackendEstimationFailureResponse, BackendEstimationContext } from '../../../../types/frontend.errors.estomation.type';

// Type union pour le retour de la fonction
export type IRFCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

// Interface pour les données IRF
interface IRFInput {
  revenuLocatif: number;
  isAlreadyTaxed: boolean;
  periodeFiscale: string;
}

// Interface pour les options de calcul
interface IRFCalculationOptions {
    includeRedevanceSRTB?: boolean;
    customRedevanceSRTB?: number;
    customTauxIRF?: number;
}

// Configuration de l'impôt IRF
class IRFConfig {
    static readonly REDEVANCE_SRTB = 4_000;
    static readonly TAUX_STANDARD = 0.12;        // 12% pour revenus non taxés
    static readonly TAUX_REDUIT = 0.10;          // 10% pour revenus déjà taxés
    
    static readonly TITLE = 'Impôt sur les Revenus Fonciers';
    static readonly LABEL = 'IRF';
    static readonly DESCRIPTION = `L'IRF est calculé sur les revenus locatifs avec un taux de 10% si le revenu est déjà soumis à IBA/IS, sinon 12%.
            Une redevance SRTB de 4 000 FCFA s'ajoute obligatoirement.
            La déclaration et le paiement doivent être effectués avant le 30 avril.`;
    static readonly COMPETENT_CENTER = "Centre des Impôts des Petites Entreprises (CIPE) de votre ressort territorial.";
}

// Classe pour la gestion des erreurs
class IRFErrorHandler {
    static genererErreurAnnee(input: IRFInput, annee: number): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'CONSTANTES_NON_DISPONIBLES',
                    message: `Les taux IRF pour l'année ${annee} ne sont pas encore disponibles.`,
                    details: `Le calcul de l'Impôt sur les Revenus Fonciers pour l'année ${annee} ne peut pas être effectué car les taux officiels n'ont pas encore été publiés par l'administration fiscale béninoise.`,
                    severity: 'info'
                }
            ],
            context: {
                typeContribuable: 'Propriétaire foncier',
                regime: 'IRF',
                chiffreAffaire: input.revenuLocatif,
                missingData: ['taux_irf', 'redevance_ortb', 'seuils_imposition']
            },
            timestamp: new Date().toISOString(),
            requestId: `irf_calc_${Date.now()}`
        };
    }

    static genererErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'VALIDATION_ERROR',
                    message: message,
                    details: `Erreur de validation des données d'entrée pour le calcul de l'IRF.`,
                    severity: 'error'
                }
            ],
            context: {
                typeContribuable: 'Propriétaire foncier',
                regime: 'IRF',
                missingData: ['donnees_entree']
            },
            timestamp: new Date().toISOString(),
            requestId: `irf_calc_${Date.now()}`
        };
    }
}

// Builder pour construire la réponse de manière modulaire
class IRFResponseBuilder {
    private input: IRFInput;
    private options: IRFCalculationOptions;
    private tauxIRF: number = 0;
    private tauxPourcentage: string = '';
    private irfMontant: number = 0;
    private irfArrondi: number = 0;
    private redevanceSRTB: number = 0;
    private totalTax: number = 0;

    constructor(input: IRFInput, options: IRFCalculationOptions = {}) {
        this.input = input;
        this.options = {
            includeRedevanceSRTB: true,
            ...options
        };
        
        this.initializeCalculations();
    }

    private initializeCalculations() {
        // Déterminer le taux selon si le revenu est déjà taxé
        if (this.options.customTauxIRF !== undefined) {
            this.tauxIRF = this.options.customTauxIRF;
            this.tauxPourcentage = `${(this.tauxIRF * 100).toFixed(1)}%`;
        } else {
            this.tauxIRF = this.input.isAlreadyTaxed ? IRFConfig.TAUX_REDUIT : IRFConfig.TAUX_STANDARD;
            this.tauxPourcentage = this.input.isAlreadyTaxed ? '10%' : '12%';
        }

        // Calculer l'IRF
        this.irfMontant = this.input.revenuLocatif * this.tauxIRF;
        this.irfArrondi = Math.round(this.irfMontant);

        // Calculer le total avec la redevance SRTB si applicable
        this.redevanceSRTB = this.options.includeRedevanceSRTB ? 
            (this.options.customRedevanceSRTB ?? IRFConfig.REDEVANCE_SRTB) : 0;
        
        this.totalTax = this.irfArrondi + this.redevanceSRTB;
    }

    private buildVariablesEnter() {
        const variables = [
            {
                label: "Revenu locatif annuel",
                description: "Montant total des revenus locatifs perçus durant l'année fiscale.",
                value: this.input.revenuLocatif,
                currency: 'FCFA',
            }
        ];

        if (this.options.customTauxIRF === undefined) {
            variables.push({
                label: "Revenu déjà taxé",
                description: "Indique si le revenu est déjà soumis à IBA/IS (taux réduit de 10%).",
                value: this.input.isAlreadyTaxed ? 1 : 0,
                currency: '',
            });
        } else {
            variables.push({
                label: "Taux IRF personnalisé",
                description: "Taux personnalisé appliqué au revenu locatif.",
                value: this.tauxIRF,
                currency: '',
            });
        }

        if (this.options.includeRedevanceSRTB && this.redevanceSRTB > 0) {
            variables.push({
                label: "Redevance SRTB",
                description: "Redevance audiovisuelle pour l'Office de Radiodiffusion et Télévision du Bénin",
                value: this.redevanceSRTB,
                currency: 'FCFA'
            });
        }

        return variables;
    }

    private buildImpotDetailCalcule() {
        const details = [
            {
                impotTitle: 'IRF (Impôt sur les Revenus Fonciers)',
                impotDescription: `Calculé sur le revenu locatif avec un taux de ${this.tauxPourcentage}`,
                impotValue: this.irfArrondi,
                impotValueCurrency: 'FCFA',
                impotTaux: this.tauxPourcentage,
                importCalculeDescription: `IRF = ${this.input.revenuLocatif.toLocaleString('fr-FR')} FCFA × ${this.tauxPourcentage} = ${this.irfArrondi.toLocaleString('fr-FR')} FCFA`
            }
        ];

        if (this.options.includeRedevanceSRTB && this.redevanceSRTB > 0) {
            details.push({
                impotTitle: 'Redevance SRTB',
                impotDescription: `Redevance audiovisuelle ${this.options.customRedevanceSRTB ? 'personnalisée' : 'obligatoire'} pour l'Office de Radiodiffusion et Télévision du Bénin.`,
                impotValue: this.redevanceSRTB,
                impotValueCurrency: 'FCFA',
                impotTaux: this.options.customRedevanceSRTB ? 'Personnalisée' : 'Forfait',
                importCalculeDescription: `Redevance SRTB ${this.options.customRedevanceSRTB ? 'personnalisée' : 'fixe'} de ${this.redevanceSRTB.toLocaleString('fr-FR')} FCFA`
            });
        }

        return details;
    }

    private buildObligationEcheance() {
        return [
            {
                impotTitle: 'IRF - Déclaration et paiement',
                echeancePaiement: {
                    echeancePeriodeLimite: '30 avril',
                    echeanceDescription: "Déclaration annuelle et paiement de l'IRF."
                },
                obligationDescription: "Déclarer vos revenus fonciers annuellement avant le 30 avril."
            },
            {
                impotTitle: 'IRF - Paiement mensuel',
                echeancePaiement: {
                    echeancePeriodeLimite: '10 du mois suivant',
                    echeanceDescription: "Paiement avant le 10 du mois suivant la perception des revenus locatifs."
                },
                obligationDescription: "L'IRF doit être déclaré et payé avant le 10 du mois suivant la perception des revenus locatifs."
            }
        ];
    }

    private buildInfosSupplementaires() {
        const infos = [
            {
                infosTitle: 'Taux d\'imposition',
                infosDescription: [
                    this.options.customTauxIRF !== undefined
                        ? `Taux personnalisé de ${this.tauxPourcentage} appliqué`
                        : (this.input.isAlreadyTaxed 
                            ? "Taux réduit de 10% appliqué (revenu déjà soumis à IBA/IS)"
                            : "Taux standard de 12% appliqué"),
                    this.options.includeRedevanceSRTB 
                        ? `Redevance SRTB de ${this.redevanceSRTB.toLocaleString('fr-FR')} FCFA appliquée`
                        : "Aucune redevance SRTB incluse dans ce calcul"
                ]
            }
        ];

        if (this.options.customTauxIRF !== undefined) {
            infos.push({
                infosTitle: 'Taux personnalisé',
                infosDescription: [
                    `Le taux de ${this.tauxPourcentage} a été personnalisé pour ce calcul.`,
                    "Ce taux peut différer des taux réglementaires standard (10% ou 12%).",
                    "Vérifiez la conformité avec la réglementation fiscale en vigueur."
                ]
            });
        }

        if (this.options.customRedevanceSRTB !== undefined) {
            infos.push({
                infosTitle: 'Redevance SRTB personnalisée',
                infosDescription: [
                    `La redevance SRTB de ${this.redevanceSRTB.toLocaleString('fr-FR')} FCFA a été personnalisée.`,
                    "Le montant standard est de 4 000 FCFA.",
                    "Vérifiez la conformité avec la réglementation en vigueur."
                ]
            });
        }

        if (!this.options.includeRedevanceSRTB) {
            infos.push({
                infosTitle: 'Calcul sans redevance SRTB',
                infosDescription: [
                    'Ce calcul n\'inclut pas la redevance SRTB.',
                    'Dans la pratique, cette redevance est généralement obligatoire.',
                    'Le montant total correspond uniquement à l\'IRF de base.'
                ]
            });
        }

        infos.push({
            infosTitle: 'Obligations de conservation',
            infosDescription: [
                "Conservez vos justificatifs de paiement ou de déclaration.",
                "Les justificatifs doivent être conservés pendant 5 ans."
            ]
        });

        infos.push({
            infosTitle: 'Centre compétent',
            infosDescription: [
                "Centre des Impôts des Petites Entreprises (CIPE) de votre ressort territorial.",
                "Pour toute information, contactez la Cellule de Services aux Contribuables (CSC) au 133."
            ]
        });

        return infos;
    }

    private buildImpotConfig() {
        return {
            impotTitle: IRFConfig.TITLE,
            label: IRFConfig.LABEL,
            description: IRFConfig.DESCRIPTION,
            competentCenter: IRFConfig.COMPETENT_CENTER,
            paymentSchedule: [
                {
                    date: "30 avril",
                    description: "Déclaration annuelle et paiement de l'IRF"
                },
                {
                    date: "10 du mois suivant",
                    description: "Paiement mensuel après perception des revenus"
                }
            ]
        };
    }

    build(): GlobalEstimationInfoData {
        const suffixe = this.getSuffixeCalcul();
        
        return {
            totalEstimation: this.totalTax,
            totalEstimationCurrency: 'FCFA',
            contribuableRegime: `Régime IRF${suffixe}`,
            VariableEnter: this.buildVariablesEnter(),
            impotDetailCalcule: this.buildImpotDetailCalcule(),
            obligationEcheance: this.buildObligationEcheance(),
            infosSupplementaires: this.buildInfosSupplementaires(),
            impotConfig: this.buildImpotConfig()
        };
    }

    private getSuffixeCalcul(): string {
        if (!this.options.includeRedevanceSRTB) {
            return ' (Sans SRTB)';
        } else if (this.options.customTauxIRF !== undefined || this.options.customRedevanceSRTB !== undefined) {
            return ' (Personnalisé)';
        }
        return '';
    }
}

// Utilitaire pour l'extraction d'année
class DateUtils {
    static extraireAnnee(periodeFiscale: string): number {
        const anneeMatch = periodeFiscale.match(/(\d{4})/);
        return anneeMatch ? parseInt(anneeMatch[1], 10) : new Date().getFullYear();
    }
}

// Classe principale avec méthodes spécialisées
class MoteurIRF {

    
    // Méthode principale avec toutes les composantes
    public static calculerIRF(input: IRFInput): IRFCalculationResult {
        return this.calculerIRFvecOptions(input, {});
    }

    // Méthode sans redevance SRTB
    public static calculerIRFWithoutRedevanceSRTB(input: IRFInput): IRFCalculationResult {
        return this.calculerIRFvecOptions(input, { includeRedevanceSRTB: false });
    }

    // Méthode avec taux personnalisé
    public static calculerIRFWithCustomTaux(input: IRFInput, customTaux: number): IRFCalculationResult {
        return this.calculerIRFvecOptions(input, { customTauxIRF: customTaux });
    }

    // Méthode avec redevance SRTB personnalisée
    public static calculerIRFWithCustomRedevanceSRTB(input: IRFInput, customRedevanceSRTB: number): IRFCalculationResult {
        return this.calculerIRFvecOptions(input, { customRedevanceSRTB: customRedevanceSRTB });
    }

    // Méthode avec montants personnalisés
    public static calculerIRFPersonnalise(
        input: IRFInput, 
        customTaux?: number, 
        customRedevanceSRTB?: number
    ): IRFCalculationResult {
        return this.calculerIRFvecOptions(input, {
            customTauxIRF: customTaux,
            customRedevanceSRTB: customRedevanceSRTB
        });
    }

    // Méthode générique avec options
    public static calculerIRFvecOptions(
        input: IRFInput, 
        options: IRFCalculationOptions
    ): IRFCalculationResult {
        try {
            // Validation des entrées
            if (!input.revenuLocatif || input.revenuLocatif <= 0) {
                return IRFErrorHandler.genererErreurValidation('Le revenu locatif doit être un montant positif');
            }

            // Validation du taux personnalisé si fourni
            if (options.customTauxIRF !== undefined && (options.customTauxIRF <= 0 || options.customTauxIRF > 1)) {
                return IRFErrorHandler.genererErreurValidation('Le taux personnalisé doit être compris entre 0 et 1 (0% à 100%)');
            }

            // Validation de la redevance personnalisée si fournie
            if (options.customRedevanceSRTB !== undefined && options.customRedevanceSRTB < 0) {
                return IRFErrorHandler.genererErreurValidation('La redevance SRTB personnalisée ne peut pas être négative');
            }

            // Extraire l'année de la période fiscale
            const annee = DateUtils.extraireAnnee(input.periodeFiscale);
            
            // Vérifier si l'année est 2026 ou ultérieure
            if (annee >= 2026) {
                return IRFErrorHandler.genererErreurAnnee(input, annee);
            }

            // Construction de la réponse avec les options spécifiées
            return new IRFResponseBuilder(input, options).build();
        } catch (error) {
            return IRFErrorHandler.genererErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de l\'IRF');
        }
    }
}

export default MoteurIRF;
