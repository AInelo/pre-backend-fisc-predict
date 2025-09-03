import { BackendEstimationFailureResponse } from "@/types/frontend.errors.estomation.type";
import { GlobalEstimationInfoData } from "@/types/frontend.result.return.type";

interface AIBInput {
    aibCollected: number;
    aibGranted: number;
    periodeFiscale: string;
}

// Interface pour les options de calcul
interface AIBCalculationOptions {
    includeCCI?: boolean;
    includeRedevanceSRTB?: boolean;
    customRedevance?: number;
    customCCIRate?: number;
}

export type AIBCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

// Configuration de l'impôt AIB
class AIBConfig {
    static readonly REDEVANCE_RTB = 4_000;
    static readonly TITLE = 'Accompte sur l\'Impôt sur les Bénéfices';
    static readonly LABEL = 'AIB';
    static readonly DESCRIPTION = `L'AIB est un acompte mensuel sur l'impôt sur les bénéfices, calculé sur le chiffre d'affaires ou le bénéfice.
            Il est imputable sur l'impôt final de l'année et doit être déclaré et payé avant le 10 du mois suivant.`;
    static readonly COMPETENT_CENTER = "Centre des Impôts des Petites Entreprises (CIPE) de votre ressort territorial.";
}

// Classe pour la gestion des erreurs
class AIBErrorHandler {
    static genererErreurAnnee(input: AIBInput, annee: number): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'CONSTANTES_NON_DISPONIBLES',
                    message: `Les taux AIB pour l'année ${annee} ne sont pas encore disponibles.`,
                    details: `Le calcul de l'Accompte sur l'Impôt sur les Bénéfices pour l'année ${annee} ne peut pas être effectué car les taux officiels n'ont pas encore été publiés par l'administration fiscale béninoise.`,
                    severity: 'info'
                }
            ],
            context: {
                typeContribuable: 'Entreprise',
                regime: 'AIB',
                chiffreAffaire: input.aibCollected,
                missingData: ['taux_aib', 'seuils_imposition', 'barèmes_mensuels']
            },
            timestamp: new Date().toISOString(),
            requestId: `aib_calc_${Date.now()}`
        };
    }

    static genererErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'VALIDATION_ERROR',
                    message: message,
                    details: `Erreur de validation des données d'entrée pour le calcul de l'AIB.`,
                    severity: 'error'
                }
            ],
            context: {
                typeContribuable: 'Entreprise',
                regime: 'AIB',
                missingData: ['donnees_entree', 'aib_collecte', 'aib_accordé']
            },
            timestamp: new Date().toISOString(),
            requestId: `aib_calc_${Date.now()}`
        };
    }
}

// Builder pour construire la réponse de manière modulaire
class AIBResponseBuilder {
    private input: AIBInput;
    private options: AIBCalculationOptions;
    private aibNet: number;
    private aibNetArrondi: number;
    private redevanceSRTB: number;
    private contributionCCI: number;
    private totalAIB: number;

    constructor(input: AIBInput, options: AIBCalculationOptions = {}) {
        this.input = input;
        this.options = {
            includeCCI: true,
            includeRedevanceSRTB: true,
            ...options
        };
        
        this.aibNet = input.aibCollected - input.aibGranted;
        this.aibNetArrondi = Math.round(this.aibNet);
        this.redevanceSRTB = this.options.includeRedevanceSRTB ? 
            (this.options.customRedevance ?? AIBConfig.REDEVANCE_RTB) : 0;
        this.contributionCCI = this.options.includeCCI ? 
            (this.options.customCCIRate ?? 0) : 0;
        this.totalAIB = this.aibNetArrondi + this.redevanceSRTB + this.contributionCCI;
    }

    private buildVariablesEnter() {
        const variables = [
            {
                label: "AIB Collecté",
                description: "Montant total de l'Accompte sur l'Impôt sur les Bénéfices collecté",
                value: this.input.aibCollected,
                currency: 'FCFA'
            },
            {
                label: "AIB Accordé",
                description: "Montant total de l'Accompte sur l'Impôt sur les Bénéfices accordé",
                value: this.input.aibGranted,
                currency: 'FCFA'
            }
        ];

        if (this.options.includeRedevanceSRTB && this.redevanceSRTB > 0) {
            variables.push({
                label: "Redevance SRTB",
                description: "Redevance audiovisuelle nationale",
                value: this.redevanceSRTB,
                currency: 'FCFA'
            });
        }

        if (this.options.includeCCI && this.contributionCCI > 0) {
            variables.push({
                label: "Contribution CCI",
                description: "Contribution à la Chambre de Commerce et d'Industrie",
                value: this.contributionCCI,
                currency: 'FCFA'
            });
        }

        return variables;
    }

