import { BackendEstimationFailureResponse } from "@/types/frontend.errors.estomation.type";
import { GlobalEstimationInfoData } from "@/types/frontend.result.return.type";

interface IBAInput {
    chiffreAffaire: number;
    charges: number;
    secteur: 'education' | 'industry' | 'real-estate' | 'construction' | 'gas-station' | 'general';
    location?: string;
    isArtisanWithFamily?: boolean;
    periodeFiscale: string;
}

export type IBACalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

class MoteurIBA {
    public static calculerIBA(input: IBAInput): IBACalculationResult {
        try {
            // Validation des entrées
            if (input.chiffreAffaire <= 0) {
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
            const beneficeImposable = Math.max(0, input.chiffreAffaire - input.charges);
            
            // Déterminer le taux d'imposition
            const tauxPrincipal = this.calculerTauxPrincipal(input.secteur);
            const tauxMinimum = this.calculerTauxMinimum(input.secteur);
            
            // Calculer l'impôt brut
            let impotBrut = beneficeImposable * tauxPrincipal;
            
            // Appliquer l'impôt minimum si nécessaire
            const impotMinimum = Math.max(
                input.chiffreAffaire * tauxMinimum,
                500000 // Impôt minimum absolu pour les entrepreneurs individuels
            );
            
            if (impotBrut < impotMinimum) {
                impotBrut = impotMinimum;
            }

            // Appliquer la réduction pour artisans avec famille
            let impotNet = impotBrut;
            if (input.isArtisanWithFamily) {
                impotNet = impotBrut / 2;
            }

            const impotNetArrondi = Math.round(impotNet);

            // Préparer les variables d'entrée
            const variablesEnter = [
                {
                    label: "Chiffre d'affaires",
                    description: "Revenus totaux de l'activité",
                    value: input.chiffreAffaire,
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
                    impotTitle: 'Impôt sur le Bénéfice d\'Affaire (IBA)',
                    impotDescription: `Calculé selon le taux de ${(tauxPrincipal * 100).toFixed(1)}% applicable au secteur ${input.secteur}`,
                    impotValue: impotNetArrondi,
                    impotValueCurrency: 'FCFA',
                    impotTaux: `${(tauxPrincipal * 100).toFixed(1)}%`,
                    importCalculeDescription: `IBA = ${beneficeImposable.toLocaleString('fr-FR')} FCFA × ${(tauxPrincipal * 100).toFixed(1)}% = ${impotBrut.toLocaleString('fr-FR')} FCFA${input.isArtisanWithFamily ? ` ÷ 2 (réduction artisan) = ${impotNetArrondi.toLocaleString('fr-FR')} FCFA` : ''}`
                }
            ];

            // Ajouter la réduction artisan si applicable
            if (input.isArtisanWithFamily) {
                impotDetailCalcule.push({
                    impotTitle: 'Réduction artisan avec famille',
                    impotDescription: 'Réduction de 50% de l\'IBA pour artisan travaillant avec sa famille',
                    impotValue: Math.round(impotBrut / 2),
                    impotValueCurrency: 'FCFA',
                    impotTaux: '50%',
                    importCalculeDescription: `Réduction = ${impotBrut.toLocaleString('fr-FR')} FCFA × 50% = ${Math.round(impotBrut / 2).toLocaleString('fr-FR')} FCFA`
                });
            }

            return {
                totalEstimation: impotNetArrondi,
                totalEstimationCurrency: 'FCFA',
                contribuableRegime: 'IBA (Impôt sur le Bénéfice d\'Affaire)',

                VariableEnter: variablesEnter,
                impotDetailCalcule: impotDetailCalcule,

                obligationEcheance: [
                    {
                        impotTitle: 'IBA - Premier acompte',
                        echeancePaiement: {
                            echeancePeriodeLimite: '10 mars',
                            echeanceDescription: "25% du montant de l'IBA de l'année précédente."
                        },
                        obligationDescription: "Premier acompte à verser au plus tard le 10 mars."
                    },
                    {
                        impotTitle: 'IBA - Deuxième acompte',
                        echeancePaiement: {
                            echeancePeriodeLimite: '10 juin',
                            echeanceDescription: "25% du montant de l'IBA de l'année précédente."
                        },
                        obligationDescription: "Deuxième acompte à verser au plus tard le 10 juin."
                    },
                    {
                        impotTitle: 'IBA - Troisième acompte',
                        echeancePaiement: {
                            echeancePeriodeLimite: '10 septembre',
                            echeanceDescription: "25% du montant de l'IBA de l'année précédente."
                        },
                        obligationDescription: "Troisième acompte à verser au plus tard le 10 septembre."
                    },
                    {
                        impotTitle: 'IBA - Quatrième acompte',
                        echeancePaiement: {
                            echeancePeriodeLimite: '10 décembre',
                            echeanceDescription: "25% du montant de l'IBA de l'année précédente."
                        },
                        obligationDescription: "Quatrième acompte à verser au plus tard le 10 décembre."
                    },
                    {
                        impotTitle: 'IBA - Solde et déclaration annuelle',
                        echeancePaiement: {
                            echeancePeriodeLimite: '30 avril',
                            echeanceDescription: "Solde de l'IBA et déclaration annuelle avec bilan OHADA."
                        },
                        obligationDescription: "Le solde de l'IBA doit être versé et la déclaration annuelle déposée avant le 30 avril."
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
                            "L'impôt minimum absolu est de 500 000 FCFA pour les entrepreneurs individuels."
                        ]
                    },
                    {
                        infosTitle: 'Réductions et avantages',
                        infosDescription: [
                            "Réduction de 50% de l'IBA pour les artisans travaillant avec leur famille.",
                            "Possibilité de report des déficits sur les exercices suivants.",
                            "Déduction des charges réellement supportées pour l'activité."
                        ]
                    }
                ],

                impotConfig: {
                    impotTitle: 'Impôt sur le Bénéfice d\'Affaire (IBA)',
                    label: 'IBA',
                    description: `L'Impôt sur le Bénéfice d'Affaire est un impôt direct calculé sur le bénéfice imposable des entrepreneurs individuels.
                            Le taux varie selon le secteur d'activité et s'applique après déduction des charges.
                            Des acomptes trimestriels sont obligatoires, avec un solde au 30 avril.
                            Une réduction de 50% s'applique aux artisans travaillant avec leur famille.`,
                    competentCenter: "Centre des Impôts des Petites Entreprises (CIPE) de votre ressort territorial.",
                    paymentSchedule: [
                        {
                            date: "10 mars",
                            description: "Premier acompte (25% de l'IBA de l'année précédente)"
                        },
                        {
                            date: "10 juin",
                            description: "Deuxième acompte (25% de l'IBA de l'année précédente)"
                        },
                        {
                            date: "10 septembre",
                            description: "Troisième acompte (25% de l'IBA de l'année précédente)"
                        },
                        {
                            date: "10 décembre",
                            description: "Quatrième acompte (25% de l'IBA de l'année précédente)"
                        },
                        {
                            date: "30 avril",
                            description: "Solde et déclaration annuelle"
                        }
                    ]
                }
            };
        } catch (error) {
            return this.genererReponseErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de l\'IBA');
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
        return 0.015; // Taux minimum pour les entrepreneurs individuels
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

    private static genererReponseErreur(input: IBAInput, annee: number): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'CONSTANTES_NON_DISPONIBLES',
                    message: `Les taux IBA pour l'année ${annee} ne sont pas encore disponibles.`,
                    details: `Le calcul de l'Impôt sur le Bénéfice d'Affaire pour l'année ${annee} ne peut pas être effectué car les taux officiels n'ont pas encore été publiés par l'administration fiscale béninoise.`,
                    severity: 'info'
                }
            ],
            context: {
                typeContribuable: 'Entrepreneur individuel',
                regime: 'IBA',
                chiffreAffaires: input.chiffreAffaire,
                missingData: ['taux_iba', 'seuils_imposition', 'barèmes_sectoriels']
            },
            timestamp: new Date().toISOString(),
            requestId: `iba_calc_${Date.now()}`
        };
    }

    private static genererReponseErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'VALIDATION_ERROR',
                    message: message,
                    details: `Erreur de validation des données d'entrée pour le calcul de l'IBA.`,
                    severity: 'error'
                }
            ],
            context: {
                typeContribuable: 'Entrepreneur individuel',
                regime: 'IBA',
                missingData: ['donnees_entree', 'chiffre_affaires', 'charges']
            },
            timestamp: new Date().toISOString(),
            requestId: `iba_calc_${Date.now()}`
        };
    }
}

export default MoteurIBA;
