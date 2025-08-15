import { BackendEstimationFailureResponse } from "@/types/frontend.errors.estomation.type";
import { GlobalEstimationInfoData } from "@/types/frontend.result.return.type";

// Énumérations pour classer tous les secteurs IBA
export enum TypeActivite {
    // Secteurs avec taux ou minimums spécifiques
    ENSEIGNEMENT_PRIVE = 'enseignement-prive',        // taux réduit 25%
    INDUSTRIE = 'industrie',                          // ex: transformation, fabrication
    BTP = 'batiment-travaux-publics',                 // minimum 3%
    IMMOBILIER = 'immobilier',                        // minimum 10%
    STATIONS_SERVICES = 'stations-services',          // minimum par litre
    ARTISANAT = 'artisanat',                          // réduction possible 50%
    // Autres catégories du CGI
    AGRICULTURE = 'agriculture',                      // soumis sauf si exonéré art. 58
    PECHE = 'peche',                                  // idem
    ELEVAGE = 'elevage',                              // idem
    CHERCHEUR_VARIETE = 'chercheur-variete-vegetale', // obtenteurs nouvelles variétés
    PROFESSION_LIBERALE = 'profession-liberale',      // avocats, médecins, etc.
    CHARGES_OFFICES = 'charges-offices',              // notaires, huissiers hors commerçants
    PROPRIETE_INTELLECTUELLE = 'propriete-intellectuelle', // brevets, droits d'auteur
    LOCATION_ETABLISSEMENT = 'location-etablissement-commercial', 
    INTERMEDIAIRE_IMMO = 'intermediaire-immobilier', 
    ACHAT_REVENTE_IMMO = 'achat-revente-immobilier',
    LOTISSEMENT_TERRAIN = 'lotissement-terrain',
    // Par défaut
    AUTRE = 'autre'
}

// Conditions pour réductions spécifiques
export enum ConditionsReduction {
    ARTISANALE = 'artisanale', // réduction 50% si conditions remplies
    NORMALE = 'normale'
}

interface IBAInput {
    chiffreAffaire: number;
    charges: number;
    secteur: TypeActivite;
    conditionsReduction?: ConditionsReduction;
    periodeFiscale: string;
    nbrLitreAnnee?: number; // Nouveau paramètre pour le volume de carburant (stations-services)
}



export type IBACalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

// Types pour les règles sectorielles
interface RegleSecteurBase {
    taux?: number;
    min?: number;
}

interface RegleSecteurPourcentage extends RegleSecteurBase {
    minPourcent: number;
}

interface RegleSecteurStations {
    tauxParLitre: number;
    min: number;
}

interface RegleSecteurArtisanat extends RegleSecteurBase {
    reductionArtisanale: number;
}

type RegleSecteur = RegleSecteurBase | RegleSecteurPourcentage | RegleSecteurStations | RegleSecteurArtisanat;

class MoteurIBA {
    // Constantes réglementaires générales
    private static readonly CONSTANTES = {
        TAUX_GENERAL: 0.30,                    // τg - taux général
        MINIMUM_GENERAL_POURCENT: 0.015,       // τmin - minimum général en %
        MINIMUM_ABSOLU_GENERAL: 500_000,       // Mg - minimum absolu général
        REDEVANCE_ORTB: 4_000,                 // RORTB
        FACTEUR_REDUCTION_ARTISANALE: 0.5      // Réduction 50% pour artisans
    } as const;

    // Règles spécifiques par secteur d'activité
    private static readonly REGLES_SECTEUR: Record<TypeActivite, RegleSecteur> = {
        [TypeActivite.ENSEIGNEMENT_PRIVE]: { taux: 0.25, min: 500_000 },
        [TypeActivite.INDUSTRIE]: { taux: 0.25, min: 500_000 },
        [TypeActivite.BTP]: { taux: 0.30, minPourcent: 0.03 },
        [TypeActivite.IMMOBILIER]: { taux: 0.30, minPourcent: 0.10 },
        [TypeActivite.STATIONS_SERVICES]: { tauxParLitre: 0.60, min: 250_000 },
        [TypeActivite.ARTISANAT]: { taux: 0.30, reductionArtisanale: 0.5 },
        [TypeActivite.AGRICULTURE]: { taux: 0.30, min: 500_000 },
        [TypeActivite.PECHE]: { taux: 0.30, min: 500_000 },
        [TypeActivite.ELEVAGE]: { taux: 0.30, min: 500_000 },
        [TypeActivite.CHERCHEUR_VARIETE]: { taux: 0.30, min: 500_000 },
        [TypeActivite.PROFESSION_LIBERALE]: { taux: 0.30, min: 500_000 },
        [TypeActivite.CHARGES_OFFICES]: { taux: 0.30, min: 500_000 },
        [TypeActivite.PROPRIETE_INTELLECTUELLE]: { taux: 0.30, min: 500_000 },
        [TypeActivite.LOCATION_ETABLISSEMENT]: { taux: 0.30, min: 500_000 },
        [TypeActivite.INTERMEDIAIRE_IMMO]: { taux: 0.30, min: 500_000 },
        [TypeActivite.ACHAT_REVENTE_IMMO]: { taux: 0.30, min: 500_000 },
        [TypeActivite.LOTISSEMENT_TERRAIN]: { taux: 0.30, min: 500_000 },
        [TypeActivite.AUTRE]: { taux: 0.30, min: 500_000 }
    } as const;