    private buildImpotDetailCalcule() {
        const details = [
            {
                impotTitle: 'AIB Net (Accompte sur l\'Impôt sur les Bénéfices)',
                impotDescription: `Calculé comme la différence entre l'AIB collecté et l'AIB accordé`,
                impotValue: this.aibNetArrondi,
                impotValueCurrency: 'FCFA',
                impotTaux: this.aibNet > 0 ? 'Débit' : 'Crédit',
                importCalculeDescription: `AIB Net = ${this.input.aibCollected.toLocaleString('fr-FR')} FCFA (collecté) - ${this.input.aibGranted.toLocaleString('fr-FR')} FCFA (accordé) = ${this.aibNetArrondi.toLocaleString('fr-FR')} FCFA`
            }
        ];

        if (this.options.includeRedevanceSRTB && this.redevanceSRTB > 0) {
            details.push({
                impotTitle: 'Redevance SRTB',
                impotDescription: `Montant ${this.options.customRedevance ? 'personnalisé' : 'fixe'} de ${this.redevanceSRTB.toLocaleString('fr-FR')} FCFA ajouté à l'AIB pour la radiodiffusion et télévision nationale.`,
                impotValue: this.redevanceSRTB,
                impotValueCurrency: 'FCFA',
                impotTaux: `${this.redevanceSRTB.toLocaleString('fr-FR')} FCFA`,
                importCalculeDescription: `${this.options.customRedevance ? 'Redevance personnalisée' : 'Conformément à la loi, une redevance audiovisuelle'} de ${this.redevanceSRTB.toLocaleString('fr-FR')} FCFA est ajoutée.`
            });
        }

        if (this.options.includeCCI && this.contributionCCI > 0) {
            details.push({
                impotTitle: 'Contribution CCI Bénin',
                impotDescription: `Contribution à la Chambre de Commerce et d'Industrie du Bénin ${this.options.customCCIRate ? 'personnalisée' : 'selon le barème en vigueur'}.`,
                impotValue: this.contributionCCI,
                impotValueCurrency: 'FCFA',
                impotTaux: `${this.contributionCCI.toLocaleString('fr-FR')} FCFA ${this.options.customCCIRate ? ': montant personnalisé' : ': barème CCI'}`,
                importCalculeDescription: `Montant ${this.options.customCCIRate ? 'personnalisé' : 'calculé selon le barème CCI'} pour l'entreprise.`
            });
        }

        return details;
    }

    private buildObligationEcheance() {
        return [
            {
                impotTitle: 'AIB - Déclaration mensuelle',
                echeancePaiement: {
                    echeancePeriodeLimite: '10 du mois suivant',
                    echeanceDescription: "Déclaration et paiement de l'AIB mensuel."
                },
                obligationDescription: "L'AIB doit être déclaré et payé avant le 10 du mois suivant la période d'activité."
            },
            {
                impotTitle: 'AIB - Déclaration annuelle',
                echeancePaiement: {
                    echeancePeriodeLimite: '30 avril',
                    echeanceDescription: "Déclaration annuelle avec le bilan OHADA."
                },
                obligationDescription: "Déclaration annuelle obligatoire avec le bilan OHADA avant le 30 avril."
            },
            {
                impotTitle: 'AIB - Régularisation',
                echeancePaiement: {
                    echeancePeriodeLimite: '30 avril',
                    echeanceDescription: "Régularisation de l'AIB avec l'impôt final."
                },
                obligationDescription: "Régularisation de l'AIB avec l'impôt sur les bénéfices final au 30 avril."
            }
        ];
    }

    private buildInfosSupplementaires() {
        const infos = [
            {
                infosTitle: 'Principe de l\'AIB',
                infosDescription: [
                    "L'AIB est un acompte sur l'impôt sur les bénéfices (IBA/IS) à payer mensuellement.",
                    "Il est calculé sur le chiffre d'affaires ou le bénéfice de chaque mois.",
                    "L'AIB collecté représente ce que l'entreprise doit payer.",
                    "L'AIB accordé représente ce qui a été retenu à la source ou payé d'avance."
                ]
            },
            {
                infosTitle: 'Taux d\'AIB',
                infosDescription: [
                    "Taux général : 1% du chiffre d'affaires",
                    "Taux réduit : 0.5% pour certaines activités (agriculture, pêche)",
                    "Taux spécial : 2% pour les activités d'import-export",
                    "L'AIB est imputable sur l'impôt final de l'année."
                ]
            }
        ];

        if (this.options.includeRedevanceSRTB && this.redevanceSRTB > 0) {
            infos.push({
                infosTitle: 'Redevance SRTB',
                infosDescription: [
                    `La redevance SRTB de ${this.redevanceSRTB.toLocaleString('fr-FR')} FCFA est ${this.options.customRedevance ? 'personnalisée' : 'fixe et obligatoire'}.`,
                    "Elle finance la radiodiffusion et télévision nationale béninoise."
                ]
            });
        }

        if (this.options.includeCCI && this.contributionCCI > 0) {
            infos.push({
                infosTitle: 'Contribution CCI Bénin',
                infosDescription: [
                    `La contribution CCI de ${this.contributionCCI.toLocaleString('fr-FR')} FCFA est ${this.options.customCCIRate ? 'personnalisée' : 'calculée selon le barème officiel'}.`,
                    "Elle finance les services de la Chambre de Commerce et d'Industrie du Bénin."
                ]
            });
        }

        if (!this.options.includeCCI && !this.options.includeRedevanceSRTB) {
            infos.push({
                infosTitle: 'Calcul simplifié',
                infosDescription: [
                    'Ce calcul n\'inclut ni la contribution CCI Bénin ni la redevance SRTB.',
                    'Le montant total correspond uniquement à l\'AIB net de base.'
                ]
            });
        }

        infos.push({
            infosTitle: 'Obligations de conservation',
            infosDescription: [
                "Conservez tous les justificatifs de paiement d'AIB.",
                "Les justificatifs doivent être conservés pendant 5 ans.",
                "Tenue d'un registre des acomptes versés et des retenues subies."
            ]
        });

        return infos;
    }

