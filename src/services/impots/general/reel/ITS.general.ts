import { GlobalEstimationInfoData, VariableEnter } from '../../../../types/frontend.result.return.type';
import {BackendEstimationFailureResponse } from '../../../../types/frontend.errors.estomation.type';

// Type union pour le retour de la fonction
export type ITSCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

// Options de calcul ITS
interface ITSCalculationOptions {
    includeRedevanceORTB?: boolean;
    customRedevanceORTB?: number; // Remplace le calcul dynamique (mars/juin/cumul)
}

// Configuration centrale ITS
class ITSConfig {
    static readonly SEUIL_EXONERATION = 60_000;
    static readonly REDEVANCE_ORTB_MARS = 1_000;
    static readonly REDEVANCE_ORTB_JUIN = 3_000;
    static readonly REDEVANCE_ORTB_CUMULEE = 4_000;

    static readonly TITLE = 'Impôt sur les Traitements et Salaires';
    static readonly LABEL = 'ITS';
    static readonly DESCRIPTION = `L'ITS est un impôt progressif calculé sur les traitements et salaires selon un barème mensuel.
            Il est prélevé mensuellement à la source par l'employeur. Une redevance ORTB s'ajoute selon le mois de l'année.
            Une régularisation annuelle est effectuée en juillet.`;
    static readonly COMPETENT_CENTER = "Centre des Impôts territorialement compétent selon l'adresse du contribuable.";
}

// Gestion d'erreurs
class ITSErrorHandler {
    static genererErreurAnnee(salaireMensuel: number, annee: number): BackendEstimationFailureResponse {
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
                chiffreAffaire: salaireMensuel,
                missingData: ['barème_its', 'seuils_exonération', 'redevance_ortb']
            },
            timestamp: new Date().toISOString(),
            requestId: `its_calc_${Date.now()}`
        };
    }

    static genererErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'VALIDATION_ERROR',
                    message: message,
                    details: `Erreur de validation des données d'entrée pour le calcul de l'ITS.`,
                    severity: 'error'
                }
            ],
            context: {
                typeContribuable: 'Salarié',
                regime: 'ITS',
                missingData: ['donnees_entree']
            },
            timestamp: new Date().toISOString(),
            requestId: `its_calc_${Date.now()}`
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
class ITSResponseBuilder {
    private salaireMensuel: number;
    private periodeFiscale: string;
    private options: ITSCalculationOptions;

    private itsTaxAmount: number = 0;
    private redevanceORTB: number = 0;
    private detailsITS: string[] = [];
    private detailsRedevance: string[] = [];

    constructor(salaireMensuel: number, periodeFiscale: string, options: ITSCalculationOptions = {}) {
        this.salaireMensuel = salaireMensuel;
        this.periodeFiscale = periodeFiscale;
        this.options = {
            includeRedevanceORTB: true,
            ...options
        };
        this.initializeCalculations();
    }

