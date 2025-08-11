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

class MoteurIRF {
    private static readonly REDEVANCE_ORTB = 4_000;

    public static calculerIRF(input: IRFInput): IRFCalculationResult {
        try {
            // Extraire l'année de la période fiscale
            const annee = this.extraireAnnee(input.periodeFiscale);
            
            // Vérifier si l'année est 2026 ou ultérieure
            if (annee >= 2026) {
                return this.genererReponseErreur(input, annee);
            }

            // Validation des entrées
            if (!input.revenuLocatif || input.revenuLocatif <= 0) {
                return this.genererReponseErreurValidation('Le revenu locatif doit être un montant positif');
            }

            // Déterminer le taux selon si le revenu est déjà taxé
            const taux = input.isAlreadyTaxed ? 0.10 : 0.12;
            const tauxPourcentage = input.isAlreadyTaxed ? '10%' : '12%';

            // Calculer l'IRF
            const irfMontant = input.revenuLocatif * taux;
            const irfArrondi = Math.round(irfMontant);

            // Calculer le total avec la redevance ORTB
            const totalTax = irfArrondi + this.REDEVANCE_ORTB;

            return {
                totalEstimation: totalTax,
                totalEstimationCurrency: 'FCFA',
                contribuableRegime: 'IRF',

                VariableEnter: [
                    {
                        label: "Revenu locatif annuel",
                        description: "Montant total des revenus locatifs perçus durant l'année fiscale.",
                        value: input.revenuLocatif,
                        currency: 'FCFA',
                    },
                    {
                        label: "Revenu déjà taxé",
                        description: "Indique si le revenu est déjà soumis à IBA/IS (taux réduit de 10%).",
                        value: input.isAlreadyTaxed ? 1 : 0,
                        currency: '',
                    }
                ],

                impotDetailCalcule: [
                    {
                        impotTitle: 'IRF (Impôt sur les Revenus Fonciers)',
                        impotDescription: `Calculé sur le revenu locatif avec un taux de ${tauxPourcentage}`,
                        impotValue: irfArrondi,
                        impotValueCurrency: 'FCFA',
                        impotTaux: tauxPourcentage,
                        importCalculeDescription: `IRF = ${input.revenuLocatif.toLocaleString('fr-FR')} FCFA × ${tauxPourcentage} = ${irfArrondi.toLocaleString('fr-FR')} FCFA`
                    },
                    {
                        impotTitle: 'Redevance ORTB',
                        impotDescription: 'Redevance audiovisuelle obligatoire pour l\'Office de Radiodiffusion et Télévision du Bénin.',
                        impotValue: this.REDEVANCE_ORTB,
                        impotValueCurrency: 'FCFA',
                        impotTaux: 'Forfait',
                        importCalculeDescription: 'Redevance ORTB fixe de 4 000 FCFA'
                    }
                ],

                obligationEcheance: [
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
                ],

                infosSupplementaires: [
                    {
                        infosTitle: 'Taux d\'imposition',
                        infosDescription: [
                            input.isAlreadyTaxed 
                                ? "Taux réduit de 10% appliqué (revenu déjà soumis à IBA/IS)"
                                : "Taux standard de 12% appliqué",
                            "Redevance ORTB de 4 000 FCFA appliquée"
                        ]
                    },
                    {
                        infosTitle: 'Obligations de conservation',
                        infosDescription: [
                            "Conservez vos justificatifs de paiement ou de déclaration.",
                            "Les justificatifs doivent être conservés pendant 5 ans."
                        ]
                    },
                    {
                        infosTitle: 'Centre compétent',
                        infosDescription: [
                            "Centre des Impôts des Petites Entreprises (CIPE) de votre ressort territorial.",
                            "Pour toute information, contactez la Cellule de Services aux Contribuables (CSC) au 133."
                        ]
                    }
                ],

                impotConfig: {
                    impotTitle: 'Impôt sur les Revenus Fonciers',
                    label: 'IRF',
                    description: `L'IRF est calculé sur les revenus locatifs avec un taux de 10% si le revenu est déjà soumis à IBA/IS, sinon 12%.
                            Une redevance ORTB de 4 000 FCFA s'ajoute obligatoirement.
                            La déclaration et le paiement doivent être effectués avant le 30 avril.`,
                    competentCenter: "Centre des Impôts des Petites Entreprises (CIPE) de votre ressort territorial."
                }
            };
        } catch (error) {
            return this.genererReponseErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de l\'IRF');
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

    private static genererReponseErreur(input: IRFInput, annee: number): BackendEstimationFailureResponse {
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

    private static genererReponseErreurValidation(message: string): BackendEstimationFailureResponse {
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

export default MoteurIRF;