    private buildImpotConfig() {
        return {
            impotTitle: AIBConfig.TITLE,
            label: AIBConfig.LABEL,
            description: AIBConfig.DESCRIPTION,
            competentCenter: AIBConfig.COMPETENT_CENTER,
            paymentSchedule: [
                {
                    date: "10 du mois suivant",
                    description: "Déclaration et paiement mensuel de l'AIB"
                },
                {
                    date: "30 avril",
                    description: "Déclaration annuelle et régularisation"
                }
            ]
        };
    }

    build(): GlobalEstimationInfoData {
        const suffixe = this.getSuffixeCalcul();
        
        return {
            totalEstimation: this.totalAIB,
            totalEstimationCurrency: 'FCFA',
            contribuableRegime: `Régime AIB${suffixe}`,
            VariableEnter: this.buildVariablesEnter(),
            impotDetailCalcule: this.buildImpotDetailCalcule(),
            obligationEcheance: this.buildObligationEcheance(),
            infosSupplementaires: this.buildInfosSupplementaires(),
            impotConfig: this.buildImpotConfig()
        };
    }

    private getSuffixeCalcul(): string {
        if (!this.options.includeCCI && !this.options.includeRedevanceSRTB) {
            return ' (Base uniquement)';
        } else if (!this.options.includeCCI) {
            return ' (Sans CCI)';
        } else if (!this.options.includeRedevanceSRTB) {
            return ' (Sans SRTB)';
        } else if (this.options.customCCIRate || this.options.customRedevance) {
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
class MoteurAIB {
    // Méthode principale avec toutes les composantes
    public static calculerAIB(input: AIBInput): AIBCalculationResult {
        return this.calculerAIBAvecOptions(input, {});
    }

    // Méthode sans contribution CCI Bénin
    public static calculerAIBWithoutCCI(input: AIBInput): AIBCalculationResult {
        return this.calculerAIBAvecOptions(input, { includeCCI: false });
    }

    // Méthode sans redevance SRTB
    public static calculerAIBWithoutRedevanceSRTB(input: AIBInput): AIBCalculationResult {
        return this.calculerAIBAvecOptions(input, { includeRedevanceSRTB: false });
    }

    // Méthode sans CCI ni redevance SRTB
    public static calculerAIBWithoutCCI_RedevanceSRTB(input: AIBInput): AIBCalculationResult {
        return this.calculerAIBAvecOptions(input, { 
            includeCCI: false, 
            includeRedevanceSRTB: false 
        });
    }

    // Méthode avec montants personnalisés
    public static calculerAIBPersonnalise(
        input: AIBInput, 
        customCCI?: number, 
        customRedevance?: number
    ): AIBCalculationResult {
        return this.calculerAIBAvecOptions(input, {
            customCCIRate: customCCI,
            customRedevance: customRedevance,
            includeCCI: customCCI !== undefined,
            includeRedevanceSRTB: customRedevance !== undefined
        });
    }

    // Méthode générique avec options
    public static calculerAIBAvecOptions(
        input: AIBInput, 
        options: AIBCalculationOptions
    ): AIBCalculationResult {
        try {
            // Validation des entrées
            if (input.aibCollected < 0 || input.aibGranted < 0) {
                return AIBErrorHandler.genererErreurValidation('Les montants AIB collecté et accordé doivent être positifs');
            }

            // Extraire l'année de la période fiscale
            const annee = DateUtils.extraireAnnee(input.periodeFiscale);
            
            // Vérifier si l'année est 2026 ou ultérieure
            if (annee >= 2026) {
                return AIBErrorHandler.genererErreurAnnee(input, annee);
            }

            // Construction de la réponse avec les options spécifiées
            return new AIBResponseBuilder(input, options).build();
        } catch (error) {
            return AIBErrorHandler.genererErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de l\'AIB');
        }
    }
}

export default MoteurAIB;