    private initializeCalculations() {
        // Calcul ITS selon barème progressif mensuel (CGI 2025)
        if (this.salaireMensuel <= ITSConfig.SEUIL_EXONERATION) {
            this.itsTaxAmount = 0;
            this.detailsITS.push('Salaire mensuel ≤ 60 000 FCFA : exonération ITS');
        } else if (this.salaireMensuel <= 150_000) {
            this.itsTaxAmount = (this.salaireMensuel - ITSConfig.SEUIL_EXONERATION) * 0.10;
            this.detailsITS.push(`Tranche 60 001 - 150 000 FCFA : 10% de ${this.salaireMensuel - ITSConfig.SEUIL_EXONERATION} FCFA`);
        } else if (this.salaireMensuel <= 250_000) {
            this.itsTaxAmount = 9_000 + (this.salaireMensuel - 150_000) * 0.15;
            this.detailsITS.push('Tranche 60 001 - 150 000 FCFA : 9 000 FCFA');
            this.detailsITS.push(`Tranche 150 001 - 250 000 FCFA : 15% de ${this.salaireMensuel - 150_000} FCFA`);
        } else if (this.salaireMensuel <= 500_000) {
            this.itsTaxAmount = 24_000 + (this.salaireMensuel - 250_000) * 0.19;
            this.detailsITS.push('Tranche 60 001 - 250 000 FCFA : 24 000 FCFA');
            this.detailsITS.push(`Tranche 250 001 - 500 000 FCFA : 19% de ${this.salaireMensuel - 250_000} FCFA`);
        } else {
            this.itsTaxAmount = 71_500 + (this.salaireMensuel - 500_000) * 0.30;
            this.detailsITS.push('Tranche 60 001 - 500 000 FCFA : 71 500 FCFA');
            this.detailsITS.push(`Tranche > 500 000 FCFA : 30% de ${this.salaireMensuel - 500_000} FCFA`);
        }

        this.itsTaxAmount = Math.round(this.itsTaxAmount);

        // Calcul redevance ORTB (optionnelle et personnalisable)
        if (this.options.includeRedevanceORTB) {
            if (this.options.customRedevanceORTB !== undefined) {
                this.redevanceORTB = this.options.customRedevanceORTB;
                this.detailsRedevance.push(`Redevance ORTB personnalisée de ${this.redevanceORTB.toLocaleString('fr-FR')} FCFA.`);
            } else {
                const currentMonth = new Date().getMonth();
                if (currentMonth > 5) {
                    if (this.salaireMensuel > ITSConfig.SEUIL_EXONERATION) {
                        this.redevanceORTB = ITSConfig.REDEVANCE_ORTB_CUMULEE;
                        this.detailsRedevance.push('Redevance ORTB cumulée (mars + juin) de 4 000 FCFA appliquée (date après juin).');
                    } else {
                        this.detailsRedevance.push('Salaire ≤ 60 000 FCFA : exonération des redevances ORTB.');
                    }
                } else if (currentMonth === 2) {
                    if (this.salaireMensuel > ITSConfig.SEUIL_EXONERATION) {
                        this.redevanceORTB = ITSConfig.REDEVANCE_ORTB_MARS;
                        this.detailsRedevance.push('Redevance ORTB de mars (1 000 FCFA) appliquée.');
                    } else {
                        this.detailsRedevance.push('Salaire ≤ 60 000 FCFA : exonération de la redevance ORTB de mars.');
                    }
                } else if (currentMonth === 5) {
                    if (this.salaireMensuel > ITSConfig.SEUIL_EXONERATION) {
                        this.redevanceORTB = ITSConfig.REDEVANCE_ORTB_JUIN;
                        this.detailsRedevance.push('Redevance ORTB de juin (3 000 FCFA) appliquée.');
                    } else {
                        this.detailsRedevance.push('Salaire ≤ 60 000 FCFA : exonération de la redevance ORTB de juin.');
                    }
                } else {
                    this.detailsRedevance.push('Pas de redevance ORTB applicable ce mois-ci.');
                }
            }
        } else {
            this.redevanceORTB = 0;
        }
    }

    private buildVariablesEnter(): VariableEnter[] {
        const variables: VariableEnter[] = [
            {
                label: "Salaire mensuel",
                description: "Salaire mensuel brut du contribuable.",
                value: this.salaireMensuel,
                currency: 'FCFA',
            }
        ];

        if (this.options.includeRedevanceORTB && this.redevanceORTB > 0) {
            variables.push({
                label: 'Redevance ORTB',
                description: "Redevance audiovisuelle applicable selon le mois.",
                value: this.redevanceORTB,
                currency: 'FCFA'
            });
        }

        return variables;
    }

    private buildImpotDetailCalcule() {
        const details = [
            {
                impotTitle: 'ITS (Impôt sur les Traitements et Salaires)',
                impotDescription: "Impôt progressif calculé sur le salaire mensuel selon le barème en vigueur.",
                impotValue: this.itsTaxAmount,
                impotValueCurrency: 'FCFA',
                impotTaux: 'Barème progressif',
                importCalculeDescription: this.detailsITS.join(' ; ')
            }
        ];

        if (this.options.includeRedevanceORTB && this.redevanceORTB > 0) {
            details.push({
                impotTitle: 'Redevance ORTB',
                impotDescription: "Redevance spéciale pour l'Office de Radiodiffusion et Télévision du Bénin.",
                impotValue: this.redevanceORTB,
                impotValueCurrency: 'FCFA',
                impotTaux: this.options.customRedevanceORTB ? 'Personnalisée' : 'Forfait',
                importCalculeDescription: this.detailsRedevance.join(' ; ')
            });
        }

        return details;
    }

    private buildObligationEcheance() {
        return [
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
        ];
    }

