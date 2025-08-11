import { GlobalEstimationInfoData } from '../../../../types/frontend.result.return.type';
import {BackendEstimationError, BackendEstimationFailureResponse, BackendEstimationContext } from '../../../../types/frontend.errors.estomation.type';

// Type union pour le retour de la fonction
export type ITSCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

class MoteurITS {
    private static readonly SEUIL_EXONERATION = 60_000;
    private static readonly REDEVANCE_ORTB_MARS = 1_000;
    private static readonly REDEVANCE_ORTB_JUIN = 3_000;
    private static readonly REDEVANCE_ORTB_CUMULEE = 4_000;

    public static calculerITS(salaireAnnuel: number, periodeFiscale: string): ITSCalculationResult {
        // Extraire l'année de la période fiscale
        const annee = this.extraireAnnee(periodeFiscale);
        
        // Vérifier si l'année est 2026 ou ultérieure
        if (annee >= 2026) {
            return this.genererReponseErreur(salaireAnnuel, annee);
        }

        // Calcul ITS selon barème progressif mensuel (CGI 2025)
        let itsTaxAmount = 0;
        let detailsITS: string[] = [];

        if (salaireAnnuel <= this.SEUIL_EXONERATION) {
            itsTaxAmount = 0;
            detailsITS.push('Salaire mensuel ≤ 60 000 FCFA : exonération ITS');
        } else if (salaireAnnuel <= 150_000) {
            itsTaxAmount = (salaireAnnuel - this.SEUIL_EXONERATION) * 0.10;
            detailsITS.push(`Tranche 60 001 - 150 000 FCFA : 10% de ${salaireAnnuel - this.SEUIL_EXONERATION} FCFA`);
        } else if (salaireAnnuel <= 250_000) {
            itsTaxAmount = 9_000 + (salaireAnnuel - 150_000) * 0.15;
            detailsITS.push('Tranche 60 001 - 150 000 FCFA : 9 000 FCFA');
            detailsITS.push(`Tranche 150 001 - 250 000 FCFA : 15% de ${salaireAnnuel - 150_000} FCFA`);
        } else if (salaireAnnuel <= 500_000) {
            itsTaxAmount = 24_000 + (salaireAnnuel - 250_000) * 0.19;
            detailsITS.push('Tranche 60 001 - 250 000 FCFA : 24 000 FCFA');
            detailsITS.push(`Tranche 250 001 - 500 000 FCFA : 19% de ${salaireAnnuel - 250_000} FCFA`);
        } else {
            itsTaxAmount = 71_500 + (salaireAnnuel - 500_000) * 0.30;
            detailsITS.push('Tranche 60 001 - 500 000 FCFA : 71 500 FCFA');
            detailsITS.push(`Tranche > 500 000 FCFA : 30% de ${salaireAnnuel - 500_000} FCFA`);
        }

        itsTaxAmount = Math.round(itsTaxAmount);

        // Calcul redevance ORTB
        const currentMonth = new Date().getMonth();
        let redevanceORTB = 0;
        let detailsRedevance: string[] = [];

        if (currentMonth > 5) {
            // Après juin : redevance cumulée
            if (salaireAnnuel > this.SEUIL_EXONERATION) {
                redevanceORTB = this.REDEVANCE_ORTB_CUMULEE;
                detailsRedevance.push('Redevance ORTB cumulée (mars + juin) de 4 000 FCFA appliquée (date après juin).');
            } else {
                detailsRedevance.push('Salaire ≤ 60 000 FCFA : exonération des redevances ORTB.');
            }
        } else if (currentMonth === 2) {
            // Mars
            if (salaireAnnuel > this.SEUIL_EXONERATION) {
                redevanceORTB = this.REDEVANCE_ORTB_MARS;
                detailsRedevance.push('Redevance ORTB de mars (1 000 FCFA) appliquée.');
            } else {
                detailsRedevance.push('Salaire ≤ 60 000 FCFA : exonération de la redevance ORTB de mars.');
            }
        } else if (currentMonth === 5) {
            // Juin
            if (salaireAnnuel > this.SEUIL_EXONERATION) {
                redevanceORTB = this.REDEVANCE_ORTB_JUIN;
                detailsRedevance.push('Redevance ORTB de juin (3 000 FCFA) appliquée.');
            } else {
                detailsRedevance.push('Salaire ≤ 60 000 FCFA : exonération de la redevance ORTB de juin.');
            }
        } else {
            detailsRedevance.push('Pas de redevance ORTB applicable ce mois-ci.');
        }

        const totalTax = itsTaxAmount + redevanceORTB;

        return {
            totalEstimation: totalTax,
            totalEstimationCurrency: 'FCFA',
            contribuableRegime: 'ITS',

            VariableEnter: [
                {
                    label: "Salaire mensuel",
                    description: "Salaire mensuel brut du contribuable.",
                    value: salaireAnnuel,
                    currency: 'FCFA',
                }
            ],

            impotDetailCalcule: [
                {
                    impotTitle: 'ITS (Impôt sur les Traitements et Salaires)',
                    impotDescription: "Impôt progressif calculé sur le salaire mensuel selon le barème en vigueur.",
                    impotValue: itsTaxAmount,
                    impotValueCurrency: 'FCFA',
                    impotTaux: 'Barème progressif',
                    importCalculeDescription: detailsITS.join(' ; ')
                },
                ...(redevanceORTB > 0 ? [{
                    impotTitle: 'Redevance ORTB',
                    impotDescription: 'Redevance spéciale pour l\'Office de Radiodiffusion et Télévision du Bénin.',
                    impotValue: redevanceORTB,
                    impotValueCurrency: 'FCFA',
                    impotTaux: 'Forfait',
                    importCalculeDescription: detailsRedevance.join(' ; ')
                }] : [])
            ],

            obligationEcheance: [
                {
                    impotTitle: 'ITS - Prélèvement mensuel',
                    echeancePaiement: {
                        echeancePeriodeLimite: 'Mensuel',
                        echeanceDescription: "L'ITS est prélevé mensuellement à la source par l'employeur."
                    },
                    obligationDescription: "L'employeur doit prélever et verser l'ITS mensuellement."
                },
                {
                    impotTitle: 'ITS - Régularisation annuelle',
                    echeancePaiement: {
                        echeancePeriodeLimite: 'Juillet N+1',
                        echeanceDescription: "Régularisation annuelle basée sur les salaires cumulés des 6 premiers mois."
                    },
                    obligationDescription: "Une régularisation est effectuée en juillet pour ajuster l'impôt sur la base des salaires cumulés."
                }
            ],

            infosSupplementaires: [
                {
                    infosTitle: 'Barème progressif ITS',
                    infosDescription: [
                        "Salaire ≤ 60 000 FCFA : exonération",
                        "60 001 - 150 000 FCFA : 10%",
                        "150 001 - 250 000 FCFA : 15%",
                        "250 001 - 500 000 FCFA : 19%",
                        "> 500 000 FCFA : 30%"
                    ]
                },
                {
                    infosTitle: 'Redevance ORTB',
                    infosDescription: [
                        "Mars : 1 000 FCFA (si salaire > 60 000 FCFA)",
                        "Juin : 3 000 FCFA (si salaire > 60 000 FCFA)",
                        "Après juin : cumul de 4 000 FCFA"
                    ]
                },
                {
                    infosTitle: 'Régularisation annuelle',
                    infosDescription: [
                        "L'ITS est prélevé mensuellement à la source.",
                        "Une régularisation annuelle est effectuée en juillet pour ajuster l'impôt sur la base des salaires cumulés des 6 premiers mois."
                    ]
                }
            ],

            impotConfig: {
                impotTitle: 'Impôt sur les Traitements et Salaires',
                label: 'ITS',
                description: `L'ITS est un impôt progressif calculé sur les traitements et salaires selon un barème mensuel.
                        Il est prélevé mensuellement à la source par l'employeur.
                        Une redevance ORTB s'ajoute selon le mois de l'année.
                        Une régularisation annuelle est effectuée en juillet.`,
                competentCenter: "Centre des Impôts territorialement compétent selon l'adresse du contribuable."
            }
        };
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

    private static genererReponseErreur(salaireAnnuel: number, annee: number): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'CONSTANTES_NON_DISPONIBLES',
                    message: `Les constantes de calcul de l'ITS pour l'année ${annee} ne sont pas encore disponibles.`,
                    details: `Le calcul de l'Impôt sur les Traitements et Salaires pour l'année ${annee} ne peut pas être effectué car les barèmes et taux officiels n'ont pas encore été publiés par l'administration fiscale béninoise.`,
                    severity: 'info'
                }
            ],
            context: {
                typeContribuable: 'Salarié',
                regime: 'ITS',
                chiffreAffaire: salaireAnnuel,
                missingData: ['barème_its', 'seuils_exonération', 'redevance_ortb']
            },
            timestamp: new Date().toISOString(),
            requestId: `its_calc_${Date.now()}`
        };
    }
}

export default MoteurITS;
