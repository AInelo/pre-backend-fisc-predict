import { GlobalEstimationInfoData } from '../../../../types/frontend.result.return.type';
import { BackendEstimationError, BackendEstimationFailureResponse, BackendEstimationContext } from '../../../../types/frontend.errors.estomation.type';

// Interface pour les données d'entrée
interface TPSInput {
    chiffreAffaire: number;
    periodeFiscale: string;
    typeEntreprise: TypeEntreprise;
}

// Enum pour le type d'entreprise
enum TypeEntreprise {
    ENTREPRISE_INDIVIDUELLE = 'entreprise_individuelle',
    SOCIETE = 'societe'
}

// Type union pour le retour de la fonction
export type TPSCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

// Interface pour les options de calcul
interface TPSCalculationOptions {
    includeCCI?: boolean;
    includeRedevanceSRTB?: boolean;
    customRedevance?: number;
    customCCIRate?: number;
}

// Configuration de l'impôt TPS
class TPSConfig {
    static readonly TAUX_TPS = 0.05;
    static readonly MONTANT_MINIMUM = 10_000;
    static readonly REDEVANCE_RTB = 4_000;
    static readonly SEUIL_REGIME_REEL = 50_000_000;
    
    static readonly TITLE = 'Taxe Professionnelle Synthétique';
    static readonly LABEL = 'TPS';
    static readonly DESCRIPTION = `La TPS est égale à 5% du chiffre d'affaires annuel avec un minimum forfaitaire de 10 000 FCFA.
                    Une redevance audiovisuelle de 4 000 FCFA est ajoutée à la TPS.
                    Une contribution variable à la Chambre de Commerce et d'Industrie du Bénin (CCI Bénin) est également ajoutée selon le barème en vigueur.
                    En cas de chiffre d'affaires > 50 millions FCFA, le contribuable passe au régime réel.`;
    static readonly COMPETENT_CENTER = "Centre des Impôts territorialement compétent selon l'adresse du contribuable.";
    
    static readonly CCI_RATES = [
        { maxRevenue: 5000000, individual: 20000, company: 100000 },
        { maxRevenue: 25000000, individual: 50000, company: 200000 },
        { maxRevenue: 50000000, individual: 150000, company: 300000 },
        { maxRevenue: 400000000, individual: 400000, company: 400000 },
        { maxRevenue: 800000000, individual: 600000, company: 600000 },
        { maxRevenue: 1000000000, individual: 800000, company: 800000 },
        { maxRevenue: 2000000000, individual: 1200000, company: 1200000 },
        { maxRevenue: 4000000000, individual: 1600000, company: 1600000 },
        { maxRevenue: Infinity, individual: 2000000, company: 2000000 },
    ];
}

// Classe pour la gestion des erreurs
class TPSErrorHandler {
    static genererErreurAnnee(chiffreAffaire: number, annee: number): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [{
                code: 'CONSTANTES_NON_DISPONIBLES',
                message: `Les constantes de calcul de la TPS pour l'année ${annee} ne sont pas encore disponibles.`,
                details: `Le calcul de la Taxe Professionnelle Synthétique pour l'année ${annee} ne peut pas être effectué car les taux, montants minimums et contributions officiels n'ont pas encore été publiés par l'administration fiscale béninoise.`,
                severity: 'info'
            }],
            context: {
                typeContribuable: 'Entreprise',
                regime: chiffreAffaire > TPSConfig.SEUIL_REGIME_REEL ? 'Régime Réel' : 'Régime TPS',
                chiffreAffaire: chiffreAffaire,
                missingData: ['taux_tps', 'montant_minimum', 'redevance_rtb', 'contribution_cci']
            },
            timestamp: new Date().toISOString(),
            requestId: `tps_calc_${Date.now()}`
        };
    }

    static genererErreurRegimeReel(chiffreAffaire: number): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [{
                code: 'CHIFFRE_AFFAIRES_DEPASSE_SEUIL_TPS',
                message: `Chiffre d'affaires supérieur au seuil du régime TPS (${TPSConfig.SEUIL_REGIME_REEL.toLocaleString('fr-FR')} FCFA).`,
                details: `Avec un chiffre d'affaires de ${chiffreAffaire.toLocaleString('fr-FR')} FCFA, vous dépassez le seuil de ${TPSConfig.SEUIL_REGIME_REEL.toLocaleString('fr-FR')} FCFA et devez obligatoirement être soumis au régime réel. Veuillez effectuer votre simulation en tant qu'Entreprise Individuelle ou Société selon votre statut juridique pour obtenir le calcul approprié de vos impôts.`,
                severity: 'warning'
            }],
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

