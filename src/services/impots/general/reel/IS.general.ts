import { BackendEstimationFailureResponse } from "@/types/frontend.errors.estomation.type";
import { GlobalEstimationInfoData } from "@/types/frontend.result.return.type";

interface ISInput {
    revenue: number;
    charges: number;
    secteur: 'education' | 'industry' | 'real-estate' | 'construction' | 'gas-station' | 'general';
    dureeCreation?: number;
    pourcentageActionsNonCotees?: number;
    estExoneree?: boolean;
    metering?: number;
    periodeFiscale: string;
}

export type ISCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

class MoteurIS {
    private static readonly REDEVANCE_ORTB = 4_000;

    public static calculerIS(input: ISInput): ISCalculationResult {
        try {
            // Validation des entrées
            if (input.revenue <= 0) {
                return this.genererReponseErreurValidation('Le chiffre d\'affaires doit être positif');
            }

            if (input.charges < 0) {
                return this.genererReponseErreurValidation('Les charges ne peuvent pas être négatives');
            }

            // Extraire l'année de la période fiscale
            const annee = this.extraireAnnee(input.periodeFiscale);
            
            // Vérifier si l'année est 2026 ou ultérieure
            if (annee >= 2026) {
                return this.genererReponseErreur(input, annee);
            }

            // Calculer le bénéfice imposable
            const beneficeImposable = Math.max(0, input.revenue - input.charges);
            
            // Déterminer le taux d'imposition
            const tauxPrincipal = this.calculerTauxPrincipal(input.secteur);
            const tauxMinimum = this.calculerTauxMinimum(input.secteur);
            
            // Vérifier l'exonération pour capital-risque
            const estExonereeCapitalRisque = this.verifierExonerationCapitalRisque(
                input.dureeCreation, 
                input.pourcentageActionsNonCotees
            );

            // Calculer l'impôt brut
            let impotBrut = beneficeImposable * tauxPrincipal;
            
            // Appliquer l'impôt minimum si nécessaire
            const impotMinimum = Math.max(
                input.revenue * tauxMinimum,
                250000 // Impôt minimum absolu pour les entreprises
            );
            
            if (impotBrut < impotMinimum) {
                impotBrut = impotMinimum;
            }

            // Calculer la taxe station-service si applicable
            let taxeStation = 0;
            if (input.secteur === 'gas-station' && input.metering) {
                taxeStation = input.metering * 0.6;
            }

            // Calculer l'impôt net
            const impotNet = Math.max(0, impotBrut + taxeStation);
            const impotNetArrondi = Math.round(impotNet);

            // Préparer les variables d'entrée
            const variablesEnter = [
                {
                    label: "Chiffre d'affaires",
                    description: "Revenus totaux de l'entreprise",
                    value: input.revenue,
                    currency: 'FCFA'
                },
                {
                    label: "Charges déductibles",
                    description: "Charges et dépenses déductibles du bénéfice imposable",
                    value: input.charges,
                    currency: 'FCFA'
                },
                {
                    label: "Bénéfice imposable",
                    description: "Différence entre revenus et charges",
                    value: beneficeImposable,
                    currency: 'FCFA'
                }
            ];

            // Préparer les détails de calcul
            const impotDetailCalcule = [
                {
                    impotTitle: 'Impôt sur les Sociétés (IS)',
                    impotDescription: `Calculé selon le taux de ${(tauxPrincipal * 100).toFixed(1)}% applicable au secteur ${input.secteur}`,
                    impotValue: impotNetArrondi,
                    impotValueCurrency: 'FCFA',
                    impotTaux: `${(tauxPrincipal * 100).toFixed(1)}%`,
                    importCalculeDescription: `IS = ${beneficeImposable.toLocaleString('fr-FR')} FCFA × ${(tauxPrincipal * 100).toFixed(1)}% = ${impotBrut.toLocaleString('fr-FR')} FCFA${taxeStation > 0 ? ` + Taxe station ${taxeStation.toLocaleString('fr-FR')} FCFA` : ''} = ${impotNetArrondi.toLocaleString('fr-FR')} FCFA`
                }
            ];

            // Ajouter la taxe station si applicable
            if (taxeStation > 0) {
                impotDetailCalcule.push({
                    impotTitle: 'Taxe station-service',
                    impotDescription: 'Taxe calculée sur la base du comptage des litres vendus',
                    impotValue: Math.round(taxeStation),
                    impotValueCurrency: 'FCFA',
                    impotTaux: '0.6 FCFA par litre',
                    importCalculeDescription: `Taxe station = ${input.metering} litres × 0.6 FCFA = ${Math.round(taxeStation).toLocaleString('fr-FR')} FCFA`
                });
            }

            return {
                totalEstimation: impotNetArrondi,
                totalEstimationCurrency: 'FCFA',
                contribuableRegime: 'IS (Impôt sur les Sociétés)',

                VariableEnter: variablesEnter,
                impotDetailCalcule: impotDetailCalcule,

                obligationEcheance: [
                    {
                        impotTitle: 'IS - Premier acompte',
                        echeancePaiement: {
                            echeancePeriodeLimite: '10 mars',
                            echeanceDescription: "25% du montant de l'IS de l'année précédente."
                        },
                        obligationDescription: "Premier acompte à verser au plus tard le 10 mars."
                    },
                    {
                        impotTitle: 'IS - Deuxième acompte',
                        echeancePaiement: {
                            echeancePeriodeLimite: '10 juin',
                            echeanceDescription: "25% du montant de l'IS de l'année précédente."
                        },
                        obligationDescription: "Deuxième acompte à verser au plus tard le 10 juin."
                    },
                    {
                        impotTitle: 'IS - Troisième acompte',
                        echeancePaiement: {
                            echeancePeriodeLimite: '10 septembre',
                            echeanceDescription: "25% du montant de l'IS de l'année précédente."
                        },
                        obligationDescription: "Troisième acompte à verser au plus tard le 10 septembre."
                    },
                    {
                        impotTitle: 'IS - Quatrième acompte',
                        echeancePaiement: {
                            echeancePeriodeLimite: '10 décembre',
                            echeanceDescription: "25% du montant de l'IS de l'année précédente."
                        },
                        obligationDescription: "Quatrième acompte à verser au plus tard le 10 décembre."
                    },
                    {
                        impotTitle: 'IS - Solde et déclaration annuelle',
                        echeancePaiement: {
                            echeancePeriodeLimite: '30 avril',
                            echeanceDescription: "Solde de l'IS et déclaration annuelle avec bilan OHADA."
                        },
                        obligationDescription: "Le solde de l'IS doit être versé et la déclaration annuelle déposée avant le 30 avril."
                    }
                ],

                infosSupplementaires: [
                    {
                        infosTitle: 'Taux d\'imposition par secteur',
                        infosDescription: [
                            `Secteur Éducation : ${(this.calculerTauxPrincipal('education') * 100).toFixed(1)}%`,
                            `Secteur Industrie : ${(this.calculerTauxPrincipal('industry') * 100).toFixed(1)}%`,
                            `Secteur Immobilier : ${(this.calculerTauxPrincipal('real-estate') * 100).toFixed(1)}%`,
                            `Secteur Construction : ${(this.calculerTauxPrincipal('construction') * 100).toFixed(1)}%`,
                            `Secteur Station-service : ${(this.calculerTauxPrincipal('gas-station') * 100).toFixed(1)}%`,
                            `Secteur Général : ${(this.calculerTauxPrincipal('general') * 100).toFixed(1)}%`
                        ]
                    },
                    {
                        infosTitle: 'Impôt minimum',
                        infosDescription: [
                            "L'impôt minimum est calculé sur le chiffre d'affaires selon le secteur d'activité.",
                            "Il s'applique si l'impôt calculé sur le bénéfice est inférieur à ce minimum.",
                            "L'impôt minimum absolu est de 250 000 FCFA pour toutes les entreprises."
                        ]
                    },
                    {
                        infosTitle: 'Exonérations et réductions',
                        infosDescription: [
                            "Exonération possible pour les entreprises de capital-risque selon certaines conditions.",
                            "Réduction possible pour les entreprises nouvelles dans certains secteurs.",
                            "Possibilité de report des déficits sur les exercices suivants."
                        ]
                    }
                ],

                impotConfig: {
                    impotTitle: 'Impôt sur les Sociétés (IS)',
                    label: 'IS',
                    description: `L'Impôt sur les Sociétés est un impôt direct calculé sur le bénéfice imposable des entreprises.
                            Le taux varie selon le secteur d'activité et s'applique après déduction des charges.
                            Des acomptes trimestriels sont obligatoires, avec un solde au 30 avril.`,
                    competentCenter: "Centre des Impôts des Petites Entreprises (CIPE) de votre ressort territorial.",
                    paymentSchedule: [
                        {
                            date: "10 mars",
                            description: "Premier acompte (25% de l'IS de l'année précédente)"
                        },
                        {
                            date: "10 juin",
                            description: "Deuxième acompte (25% de l'IS de l'année précédente)"
                        },
                        {
                            date: "10 septembre",
                            description: "Troisième acompte (25% de l'IS de l'année précédente)"
                        },
                        {
                            date: "10 décembre",
                            description: "Quatrième acompte (25% de l'IS de l'année précédente)"
                        },
                        {
                            date: "30 avril",
                            description: "Solde et déclaration annuelle"
                        }
                    ]
                }
            };
        } catch (error) {
            return this.genererReponseErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de l\'IS');
        }
    }

    private static calculerTauxPrincipal(secteur: string): number {
        if (secteur === 'education') return 0.25;
        if (secteur === 'industry') return 0.25;
        return 0.30; // Taux général pour les autres secteurs
    }

    private static calculerTauxMinimum(secteur: string): number {
        if (secteur === 'real-estate') return 0.10;
        if (secteur === 'construction') return 0.03;
        return 0.01; // Taux minimum pour les autres secteurs
    }

    private static verifierExonerationCapitalRisque(dureeCreation?: number, pourcentageActionsNonCotees?: number): boolean {
        if (!dureeCreation || !pourcentageActionsNonCotees) return false;
        return dureeCreation <= 5 && pourcentageActionsNonCotees >= 70;
    }

    private static getSecteurValue(secteur: string): number {
        const secteurValues: Record<string, number> = {
            'education': 1,
            'industry': 2,
            'real-estate': 3,
            'construction': 4,
            'gas-station': 5,
            'general': 6
        };
        return secteurValues[secteur] || 6;
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

    private static genererReponseErreur(input: ISInput, annee: number): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'CONSTANTES_NON_DISPONIBLES',
                    message: `Les taux IS pour l'année ${annee} ne sont pas encore disponibles.`,
                    details: `Le calcul de l'Impôt sur les Sociétés pour l'année ${annee} ne peut pas être effectué car les taux officiels n'ont pas encore été publiés par l'administration fiscale béninoise.`,
                    severity: 'info'
                }
            ],
            context: {
                typeContribuable: 'Entreprise',
                regime: 'IS',
                chiffreAffaires: input.revenue,
                missingData: ['taux_is', 'seuils_imposition', 'barèmes_sectoriels']
            },
            timestamp: new Date().toISOString(),
            requestId: `is_calc_${Date.now()}`
        };
    }

    private static genererReponseErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'VALIDATION_ERROR',
                    message: message,
                    details: `Erreur de validation des données d'entrée pour le calcul de l'IS.`,
                    severity: 'error'
                }
            ],
            context: {
                typeContribuable: 'Entreprise',
                regime: 'IS',
                missingData: ['donnees_entree', 'chiffre_affaires', 'charges']
            },
            timestamp: new Date().toISOString(),
            requestId: `is_calc_${Date.now()}`
        };
    }
}

export default MoteurIS;
