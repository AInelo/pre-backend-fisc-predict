import { GlobalEstimationInfoData } from '../../../../types/frontend.result.return.type';
import {BackendEstimationError, BackendEstimationFailureResponse, BackendEstimationContext } from '../../../../types/frontend.errors.estomation.type';

// Type union pour le retour de la fonction
export type TPSCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

class MoteurTPSimplifie {
    private static readonly TAUX_TPS = 0.05;
    private static readonly MONTANT_MINIMUM = 10_000;
    private static readonly REDEVANCE_RTB = 4_000;
    private static readonly CONTRIBUTION_CCI = 20_000;
    private static readonly SEUIL_REGIME_REEL = 50_000_000;

    public static calculerTPS(chiffreAffaire: number, periodeFiscale: string): TPSCalculationResult {
        // Extraire l'année de la période fiscale
        const annee = this.extraireAnnee(periodeFiscale);
        
        // Vérifier si l'année est 2026 ou ultérieure
        if (annee >= 2026) {
            return this.genererReponseErreurAnnee(chiffreAffaire, annee);
        }

        // Vérifier si le chiffre d'affaires dépasse le seuil pour le régime réel
        if (chiffreAffaire > this.SEUIL_REGIME_REEL) {
            return this.genererReponseErreurRegimeReel(chiffreAffaire);
        }

        // Calcul normal pour les entreprises éligibles au régime TPS
        const tpsCalculee = chiffreAffaire * this.TAUX_TPS;
        const tpsBase = Math.max(tpsCalculee, this.MONTANT_MINIMUM);
        const tpsTotale = tpsBase + this.REDEVANCE_RTB + this.CONTRIBUTION_CCI;

        return {
            totalEstimation: tpsTotale,
            totalEstimationCurrency: 'FCFA',
            contribuableRegime: 'Régime TPS',

            VariableEnter: [
                {
                    label: "Chiffre d'affaires annuel",
                    description: "Montant total des ventes ou revenus encaissés durant l'année fiscale.",
                    value: chiffreAffaire,
                    currency: 'FCFA',
                }
            ],

            impotDetailCalcule: [
                {
                    impotTitle: 'TPS (Taxe Professionnelle Synthétique)',
                    impotDescription: "Calculée à 5% du chiffre d'affaires annuel avec un minimum de 10 000 FCFA.",
                    impotValue: tpsBase,
                    impotValueCurrency: 'FCFA',
                    impotTaux: '5%',
                    importCalculeDescription: `TPS = max(5% du chiffre d'affaires, 10 000 FCFA) → ${tpsBase.toLocaleString('fr-FR')} FCFA`
                },
                {
                    impotTitle: 'Redevance RTB',
                    impotDescription: 'Montant fixe de 4 000 FCFA ajouté à la TPS pour la radiodiffusion et télévision nationale.',
                    impotValue: this.REDEVANCE_RTB,
                    impotValueCurrency: 'FCFA',
                    importCalculeDescription: 'Conformément à la loi, une redevance audiovisuelle de 4 000 FCFA est ajoutée.'
                },
                {
                    impotTitle: 'Contribution CCI Bénin',
                    impotDescription: "Montant fixe de 20 000 FCFA représentant la contribution à la Chambre de Commerce et d'Industrie du Bénin.",
                    impotValue: this.CONTRIBUTION_CCI,
                    impotValueCurrency: 'FCFA',
                    importCalculeDescription: 'Montant forfaitaire obligatoire ajouté au calcul de la TPS.'
                }
            ],

            obligationEcheance: [
                {
                    impotTitle: 'TPS - Solde à payer',
                    echeancePaiement: {
                        echeancePeriodeLimite: '30 avril N+1',
                        echeanceDescription: "Solde à verser au plus tard le 30 avril de l'année suivante."
                    },
                    obligationDescription: 'Le solde de la TPS est calculé après déduction des acomptes éventuels.'
                },
                {
                    impotTitle: 'TPS - Acomptes provisionnels',
                    echeancePaiement: [
                        {
                            echeancePeriodeLimite: '10 février',
                            echeanceDescription: "Premier acompte égal à 50% de la TPS de l'année précédente."
                        },
                        {
                            echeancePeriodeLimite: '10 juin',
                            echeanceDescription: "Deuxième acompte égal à 50% de la TPS de l'année précédente."
                        }
                    ],
                    obligationDescription: "Applicable sauf pour la première année d'activité."
                }
            ],

            infosSupplementaires: [
                {
                    infosTitle: 'Acomptes et Solde',
                    infosDescription: [
                        "Deux acomptes provisionnels égaux à 50% de la TPS de l'année précédente sont exigés.",
                        "Le solde à payer est : TPS année en cours – (acompte 1 + acompte 2)."
                    ]
                },
                {
                    infosTitle: 'Amendes possibles',
                    infosDescription: [
                        'Tout paiement ≥ 100 000 FCFA doit être effectué par voie bancaire. Sinon, amende de 5%.',
                        'Amende pour non-présentation de comptabilité : 1 000 000 FCFA par exercice.'
                    ]
                }
            ],

            impotConfig: {
                impotTitle: 'Taxe Professionnelle Synthétique',
                label: 'TPS',
                description: `La TPS est égale à 5% du chiffre d'affaires annuel avec un minimum forfaitaire de 10 000 FCFA.
                        Une redevance audiovisuelle de 4 000 FCFA est ajoutée à la TPS.
                        Une contribution fixe de 20 000 FCFA à la Chambre de Commerce et d'Industrie du Bénin (CCI Bénin) est également ajoutée.
                        En cas de chiffre d'affaires > 50 millions FCFA, le contribuable passe au régime réel.`,
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

    private static genererReponseErreurAnnee(chiffreAffaire: number, annee: number): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'CONSTANTES_NON_DISPONIBLES',
                    message: `Les constantes de calcul de la TPS pour l'année ${annee} ne sont pas encore disponibles.`,
                    details: `Le calcul de la Taxe Professionnelle Synthétique pour l'année ${annee} ne peut pas être effectué car les taux, montants minimums et contributions officiels n'ont pas encore été publiés par l'administration fiscale béninoise.`,
                    severity: 'info'
                }
            ],
            context: {
                typeContribuable: 'Entreprise',
                regime: chiffreAffaire > this.SEUIL_REGIME_REEL ? 'Régime Réel' : 'Régime TPS',
                chiffreAffaire: chiffreAffaire,
                missingData: ['taux_tps', 'montant_minimum', 'redevance_rtb', 'contribution_cci']
            },
            timestamp: new Date().toISOString(),
            requestId: `tps_calc_${Date.now()}`
        };
    }

    private static genererReponseErreurRegimeReel(chiffreAffaire: number): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'CHIFFRE_AFFAIRES_DEPASSE_SEUIL_TPS',
                    message: `Chiffre d'affaires supérieur au seuil du régime TPS (${this.SEUIL_REGIME_REEL.toLocaleString('fr-FR')} FCFA).`,
                    details: `Avec un chiffre d'affaires de ${chiffreAffaire.toLocaleString('fr-FR')} FCFA, vous dépassez le seuil de ${this.SEUIL_REGIME_REEL.toLocaleString('fr-FR')} FCFA et devez obligatoirement être soumis au régime réel. Veuillez effectuer votre simulation en tant qu'Entreprise Individuelle ou Société selon votre statut juridique pour obtenir le calcul approprié de vos impôts.`,
                    severity: 'warning'
                }
            ],
            context: {
                typeContribuable: 'Entreprise',
                regime: 'Régime Réel',
                chiffreAffaire: chiffreAffaire,
                missingData: ['regime_reel_parameters']
            },
            timestamp: new Date().toISOString(),
            requestId: `tps_seuil_depasse_${Date.now()}`
        };
    }
}

export default MoteurTPSimplifie;