    public static calculerIBA(input: IBAInput): IBACalculationResult {
        try {
            // Validation des entrées
            if (input.chiffreAffaire <= 0) {
                return this.genererReponseErreurValidation('Le chiffre d\'affaires doit être positif');
            }

            if (input.charges < 0) {
                return this.genererReponseErreurValidation('Les charges ne peuvent pas être négatives');
            }

            // Validation spécifique pour les stations-services
            if (input.secteur === TypeActivite.STATIONS_SERVICES && (!input.nbrLitreAnnee || input.nbrLitreAnnee <= 0)) {
                return this.genererReponseErreurValidation('Le nombre de litres vendus annuellement est requis et doit être positif pour les stations-services');
            }

            // Extraire l'année de la période fiscale
            const annee = this.extraireAnnee(input.periodeFiscale);
            
            // Vérifier si l'année est 2026 ou ultérieure
            if (annee >= 2026) {
                return this.genererReponseErreur(input, annee);
            }

            // Calculer le bénéfice imposable
            const beneficeImposable = Math.max(0, input.chiffreAffaire - input.charges);
            
            // Déterminer les taux et seuils selon le secteur
            const reglesSecteur = this.REGLES_SECTEUR[input.secteur];
            const tauxPrincipal = this.obtenirTauxPrincipal(reglesSecteur);
            
            // Calculer l'impôt nominal
            let impotNominal = beneficeImposable * tauxPrincipal;
            
            // Calculer l'impôt minimum sectoriel
            const impotMinimumSectoriel = this.calculerImpotMinimumSectoriel(input.secteur, input.chiffreAffaire, input.nbrLitreAnnee);
            
            // Déterminer l'impôt minimum absolu selon le secteur
            const minimumAbsolu = this.obtenirMinimumAbsolu(reglesSecteur);
            
            // Calculer l'impôt de base (maximum des trois)
            const impotBase = Math.max(impotNominal, impotMinimumSectoriel, minimumAbsolu);
            
            // Déterminer les conditions de réduction
            const conditionsReduction = this.determinerConditionsReduction(input);
            
            // Appliquer les réductions
            const facteurReduction = this.obtenirFacteurReduction(conditionsReduction, input.secteur);
            let impotApresReduction = impotBase * facteurReduction;
            
            // Ajouter la redevance ORTB si applicable
            const redevanceORTB = this.CONSTANTES.REDEVANCE_ORTB;
            const impotFinal = Math.round(impotApresReduction + redevanceORTB);

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

            // Ajouter le volume de litres pour les stations-services
            if (input.secteur === TypeActivite.STATIONS_SERVICES && input.nbrLitreAnnee) {
                variablesEnter.push({
                    label: "Volume de carburant vendu",
                    description: "Nombre de litres vendus dans l'année",
                    value: input.nbrLitreAnnee,
                    currency: 'litres'
                });
            }

            // Préparer les détails de calcul
            const impotDetailCalcule = [];

            // IBA principal
            impotDetailCalcule.push({
                impotTitle: 'Impôt sur le Bénéfice d\'Affaire (IBA) - Base',
                impotDescription: `Calculé selon le taux de ${(tauxPrincipal * 100).toFixed(1)}% applicable au secteur ${input.secteur}`,
                impotValue: Math.round(impotBase),
                impotValueCurrency: 'FCFA',
                impotTaux: `${(tauxPrincipal * 100).toFixed(1)}%`,
                importCalculeDescription: this.genererDescriptionCalculBase(
                    impotNominal, impotMinimumSectoriel, minimumAbsolu, impotBase, tauxPrincipal, input.secteur, input.nbrLitreAnnee
                )
            });

            // Réduction artisanale si applicable
            if (conditionsReduction === ConditionsReduction.ARTISANALE) {
                const montantReduction = impotBase - impotApresReduction;
                impotDetailCalcule.push({
                    impotTitle: 'Réduction artisanale',
                    impotDescription: 'Réduction de 50% de l\'IBA pour activité artisanale avec famille',
                    impotValue: Math.round(montantReduction),
                    impotValueCurrency: 'FCFA',
                    impotTaux: '50%',
                    importCalculeDescription: `Réduction = ${Math.round(impotBase).toLocaleString('fr-FR')} FCFA × 50% = ${Math.round(montantReduction).toLocaleString('fr-FR')} FCFA`
                });
            }

            // Redevance ORTB
            if (redevanceORTB > 0) {
                impotDetailCalcule.push({
                    impotTitle: 'Redevance ORTB',
                    impotDescription: 'Redevance forfaitaire pour l\'Office de Radiodiffusion et Télévision du Bénin',
                    impotValue: redevanceORTB,
                    impotValueCurrency: 'FCFA',
                    impotTaux: 'Forfait',
                    importCalculeDescription: `Redevance ORTB = ${redevanceORTB.toLocaleString('fr-FR')} FCFA (forfait)`
                });
            }

            return {
                totalEstimation: impotFinal,
                totalEstimationCurrency: 'FCFA',
                contribuableRegime: `IBA (Impôt sur le Bénéfice d'Affaire)${conditionsReduction === ConditionsReduction.ARTISANALE ? ' - Régime Artisanal' : ''}`,

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
                        infosDescription: this.genererInfosTauxSecteurs()
                    },
                    {
                        infosTitle: 'Impôt minimum et calcul de base',
                        infosDescription: [
                            "L'IBA est calculé comme le maximum de :",
                            "- L'impôt nominal (bénéfice × taux sectoriel)",
                            "- L'impôt minimum sectoriel (CA × taux minimum)",
                            "- L'impôt minimum absolu (500 000 FCFA général, 250 000 FCFA stations-services)",
                            "Une redevance ORTB de 4 000 FCFA s'ajoute au montant final."
                        ]
                    },
                    {
                        infosTitle: 'Réductions et avantages',
                        infosDescription: [
                            "Réduction de 50% de l'IBA pour les artisans travaillant avec leur famille.",
                            "Cette réduction s'applique sur l'impôt de base avant ajout de la redevance ORTB.",
                            "Les conditions d'éligibilité doivent être vérifiées auprès de l'administration fiscale.",
                            "Possibilité de report des déficits sur les exercices suivants."
                        ]
                    },
                    {
                        infosTitle: 'Calcul spécifique stations-services',
                        infosDescription: [
                            "Pour les stations-services, l'impôt minimum est calculé selon :",
                            "- 0,60 FCFA par litre de carburant vendu dans l'année",
                            "- Minimum absolu de 250 000 FCFA",
                            "Le volume de carburant vendu doit être déclaré précisément."
                        ]
                    }
                ],

                impotConfig: {
                    impotTitle: 'Impôt sur le Bénéfice d\'Affaire (IBA)',
                    label: 'IBA',
                    description: `L'Impôt sur le Bénéfice d'Affaire est un impôt direct calculé sur le bénéfice imposable des entrepreneurs individuels.
                            Le taux varie selon le secteur d'activité. L'impôt final est le maximum entre l'impôt nominal, l'impôt minimum sectoriel et l'impôt minimum absolu.
                            Une réduction de 50% s'applique aux artisans travaillant avec leur famille.
                            Pour les stations-services, l'impôt minimum est calculé sur la base du volume de carburant vendu (0,60 FCFA/litre).
                            Une redevance ORTB de 4 000 FCFA s'ajoute au montant calculé.`,
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

    private static obtenirTauxPrincipal(regles: RegleSecteur): number {
        if ('taux' in regles && regles.taux !== undefined) {
            return regles.taux;
        }
        return this.CONSTANTES.TAUX_GENERAL;
    }

    private static obtenirMinimumAbsolu(regles: RegleSecteur): number {
        if ('min' in regles && regles.min !== undefined) {
            return regles.min;
        }
        return this.CONSTANTES.MINIMUM_ABSOLU_GENERAL;
    }

    private static calculerImpotMinimumSectoriel(secteur: TypeActivite, chiffreAffaire: number, nbrLitreAnnee?: number): number {
        const regles = this.REGLES_SECTEUR[secteur];
        
        if ('minPourcent' in regles) {
            // Secteurs avec minimum en pourcentage du CA (BTP, Immobilier)
            return chiffreAffaire * regles.minPourcent;
        }
        
        if ('tauxParLitre' in regles && secteur === TypeActivite.STATIONS_SERVICES) {
            // Stations-services : calcul basé sur le volume en litres
            if (nbrLitreAnnee && nbrLitreAnnee > 0) {
                return nbrLitreAnnee * regles.tauxParLitre;
            }
            // Si pas de volume fourni, utiliser le minimum général comme fallback
            console.warn('Stations-services : volume en litres manquant, utilisation du minimum général');
            return chiffreAffaire * this.CONSTANTES.MINIMUM_GENERAL_POURCENT;
        }
        
        // Minimum général pour les autres secteurs
        return chiffreAffaire * this.CONSTANTES.MINIMUM_GENERAL_POURCENT;
    }

    private static determinerConditionsReduction(input: IBAInput): ConditionsReduction {
        // Si explicitement défini dans l'input
        if (input.conditionsReduction) {
            return input.conditionsReduction;
        }
        
        // Auto-détection pour secteur artisanat
        if (input.secteur === TypeActivite.ARTISANAT) {
            return ConditionsReduction.ARTISANALE;
        }
        
        return ConditionsReduction.NORMALE;
    }

    private static obtenirFacteurReduction(conditions: ConditionsReduction, secteur: TypeActivite): number {
        if (conditions === ConditionsReduction.ARTISANALE) {
            const regles = this.REGLES_SECTEUR[secteur];
            if ('reductionArtisanale' in regles) {
                return regles.reductionArtisanale;
            }
            return this.CONSTANTES.FACTEUR_REDUCTION_ARTISANALE;
        }
        return 1.0;
    }

    private static genererInfosTauxSecteurs(): string[] {
        const infos = [];
        
        // Secteurs avec taux spéciaux
        infos.push(`Enseignement privé : 25%`);
        infos.push(`Industrie : 25%`);
        infos.push(`Autres secteurs : 30%`);
        infos.push(``);
        infos.push(`Minimums sectoriels :`);
        infos.push(`- BTP : 3% du CA`);
        infos.push(`- Immobilier : 10% du CA`);
        infos.push(`- Stations-services : 0,60 FCFA/litre`);
        infos.push(`- Autres : 1,5% du CA`);
        infos.push(``);
        infos.push(`Minimums absolus :`);
        infos.push(`- Général : 500 000 FCFA`);
        infos.push(`- Stations-services : 250 000 FCFA`);
        
        return infos;
    }

    private static genererDescriptionCalculBase(
        impotNominal: number, 
        impotMinimumSectoriel: number, 
        minimumAbsolu: number, 
        impotBase: number,
        tauxPrincipal: number,
        secteur: TypeActivite,
        nbrLitreAnnee?: number
    ): string {
        const regles = this.REGLES_SECTEUR[secteur];
        let descriptionMinimum = '';
        
        if ('minPourcent' in regles) {
            descriptionMinimum = `${(regles.minPourcent * 100).toFixed(1)}% du CA`;
        } else if ('tauxParLitre' in regles && secteur === TypeActivite.STATIONS_SERVICES) {
            if (nbrLitreAnnee && nbrLitreAnnee > 0) {
                descriptionMinimum = `${nbrLitreAnnee.toLocaleString('fr-FR')} litres × ${regles.tauxParLitre} FCFA/litre`;
            } else {
                descriptionMinimum = `${regles.tauxParLitre} FCFA/litre (volume non fourni, fallback : ${(this.CONSTANTES.MINIMUM_GENERAL_POURCENT * 100).toFixed(1)}% du CA)`;
            }
        } else {
            descriptionMinimum = `${(this.CONSTANTES.MINIMUM_GENERAL_POURCENT * 100).toFixed(1)}% du CA`;
        }
        
        const descriptions = [
            `Impôt nominal = ${Math.round(impotNominal).toLocaleString('fr-FR')} FCFA (${(tauxPrincipal * 100).toFixed(1)}%)`,
            `Impôt minimum sectoriel = ${Math.round(impotMinimumSectoriel).toLocaleString('fr-FR')} FCFA (${descriptionMinimum})`,
            `Minimum absolu = ${minimumAbsolu.toLocaleString('fr-FR')} FCFA`
        ];
        
        return `IBA base = MAX(${descriptions.join(', ')}) = ${Math.round(impotBase).toLocaleString('fr-FR')} FCFA`;
    }

    private static extraireAnnee(periodeFiscale: string): number {
        const anneeMatch = periodeFiscale.match(/(\d{4})/);
        if (anneeMatch) {
            return parseInt(anneeMatch[1], 10);
        }
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
                chiffreAffaire: input.chiffreAffaire,
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
