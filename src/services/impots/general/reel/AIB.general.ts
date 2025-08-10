import { BackendEstimationFailureResponse } from "@/types/frontend.errors.estomation.type";
import { GlobalEstimationInfoData } from "@/types/frontend.result.return.type";

interface AIBInput {
    aibCollected: number;
    aibGranted: number;
    periodeFiscale: string;
}

export type AIBCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

class MoteurAIB {
    public static calculerAIB(input: AIBInput): AIBCalculationResult {
        try {
            // Validation des entrées
            if (input.aibCollected < 0 || input.aibGranted < 0) {
                return this.genererReponseErreurValidation('Les montants AIB collecté et accordé doivent être positifs');
            }

            // Extraire l'année de la période fiscale
            const annee = this.extraireAnnee(input.periodeFiscale);
            
            // Vérifier si l'année est 2026 ou ultérieure
            if (annee >= 2026) {
                return this.genererReponseErreur(input, annee);
            }

            // Calculer l'AIB net
            const aibNet = input.aibCollected - input.aibGranted;
            const aibNetArrondi = Math.round(aibNet);

            // Préparer les variables d'entrée
            const variablesEnter = [
                {
                    label: "AIB Collecté",
                    description: "Montant total de l'Accompte sur l'Impôt sur les Bénéfices collecté",
                    value: input.aibCollected,
                    currency: 'FCFA'
                },
                {
                    label: "AIB Accordé",
                    description: "Montant total de l'Accompte sur l'Impôt sur les Bénéfices accordé",
                    value: input.aibGranted,
                    currency: 'FCFA'
                }
            ];

            return {
                totalEstimation: aibNetArrondi,
                totalEstimationCurrency: 'FCFA',
                contribuableRegime: 'AIB',

                VariableEnter: variablesEnter,

                impotDetailCalcule: [
                    {
                        impotTitle: 'AIB Net (Accompte sur l\'Impôt sur les Bénéfices)',
                        impotDescription: `Calculé comme la différence entre l'AIB collecté et l'AIB accordé`,
                        impotValue: aibNetArrondi,
                        impotValueCurrency: 'FCFA',
                        impotTaux: aibNet > 0 ? 'Débit' : 'Crédit',
                        importCalculeDescription: `AIB Net = ${input.aibCollected.toLocaleString('fr-FR')} FCFA (collecté) - ${input.aibGranted.toLocaleString('fr-FR')} FCFA (accordé) = ${aibNetArrondi.toLocaleString('fr-FR')} FCFA`
                    }
                ],

                obligationEcheance: [
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
                ],

                infosSupplementaires: [
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
                    },
                    {
                        infosTitle: 'Obligations de conservation',
                        infosDescription: [
                            "Conservez tous les justificatifs de paiement d'AIB.",
                            "Les justificatifs doivent être conservés pendant 5 ans.",
                            "Tenue d'un registre des acomptes versés et des retenues subies."
                        ]
                    }
                ],

                impotConfig: {
                    impotTitle: 'Accompte sur l\'Impôt sur les Bénéfices',
                    label: 'AIB',
                    description: `L'AIB est un acompte mensuel sur l'impôt sur les bénéfices, calculé sur le chiffre d'affaires ou le bénéfice.
                            Il est imputable sur l'impôt final de l'année et doit être déclaré et payé avant le 10 du mois suivant.`,
                    competentCenter: "Centre des Impôts des Petites Entreprises (CIPE) de votre ressort territorial.",
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
                }
            };
        } catch (error) {
            return this.genererReponseErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de l\'AIB');
        }
    }

    private static extraireAnnee(periodeFiscale: string): number {
        // Essayer d'extraire l'année de différents formats possibles
        const anneeMatch = periodeFiscale.match(/(\d{4})/);
        if (anneeMatch) {
            return parseInt(anneeMatch[1], 10);
        }
        
        // Si aucune année n'est trouvée, retourner l'année courante par défaut
        return new Date().getFullYear();
    }

    private static genererReponseErreur(input: AIBInput, annee: number): BackendEstimationFailureResponse {
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
                chiffreAffaires: input.aibCollected,
                missingData: ['taux_aib', 'seuils_imposition', 'barèmes_mensuels']
            },
            timestamp: new Date().toISOString(),
            requestId: `aib_calc_${Date.now()}`
        };
    }

    private static genererReponseErreurValidation(message: string): BackendEstimationFailureResponse {
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

export default MoteurAIB;