// Calculateur de contribution CCI
class CCICalculator {
    static calculer(chiffreAffaire: number, typeEntreprise: TypeEntreprise): number {
        const cciRate = TPSConfig.CCI_RATES.find(rate => chiffreAffaire <= rate.maxRevenue);
        
        if (!cciRate) {
            return 2000000; // Fallback au montant maximum
        }

        return typeEntreprise === TypeEntreprise.SOCIETE 
            ? cciRate.company 
            : cciRate.individual;
    }

    static getDescriptionBareme(chiffreAffaire: number): string {
        const cciRate = TPSConfig.CCI_RATES.find(rate => chiffreAffaire <= rate.maxRevenue);
        
        if (!cciRate) {
            return "Échelon maximum du barème";
        }

        const index = TPSConfig.CCI_RATES.indexOf(cciRate);
        const minRevenue = index > 0 ? TPSConfig.CCI_RATES[index - 1].maxRevenue + 1 : 0;
        
        const maxRevenue = cciRate.maxRevenue === Infinity ? "et plus" : cciRate.maxRevenue.toLocaleString('fr-FR');
        const minRevenueStr = minRevenue === 0 ? "0" : (minRevenue - 1).toLocaleString('fr-FR');
        
        return `Tranche ${minRevenueStr} - ${maxRevenue} FCFA`;
    }
}

// Builder pour construire la réponse de manière modulaire
class TPSResponseBuilder {
    private chiffreAffaire: number;
    private typeEntreprise: TypeEntreprise;
    private options: TPSCalculationOptions;
    private tpsBase: number;
    private contributionCCI: number;
    private redevanceSRTB: number;
    private tpsTotale: number;

    constructor(chiffreAffaire: number, typeEntreprise: TypeEntreprise, options: TPSCalculationOptions = {}) {
        this.chiffreAffaire = chiffreAffaire;
        this.typeEntreprise = typeEntreprise;
        this.options = {
            includeCCI: true,
            includeRedevanceSRTB: true,
            ...options
        };
        
        this.tpsBase = Math.max(chiffreAffaire * TPSConfig.TAUX_TPS, TPSConfig.MONTANT_MINIMUM);
        this.contributionCCI = this.options.includeCCI ? 
            (this.options.customCCIRate ?? CCICalculator.calculer(chiffreAffaire, typeEntreprise)) : 0;
        this.redevanceSRTB = this.options.includeRedevanceSRTB ? 
            (this.options.customRedevance ?? TPSConfig.REDEVANCE_RTB) : 0;
        this.tpsTotale = this.tpsBase + this.redevanceSRTB + this.contributionCCI;
    }

    private buildVariablesEnter() {
        return [
            {
                label: "Chiffre d'affaires annuel",
                description: "Montant total des ventes ou revenus encaissés durant l'année fiscale.",
                value: this.chiffreAffaire,
                currency: 'FCFA',
            },
            {
                label: "Type d'entreprise",
                description: "Statut juridique de l'entreprise (individuelle ou société).",
                value: this.typeEntreprise === TypeEntreprise.ENTREPRISE_INDIVIDUELLE ? 'Entreprise Individuelle' : 'Société',
                currency: '',
            }
        ];
    }