    private buildInfosSupplementaires() {
        const infos = [
            {
                infosTitle: 'Barème progressif ITS',
                infosDescription: [
                    "Salaire ≤ 60 000 FCFA : exonération",
                    "60 001 - 150 000 FCFA : 10%",
                    "150 001 - 250 000 FCFA : 15%",
                    "250 001 - 500 000 FCFA : 19%",
                    "> 500 000 FCFA : 30%"
                ]
            }
        ];

        if (this.options.includeRedevanceORTB) {
            infos.push({
                infosTitle: 'Redevance ORTB',
                infosDescription: [
                    "Mars : 1 000 FCFA (si salaire > 60 000 FCFA)",
                    "Juin : 3 000 FCFA (si salaire > 60 000 FCFA)",
                    "Après juin : cumul de 4 000 FCFA"
                ]
            });
        } else {
            infos.push({
                infosTitle: 'Calcul sans redevance ORTB',
                infosDescription: [
                    "Ce calcul n'inclut pas la redevance ORTB.",
                    "Dans la pratique, cette redevance est généralement obligatoire."
                ]
            });
        }

        return infos;
    }

    private buildImpotConfig() {
        return {
            impotTitle: ITSConfig.TITLE,
            label: ITSConfig.LABEL,
            description: ITSConfig.DESCRIPTION,
            competentCenter: ITSConfig.COMPETENT_CENTER
        };
    }

    build(): GlobalEstimationInfoData {
        return {
            totalEstimation: this.itsTaxAmount + (this.options.includeRedevanceORTB ? this.redevanceORTB : 0),
            totalEstimationCurrency: 'FCFA',
            VariableEnter: this.buildVariablesEnter(),
            impotDetailCalcule: this.buildImpotDetailCalcule(),
            obligationEcheance: this.buildObligationEcheance(),
            infosSupplementaires: this.buildInfosSupplementaires(),
            impotConfig: this.buildImpotConfig()
        };
    }
}

// Classe principale
class MoteurITS {
    public static calculerITS(salaireMensuel: number, periodeFiscale: string): ITSCalculationResult {
        // Extraire l'année de la période fiscale
        const annee = DateUtils.extraireAnnee(periodeFiscale);
        
        // Vérifier si l'année est 2026 ou ultérieure
        if (annee >= 2026) {
            return ITSErrorHandler.genererErreurAnnee(salaireMensuel, annee);
        }

        // Validation des entrées
        if (!salaireMensuel || salaireMensuel <= 0) {
            return ITSErrorHandler.genererErreurValidation('Le salaire doit être un montant positif');
        }

        return new ITSResponseBuilder(salaireMensuel, periodeFiscale, {}).build();
    }

    public static calculerITSWithoutRedevanceORTB(salaireMensuel: number, periodeFiscale: string): ITSCalculationResult {
        const annee = DateUtils.extraireAnnee(periodeFiscale);
        if (annee >= 2026) {
            return ITSErrorHandler.genererErreurAnnee(salaireMensuel, annee);
        }
        if (!salaireMensuel || salaireMensuel <= 0) {
            return ITSErrorHandler.genererErreurValidation('Le salaire doit être un montant positif');
        }
        return new ITSResponseBuilder(salaireMensuel, periodeFiscale, { includeRedevanceORTB: false }).build();
    }

    public static calculerITSPersonnalise(
        salaireMensuel: number,
        periodeFiscale: string,
        customRedevanceORTB?: number
    ): ITSCalculationResult {
        const annee = DateUtils.extraireAnnee(periodeFiscale);
        if (annee >= 2026) {
            return ITSErrorHandler.genererErreurAnnee(salaireMensuel, annee);
        }
        if (!salaireMensuel || salaireMensuel <= 0) {
            return ITSErrorHandler.genererErreurValidation('Le salaire doit être un montant positif');
        }
        return new ITSResponseBuilder(salaireMensuel, periodeFiscale, { 
            includeRedevanceORTB: customRedevanceORTB !== undefined,
            customRedevanceORTB
        }).build();
    }

    public static calculerITSAvecOptions(
        salaireMensuel: number,
        periodeFiscale: string,
        options: ITSCalculationOptions
    ): ITSCalculationResult {
        const annee = DateUtils.extraireAnnee(periodeFiscale);
        if (annee >= 2026) {
            return ITSErrorHandler.genererErreurAnnee(salaireMensuel, annee);
        }
        if (!salaireMensuel || salaireMensuel <= 0) {
            return ITSErrorHandler.genererErreurValidation('Le salaire doit être un montant positif');
        }
        return new ITSResponseBuilder(salaireMensuel, periodeFiscale, options).build();
    }
}

export default MoteurITS;