    private buildImpotDetailCalcule() {
        const details = [
            {
                impotTitle: 'TPS (Taxe Professionnelle Synthétique)',
                impotDescription: "Calculée à 5% du chiffre d'affaires annuel avec un minimum de 10 000 FCFA.",
                impotValue: this.tpsBase,
                impotValueCurrency: 'FCFA',
                impotTaux: '5%',
                importCalculeDescription: `TPS = max(5% du chiffre d'affaires, 10 000 FCFA) → ${this.tpsBase.toLocaleString('fr-FR')} FCFA`
            }
        ];

        if (this.options.includeRedevanceSRTB && this.redevanceSRTB > 0) {
            details.push({
                impotTitle: 'Redevance SRTB',
                impotDescription: `Montant ${this.options.customRedevance ? 'personnalisé' : 'fixe'} de ${this.redevanceSRTB.toLocaleString('fr-FR')} FCFA ajouté à la TPS pour la radiodiffusion et télévision nationale.`,
                impotValue: this.redevanceSRTB,
                impotTaux: `${this.redevanceSRTB.toLocaleString('fr-FR')} FCFA`,
                impotValueCurrency: 'FCFA',
                importCalculeDescription: `${this.options.customRedevance ? 'Redevance personnalisée' : 'Conformément à la loi, une redevance audiovisuelle'} de ${this.redevanceSRTB.toLocaleString('fr-FR')} FCFA est ajoutée.`
            });
        }

        if (this.options.includeCCI && this.contributionCCI > 0) {
            details.push({
                impotTitle: 'Contribution CCI Bénin',
                impotDescription: `Contribution à la Chambre de Commerce et d'Industrie du Bénin ${this.options.customCCIRate ? 'personnalisée' : `selon le barème en vigueur (${CCICalculator.getDescriptionBareme(this.chiffreAffaire)})`}.`,
                impotValue: this.contributionCCI,
                impotTaux: `${this.contributionCCI.toLocaleString('fr-FR')} FCFA ${this.options.customCCIRate ? ': montant personnalisé' : ': barème CCI'}`,
                impotValueCurrency: 'FCFA',
                importCalculeDescription: `Montant ${this.options.customCCIRate ? 'personnalisé' : 'calculé selon le barème CCI'} pour ${this.typeEntreprise === TypeEntreprise.ENTREPRISE_INDIVIDUELLE ? 'entreprise individuelle' : 'société'} avec CA de ${this.chiffreAffaire.toLocaleString('fr-FR')} FCFA.`
            });
        }

        return details;
    }

    private buildObligationEcheance() {
        return [
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
        ];
    }

    private buildInfosSupplementaires() {
        const infos = [
            {
                infosTitle: 'Acomptes et Solde',
                infosDescription: [
                    "Deux acomptes provisionnels égaux à 50% de la TPS de l'année précédente sont exigés.",
                    "Le solde à payer est : TPS année en cours – (acompte 1 + acompte 2)."
                ]
            }
        ];

        if (this.options.includeCCI && this.contributionCCI > 0) {
            infos.push({
                infosTitle: 'Contribution CCI Bénin',
                infosDescription: [
                    `La contribution CCI ${this.options.customCCIRate ? 'a été personnalisée' : 'varie selon le chiffre d\'affaires et le type d\'entreprise'}.`,
                    `Pour votre situation (${this.typeEntreprise === TypeEntreprise.ENTREPRISE_INDIVIDUELLE ? 'entreprise individuelle' : 'société'}, CA: ${this.chiffreAffaire.toLocaleString('fr-FR')} FCFA), la contribution est de ${this.contributionCCI.toLocaleString('fr-FR')} FCFA.`
                ]
            });
        }

        if (!this.options.includeCCI && !this.options.includeRedevanceSRTB) {
            infos.push({
                infosTitle: 'Calcul simplifié',
                infosDescription: [
                    'Ce calcul n\'inclut ni la contribution CCI Bénin ni la redevance SRTB.',
                    'Le montant total correspond uniquement à la TPS de base.'
                ]
            });
        } else if (!this.options.includeCCI) {
            infos.push({
                infosTitle: 'Calcul sans CCI',
                infosDescription: [
                    'Ce calcul n\'inclut pas la contribution CCI Bénin.',
                    'Dans la pratique, cette contribution est généralement obligatoire.'
                ]
            });
        } else if (!this.options.includeRedevanceSRTB) {
            infos.push({
                infosTitle: 'Calcul sans redevance SRTB',
                infosDescription: [
                    'Ce calcul n\'inclut pas la redevance SRTB.',
                    'Dans la pratique, cette redevance est généralement obligatoire.'
                ]
            });
        }

        infos.push({
            infosTitle: 'Amendes possibles',
            infosDescription: [
                'Tout paiement ≥ 100 000 FCFA doit être effectué par voie bancaire. Sinon, amende de 5%.',
                'Amende pour non-présentation de comptabilité : 1 000 000 FCFA par exercice.'
            ]
        });

        return infos;
    }

    private buildImpotConfig() {
        return {
            impotTitle: TPSConfig.TITLE,
            label: TPSConfig.LABEL,
            description: TPSConfig.DESCRIPTION,
            competentCenter: TPSConfig.COMPETENT_CENTER
        };
    }

    build(): GlobalEstimationInfoData {
        const suffixe = this.getSuffixeCalcul();
        
        return {
            totalEstimation: this.tpsTotale,
            totalEstimationCurrency: 'FCFA',
            contribuableRegime: `Régime TPS${suffixe}`,
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
class MoteurTPSimplifie {
    // Méthode principale avec toutes les composantes
    public static calculerTPS(input: TPSInput): TPSCalculationResult {
        return this.calculerTPSAvecOptions(input, {});
    }

    // Méthode sans contribution CCI Bénin
    public static calculerTPSWithoutCCI(input: TPSInput): TPSCalculationResult {
        return this.calculerTPSAvecOptions(input, { includeCCI: false });
    }

    // Méthode sans redevance SRTB
    public static calculerTPSWithoutRedevanceSRTB(input: TPSInput): TPSCalculationResult {
        return this.calculerTPSAvecOptions(input, { includeRedevanceSRTB: false });
    }

    // Méthode sans CCI ni redevance SRTB
    public static calculerTPSWithoutCCI_RedevanceSRTB(input: TPSInput): TPSCalculationResult {
        return this.calculerTPSAvecOptions(input, { 
            includeCCI: false, 
            includeRedevanceSRTB: false 
        });
    }

    // Méthode avec montants personnalisés
    public static calculerTPSPersonnalise(
        input: TPSInput, 
        customCCI?: number, 
        customRedevance?: number
    ): TPSCalculationResult {
        return this.calculerTPSAvecOptions(input, {
            customCCIRate: customCCI,
            customRedevance: customRedevance,
            includeCCI: customCCI !== undefined,
            includeRedevanceSRTB: customRedevance !== undefined
        });
    }

    // Méthode générique avec options
    public static calculerTPSAvecOptions(
        input: TPSInput, 
        options: TPSCalculationOptions
    ): TPSCalculationResult {
        const { chiffreAffaire, periodeFiscale, typeEntreprise } = input;
        
        // Validation de l'année
        const annee = DateUtils.extraireAnnee(periodeFiscale);
        if (annee >= 2026) {
            return TPSErrorHandler.genererErreurAnnee(chiffreAffaire, annee);
        }

        // Validation du seuil de régime
        if (chiffreAffaire > TPSConfig.SEUIL_REGIME_REEL) {
            return TPSErrorHandler.genererErreurRegimeReel(chiffreAffaire);
        }

        // Construction de la réponse avec les options spécifiées
        return new TPSResponseBuilder(chiffreAffaire, typeEntreprise, options).build();
    }
}

// Export des types et de la classe
export { TypeEntreprise, type TPSInput, type TPSCalculationOptions };
export default MoteurTPSimplifie;










































// import { GlobalEstimationInfoData } from '../../../../types/frontend.result.return.type';
// import {BackendEstimationError, BackendEstimationFailureResponse, BackendEstimationContext } from '../../../../types/frontend.errors.estomation.type';

// // Interface pour les données d'entrée
// interface TPSInput {
//     chiffreAffaire: number;
//     periodeFiscale: string;
//     typeEntreprise: TypeEntreprise;
// }

// // Enum pour le type d'entreprise
// enum TypeEntreprise {
//     ENTREPRISE_INDIVIDUELLE = 'entreprise_individuelle',
//     SOCIETE = 'societe'
// }

// // Type union pour le retour de la fonction
// export type TPSCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

// // Barème CCI Bénin pour TPS (basé sur le CGI 2025)
// const TPS_CCI_BENIN_RATES = [
//     { maxRevenue: 5000000, individual: 20000, company: 100000 },
//     { maxRevenue: 25000000, individual: 50000, company: 200000 },
//     { maxRevenue: 50000000, individual: 150000, company: 300000 },
//     { maxRevenue: 400000000, individual: 400000, company: 400000 },
//     { maxRevenue: 800000000, individual: 600000, company: 600000 },
//     { maxRevenue: 1000000000, individual: 800000, company: 800000 },
//     { maxRevenue: 2000000000, individual: 1200000, company: 1200000 },
//     { maxRevenue: 4000000000, individual: 1600000, company: 1600000 },
//     { maxRevenue: Infinity, individual: 2000000, company: 2000000 },
// ];

// class MoteurTPSimplifie {
//     private static readonly TAUX_TPS = 0.05;
//     private static readonly MONTANT_MINIMUM = 10_000;
//     private static readonly REDEVANCE_RTB = 4_000;
//     private static readonly SEUIL_REGIME_REEL = 50_000_000;

//     public static calculerTPS(input: TPSInput): TPSCalculationResult {
//         const { chiffreAffaire, periodeFiscale, typeEntreprise } = input;
        
//         // Extraire l'année de la période fiscale
//         const annee = this.extraireAnnee(periodeFiscale);
        
//         // Vérifier si l'année est 2026 ou ultérieure
//         if (annee >= 2026) {
//             return this.genererReponseErreurAnnee(chiffreAffaire, annee);
//         }

//         // Vérifier si le chiffre d'affaires dépasse le seuil pour le régime réel
//         if (chiffreAffaire > this.SEUIL_REGIME_REEL) {
//             return this.genererReponseErreurRegimeReel(chiffreAffaire);
//         }

//         // Calcul de la TPS
//         const tpsCalculee = chiffreAffaire * this.TAUX_TPS;
//         const tpsBase = Math.max(tpsCalculee, this.MONTANT_MINIMUM);

//         // Calcul de la contribution CCI selon le barème et le type d'entreprise
//         const contributionCCI = this.calculerContributionCCI(chiffreAffaire, typeEntreprise);

//         const tpsTotale = tpsBase + this.REDEVANCE_RTB + contributionCCI;

//         return {
//             totalEstimation: tpsTotale,
//             totalEstimationCurrency: 'FCFA',
//             contribuableRegime: 'Régime TPS',

//             VariableEnter: [
//                 {
//                     label: "Chiffre d'affaires annuel",
//                     description: "Montant total des ventes ou revenus encaissés durant l'année fiscale.",
//                     value: chiffreAffaire,
//                     currency: 'FCFA',
//                 }
//                 // ,
//                 // {
//                 //     label: "Type d'entreprise",
//                 //     description: "Statut juridique de l'entreprise (individuelle ou société).",
//                 //     value: typeEntreprise === TypeEntreprise.ENTREPRISE_INDIVIDUELLE ? 'Entreprise Individuelle' : 'Société',
//                 //     currency: '',
//                 // }
//             ],

//             impotDetailCalcule: [
//                 {
//                     impotTitle: 'TPS (Taxe Professionnelle Synthétique)',
//                     impotDescription: "Calculée à 5% du chiffre d'affaires annuel avec un minimum de 10 000 FCFA.",
//                     impotValue: tpsBase,
//                     impotValueCurrency: 'FCFA',
//                     impotTaux: '5%',
//                     importCalculeDescription: `TPS = max(5% du chiffre d'affaires, 10 000 FCFA) → ${tpsBase.toLocaleString('fr-FR')} FCFA`
//                 },
//                 {
//                     impotTitle: 'Redevance SRTB',
//                     impotDescription: 'Montant fixe de 4 000 FCFA ajouté à la TPS pour la radiodiffusion et télévision nationale.',
//                     impotValue: this.REDEVANCE_RTB,
//                     impotTaux: '4 000 FCFA',
//                     impotValueCurrency: 'FCFA',
//                     importCalculeDescription: 'Conformément à la loi, une redevance audiovisuelle de 4 000 FCFA est ajoutée.'
//                 },
//                 {
//                     impotTitle: 'Contribution CCI Bénin',
//                     impotDescription: `Contribution à la Chambre de Commerce et d'Industrie du Bénin selon le barème en vigueur (${this.getDescriptionBaremeCCI(chiffreAffaire, typeEntreprise)}).`,
//                     impotValue: contributionCCI,
//                     impotTaux: `${contributionCCI} FCFA : barème CCI`,
//                     impotValueCurrency: 'FCFA',
//                     importCalculeDescription: `Montant calculé selon le barème CCI pour ${typeEntreprise === TypeEntreprise.ENTREPRISE_INDIVIDUELLE ? 'entreprise individuelle' : 'société'} avec CA de ${chiffreAffaire.toLocaleString('fr-FR')} FCFA.`
//                 }
//             ],

//             obligationEcheance: [
//                 {
//                     impotTitle: 'TPS - Solde à payer',
//                     echeancePaiement: {
//                         echeancePeriodeLimite: '30 avril N+1',
//                         echeanceDescription: "Solde à verser au plus tard le 30 avril de l'année suivante."
//                     },
//                     obligationDescription: 'Le solde de la TPS est calculé après déduction des acomptes éventuels.'
//                 },
//                 {
//                     impotTitle: 'TPS - Acomptes provisionnels',
//                     echeancePaiement: [
//                         {
//                             echeancePeriodeLimite: '10 février',
//                             echeanceDescription: "Premier acompte égal à 50% de la TPS de l'année précédente."
//                         },
//                         {
//                             echeancePeriodeLimite: '10 juin',
//                             echeanceDescription: "Deuxième acompte égal à 50% de la TPS de l'année précédente."
//                         }
//                     ],
//                     obligationDescription: "Applicable sauf pour la première année d'activité."
//                 }
//             ],

//             infosSupplementaires: [
//                 {
//                     infosTitle: 'Acomptes et Solde',
//                     infosDescription: [
//                         "Deux acomptes provisionnels égaux à 50% de la TPS de l'année précédente sont exigés.",
//                         "Le solde à payer est : TPS année en cours – (acompte 1 + acompte 2)."
//                     ]
//                 },
//                 {
//                     infosTitle: 'Contribution CCI Bénin',
//                     infosDescription: [
//                         `La contribution CCI varie selon le chiffre d'affaires et le type d'entreprise.`,
//                         `Pour votre situation (${typeEntreprise === TypeEntreprise.ENTREPRISE_INDIVIDUELLE ? 'entreprise individuelle' : 'société'}, CA: ${chiffreAffaire.toLocaleString('fr-FR')} FCFA), la contribution est de ${contributionCCI.toLocaleString('fr-FR')} FCFA.`
//                     ]
//                 },
//                 {
//                     infosTitle: 'Amendes possibles',
//                     infosDescription: [
//                         'Tout paiement ≥ 100 000 FCFA doit être effectué par voie bancaire. Sinon, amende de 5%.',
//                         'Amende pour non-présentation de comptabilité : 1 000 000 FCFA par exercice.'
//                     ]
//                 }
//             ],

//             impotConfig: {
//                 impotTitle: 'Taxe Professionnelle Synthétique',
//                 label: 'TPS',
//                 description: `La TPS est égale à 5% du chiffre d'affaires annuel avec un minimum forfaitaire de 10 000 FCFA.
//                         Une redevance audiovisuelle de 4 000 FCFA est ajoutée à la TPS.
//                         Une contribution variable à la Chambre de Commerce et d'Industrie du Bénin (CCI Bénin) est également ajoutée selon le barème en vigueur.
//                         En cas de chiffre d'affaires > 50 millions FCFA, le contribuable passe au régime réel.`,
//                 competentCenter: "Centre des Impôts territorialement compétent selon l'adresse du contribuable."
//             }
//         };
//     }

//     private static calculerContributionCCI(chiffreAffaire: number, typeEntreprise: TypeEntreprise): number {
//         const cciRate = TPS_CCI_BENIN_RATES.find(rate => chiffreAffaire <= rate.maxRevenue);
        
//         if (!cciRate) {
//             // Fallback au dernier échelon
//             return typeEntreprise === TypeEntreprise.SOCIETE ? 2000000 : 2000000;
//         }

//         return typeEntreprise === TypeEntreprise.SOCIETE 
//             ? cciRate.company 
//             : cciRate.individual;
//     }

//     private static getDescriptionBaremeCCI(chiffreAffaire: number, typeEntreprise: TypeEntreprise): string {
//         const cciRate = TPS_CCI_BENIN_RATES.find(rate => chiffreAffaire <= rate.maxRevenue);
        
//         if (!cciRate) {
//             return "Échelon maximum du barème";
//         }

//         // Trouver l'échelon précédent pour définir la tranche
//         const index = TPS_CCI_BENIN_RATES.indexOf(cciRate);
//         const minRevenue = index > 0 ? TPS_CCI_BENIN_RATES[index - 1].maxRevenue + 1 : 0;
        
//         const maxRevenue = cciRate.maxRevenue === Infinity ? "et plus" : cciRate.maxRevenue.toLocaleString('fr-FR');
//         const minRevenueStr = minRevenue === 0 ? "0" : (minRevenue - 1).toLocaleString('fr-FR');
        
//         return `Tranche ${minRevenueStr} - ${maxRevenue} FCFA`;
//     }

//     private static extraireAnnee(periodeFiscale: string): number {
//         // Essayer d'extraire l'année de différents formats possibles
//         const anneeMatch = periodeFiscale.match(/(\d{4})/);
//         if (anneeMatch) {
//             return parseInt(anneeMatch[1], 10);
//         }
        
//         // Si aucune année n'est trouvée, retourner l'année courante par défaut
//         return new Date().getFullYear();
//     }

//     private static genererReponseErreurAnnee(chiffreAffaire: number, annee: number): BackendEstimationFailureResponse {
//         return {
//             success: false,
//             errors: [
//                 {
//                     code: 'CONSTANTES_NON_DISPONIBLES',
//                     message: `Les constantes de calcul de la TPS pour l'année ${annee} ne sont pas encore disponibles.`,
//                     details: `Le calcul de la Taxe Professionnelle Synthétique pour l'année ${annee} ne peut pas être effectué car les taux, montants minimums et contributions officiels n'ont pas encore été publiés par l'administration fiscale béninoise.`,
//                     severity: 'info'
//                 }
//             ],
//             context: {
//                 typeContribuable: 'Entreprise',
//                 regime: chiffreAffaire > this.SEUIL_REGIME_REEL ? 'Régime Réel' : 'Régime TPS',
//                 chiffreAffaire: chiffreAffaire,
//                 missingData: ['taux_tps', 'montant_minimum', 'redevance_rtb', 'contribution_cci']
//             },
//             timestamp: new Date().toISOString(),
//             requestId: `tps_calc_${Date.now()}`
//         };
//     }

//     private static genererReponseErreurRegimeReel(chiffreAffaire: number): BackendEstimationFailureResponse {
//         return {
//             success: false,
//             errors: [
//                 {
//                     code: 'CHIFFRE_AFFAIRES_DEPASSE_SEUIL_TPS',
//                     message: `Chiffre d'affaires supérieur au seuil du régime TPS (${this.SEUIL_REGIME_REEL.toLocaleString('fr-FR')} FCFA).`,
//                     details: `Avec un chiffre d'affaires de ${chiffreAffaire.toLocaleString('fr-FR')} FCFA, vous dépassez le seuil de ${this.SEUIL_REGIME_REEL.toLocaleString('fr-FR')} FCFA et devez obligatoirement être soumis au régime réel. Veuillez effectuer votre simulation en tant qu'Entreprise Individuelle ou Société selon votre statut juridique pour obtenir le calcul approprié de vos impôts.`,
//                     severity: 'warning'
//                 }
//             ],
//             context: {
//                 typeContribuable: 'Entreprise',
//                 regime: 'Régime Réel',
//                 chiffreAffaire: chiffreAffaire,
//                 missingData: ['regime_reel_parameters']
//             },
//             timestamp: new Date().toISOString(),
//             requestId: `tps_seuil_depasse_${Date.now()}`
//         };
//     }
// }

// // Export des types et de la classe
// export { TypeEntreprise, type TPSInput };
// export default MoteurTPSimplifie;
