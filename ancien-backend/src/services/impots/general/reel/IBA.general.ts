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

// Interface pour les options de calcul
interface IBACalculationOptions {
    includeRedevanceSRTB?: boolean;
    includeReductionArtisanale?: boolean;
    customRedevanceSRTB?: number;
    customReductionArtisanale?: number;
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

// Configuration de l'impôt IBA
class IBAConfig {
    static readonly TAUX_GENERAL = 0.30;                    // τg - taux général
    static readonly MINIMUM_GENERAL_POURCENT = 0.015;       // τmin - minimum général en %
    static readonly MINIMUM_ABSOLU_GENERAL = 500_000;       // Mg - minimum absolu général
    static readonly REDEVANCE_SRTB = 4_000;                 // RSRTB
    static readonly FACTEUR_REDUCTION_ARTISANALE = 0.5;     // Réduction 50% pour artisans
    
    static readonly TITLE = 'Impôt sur le Bénéfice d\'Affaire (IBA)';
    static readonly LABEL = 'IBA';
    static readonly DESCRIPTION = `L'Impôt sur le Bénéfice d'Affaire est un impôt direct calculé sur le bénéfice imposable des entrepreneurs individuels.
            Le taux varie selon le secteur d'activité. L'impôt final est le maximum entre l'impôt nominal, l'impôt minimum sectoriel et l'impôt minimum absolu.
            Une réduction de 50% s'applique aux artisans travaillant avec leur famille.
            Pour les stations-services, l'impôt minimum est calculé sur la base du volume de carburant vendu (0,60 FCFA/litre).
            Une redevance SRTB de 4 000 FCFA s'ajoute au montant calculé.`;
    static readonly COMPETENT_CENTER = "Centre des Impôts des Petites Entreprises (CIPE) de votre ressort territorial.";
}

// Classe pour la gestion des erreurs
class IBAErrorHandler {
    static genererErreurAnnee(input: IBAInput, annee: number): BackendEstimationFailureResponse {
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

    static genererErreurValidation(message: string): BackendEstimationFailureResponse {
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

// Builder pour construire la réponse de manière modulaire
class IBAResponseBuilder {
    private input: IBAInput;
    private options: IBACalculationOptions;
    private beneficeImposable: number = 0;
    private impotBase: number = 0;
    private impotApresReduction: number = 0;
    private redevanceSRTB: number = 0;
    private impotFinal: number = 0;
    private tauxPrincipal: number = 0;
    private impotNominal: number = 0;
    private impotMinimumSectoriel: number = 0;
    private minimumAbsolu: number = 0;
    private conditionsReduction: ConditionsReduction = ConditionsReduction.NORMALE;

    constructor(input: IBAInput, options: IBACalculationOptions = {}) {
        this.input = input;
        this.options = {
            includeRedevanceSRTB: true,
            includeReductionArtisanale: true,
            ...options
        };
        
        this.initializeCalculations();
    }

    private initializeCalculations() {
        // Calculer le bénéfice imposable
        this.beneficeImposable = Math.max(0, this.input.chiffreAffaire - this.input.charges);
        
        // Déterminer les taux et seuils selon le secteur
        const reglesSecteur = this.getReglesSecteur();
        this.tauxPrincipal = this.obtenirTauxPrincipal(reglesSecteur);
        
        // Calculer l'impôt nominal
        this.impotNominal = this.beneficeImposable * this.tauxPrincipal;
        
        // Calculer l'impôt minimum sectoriel
        this.impotMinimumSectoriel = this.calculerImpotMinimumSectoriel();
        
        // Déterminer l'impôt minimum absolu selon le secteur
        this.minimumAbsolu = this.obtenirMinimumAbsolu(reglesSecteur);
        
        // Calculer l'impôt de base (maximum des trois)
        this.impotBase = Math.max(this.impotNominal, this.impotMinimumSectoriel, this.minimumAbsolu);
        
        // Déterminer les conditions de réduction
        this.conditionsReduction = this.determinerConditionsReduction();
        
        // Appliquer les réductions
        const facteurReduction = this.obtenirFacteurReduction();
        this.impotApresReduction = this.impotBase * facteurReduction;
        
        // Ajouter la redevance SRTB si applicable
        this.redevanceSRTB = this.options.includeRedevanceSRTB ? 
            (this.options.customRedevanceSRTB ?? IBAConfig.REDEVANCE_SRTB) : 0;
        
        this.impotFinal = Math.round(this.impotApresReduction + this.redevanceSRTB);
    }

    private getReglesSecteur(): RegleSecteur {
        return REGLES_SECTEUR[this.input.secteur];
    }

    private obtenirTauxPrincipal(regles: RegleSecteur): number {
        if ('taux' in regles && regles.taux !== undefined) {
            return regles.taux;
        }
        return IBAConfig.TAUX_GENERAL;
    }

    private obtenirMinimumAbsolu(regles: RegleSecteur): number {
        if ('min' in regles && regles.min !== undefined) {
            return regles.min;
        }
        return IBAConfig.MINIMUM_ABSOLU_GENERAL;
    }

    private calculerImpotMinimumSectoriel(): number {
        const regles = this.getReglesSecteur();
        
        if ('minPourcent' in regles) {
            // Secteurs avec minimum en pourcentage du CA (BTP, Immobilier)
            return this.input.chiffreAffaire * regles.minPourcent;
        }
        
        if ('tauxParLitre' in regles && this.input.secteur === TypeActivite.STATIONS_SERVICES) {
            // Stations-services : calcul basé sur le volume en litres
            if (this.input.nbrLitreAnnee && this.input.nbrLitreAnnee > 0) {
                return this.input.nbrLitreAnnee * regles.tauxParLitre;
            }
            // Si pas de volume fourni, utiliser le minimum général comme fallback
            console.warn('Stations-services : volume en litres manquant, utilisation du minimum général');
            return this.input.chiffreAffaire * IBAConfig.MINIMUM_GENERAL_POURCENT;
        }
        
        // Minimum général pour les autres secteurs
        return this.input.chiffreAffaire * IBAConfig.MINIMUM_GENERAL_POURCENT;
    }

    private determinerConditionsReduction(): ConditionsReduction {
        // Si explicitement défini dans l'input
        if (this.input.conditionsReduction) {
            return this.input.conditionsReduction;
        }
        
        // Auto-détection pour secteur artisanat
        if (this.input.secteur === TypeActivite.ARTISANAT) {
            return ConditionsReduction.ARTISANALE;
        }
        
        return ConditionsReduction.NORMALE;
    }

    private obtenirFacteurReduction(): number {
        if (this.conditionsReduction === ConditionsReduction.ARTISANALE && this.options.includeReductionArtisanale) {
            const regles = this.getReglesSecteur();
            if ('reductionArtisanale' in regles) {
                return this.options.customReductionArtisanale ?? regles.reductionArtisanale;
            }
            return this.options.customReductionArtisanale ?? IBAConfig.FACTEUR_REDUCTION_ARTISANALE;
        }
        return 1.0;
    }

    private buildVariablesEnter() {
        const variables = [
            {
                label: "Chiffre d'affaires",
                description: "Revenus totaux de l'activité",
                value: this.input.chiffreAffaire,
                currency: 'FCFA'
            },
            {
                label: "Charges déductibles",
                description: "Charges et dépenses déductibles du bénéfice imposable",
                value: this.input.charges,
                currency: 'FCFA'
            },
            {
                label: "Bénéfice imposable",
                description: "Différence entre revenus et charges",
                value: this.beneficeImposable,
                currency: 'FCFA'
            }
        ];

        // Ajouter le volume de litres pour les stations-services
        if (this.input.secteur === TypeActivite.STATIONS_SERVICES && this.input.nbrLitreAnnee) {
            variables.push({
                label: "Volume de carburant vendu",
                description: "Nombre de litres vendus dans l'année",
                value: this.input.nbrLitreAnnee,
                currency: 'litres'
            });
        }

        if (this.options.includeRedevanceSRTB && this.redevanceSRTB > 0) {
            variables.push({
                label: "Redevance SRTB",
                description: "Redevance forfaitaire pour l'Office de Radiodiffusion et Télévision du Bénin",
                value: this.redevanceSRTB,
                currency: 'FCFA'
            });
        }

        return variables;
    }

    private buildImpotDetailCalcule() {
        const details = [];

        // IBA principal
        details.push({
            impotTitle: 'Impôt sur le Bénéfice d\'Affaire (IBA) - Base',
            impotDescription: `Calculé selon le taux de ${(this.tauxPrincipal * 100).toFixed(1)}% applicable au secteur ${this.input.secteur}`,
            impotValue: Math.round(this.impotBase),
            impotValueCurrency: 'FCFA',
            impotTaux: `${(this.tauxPrincipal * 100).toFixed(1)}%`,
            importCalculeDescription: this.genererDescriptionCalculBase()
        });

        // Réduction artisanale si applicable
        if (this.conditionsReduction === ConditionsReduction.ARTISANALE && this.options.includeReductionArtisanale) {
            const montantReduction = this.impotBase - this.impotApresReduction;
            details.push({
                impotTitle: 'Réduction artisanale',
                impotDescription: 'Réduction de 50% de l\'IBA pour activité artisanale avec famille',
                impotValue: Math.round(montantReduction),
                impotValueCurrency: 'FCFA',
                impotTaux: '50%',
                importCalculeDescription: `Réduction = ${Math.round(this.impotBase).toLocaleString('fr-FR')} FCFA × 50% = ${Math.round(montantReduction).toLocaleString('fr-FR')} FCFA`
            });
        }

        // Redevance SRTB
        if (this.options.includeRedevanceSRTB && this.redevanceSRTB > 0) {
            details.push({
                impotTitle: 'Redevance SRTB',
                impotDescription: `Redevance ${this.options.customRedevanceSRTB ? 'personnalisée' : 'forfaitaire'} pour l'Office de Radiodiffusion et Télévision du Bénin`,
                impotValue: this.redevanceSRTB,
                impotValueCurrency: 'FCFA',
                impotTaux: this.options.customRedevanceSRTB ? 'Personnalisée' : 'Forfait',
                importCalculeDescription: `Redevance SRTB = ${this.redevanceSRTB.toLocaleString('fr-FR')} FCFA (${this.options.customRedevanceSRTB ? 'personnalisée' : 'forfait'})`
            });
        }

        return details;
    }

    private buildObligationEcheance() {
        return [
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
        ];
    }

    private buildInfosSupplementaires() {
        const infos = [
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
                    this.options.includeRedevanceSRTB ? "Une redevance SRTB s'ajoute au montant final." : "Aucune redevance SRTB n'est incluse dans ce calcul."
                ]
            }
        ];

        if (this.options.includeReductionArtisanale) {
            infos.push({
                infosTitle: 'Réductions et avantages',
                infosDescription: [
                    "Réduction de 50% de l'IBA pour les artisans travaillant avec leur famille.",
                    "Cette réduction s'applique sur l'impôt de base avant ajout de la redevance SRTB.",
                    "Les conditions d'éligibilité doivent être vérifiées auprès de l'administration fiscale.",
                    "Possibilité de report des déficits sur les exercices suivants."
                ]
            });
        }

        if (this.options.includeRedevanceSRTB && this.redevanceSRTB > 0) {
            infos.push({
                infosTitle: 'Redevance SRTB',
                infosDescription: [
                    `La redevance SRTB de ${this.redevanceSRTB.toLocaleString('fr-FR')} FCFA est ${this.options.customRedevanceSRTB ? 'personnalisée' : 'fixe et obligatoire'}.`,
                    "Elle finance l'Office de Radiodiffusion et Télévision du Bénin."
                ]
            });
        }

        if (!this.options.includeRedevanceSRTB && !this.options.includeReductionArtisanale) {
            infos.push({
                infosTitle: 'Calcul simplifié',
                infosDescription: [
                    'Ce calcul n\'inclut ni la redevance SRTB ni les réductions artisanales.',
                    'Le montant total correspond uniquement à l\'IBA de base.'
                ]
            });
        }

        infos.push({
            infosTitle: 'Calcul spécifique stations-services',
            infosDescription: [
                "Pour les stations-services, l'impôt minimum est calculé selon :",
                "- 0,60 FCFA par litre de carburant vendu dans l'année",
                "- Minimum absolu de 250 000 FCFA",
                "Le volume de carburant vendu doit être déclaré précisément."
            ]
        });

        return infos;
    }

    private buildImpotConfig() {
        return {
            impotTitle: IBAConfig.TITLE,
            label: IBAConfig.LABEL,
            description: IBAConfig.DESCRIPTION,
            competentCenter: IBAConfig.COMPETENT_CENTER,
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
        };
    }

    private genererDescriptionCalculBase(): string {
        const regles = this.getReglesSecteur();
        let descriptionMinimum = '';
        
        if ('minPourcent' in regles) {
            descriptionMinimum = `${(regles.minPourcent * 100).toFixed(1)}% du CA`;
        } else if ('tauxParLitre' in regles && this.input.secteur === TypeActivite.STATIONS_SERVICES) {
            if (this.input.nbrLitreAnnee && this.input.nbrLitreAnnee > 0) {
                descriptionMinimum = `${this.input.nbrLitreAnnee.toLocaleString('fr-FR')} litres × ${regles.tauxParLitre} FCFA/litre`;
            } else {
                descriptionMinimum = `${regles.tauxParLitre} FCFA/litre (volume non fourni, fallback : ${(IBAConfig.MINIMUM_GENERAL_POURCENT * 100).toFixed(1)}% du CA)`;
            }
        } else {
            descriptionMinimum = `${(IBAConfig.MINIMUM_GENERAL_POURCENT * 100).toFixed(1)}% du CA`;
        }
        
        const descriptions = [
            `Impôt nominal = ${Math.round(this.impotNominal).toLocaleString('fr-FR')} FCFA (${(this.tauxPrincipal * 100).toFixed(1)}%)`,
            `Impôt minimum sectoriel = ${Math.round(this.impotMinimumSectoriel).toLocaleString('fr-FR')} FCFA (${descriptionMinimum})`,
            `Minimum absolu = ${this.minimumAbsolu.toLocaleString('fr-FR')} FCFA`
        ];
        
        return `IBA base = MAX(${descriptions.join(', ')}) = ${Math.round(this.impotBase).toLocaleString('fr-FR')} FCFA`;
    }

    private genererInfosTauxSecteurs(): string[] {
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

    build(): GlobalEstimationInfoData {
        const suffixe = this.getSuffixeCalcul();
        
        return {
            totalEstimation: this.impotFinal,
            totalEstimationCurrency: 'FCFA',
            contribuableRegime: `Régime IBA${suffixe}`,
            VariableEnter: this.buildVariablesEnter(),
            impotDetailCalcule: this.buildImpotDetailCalcule(),
            obligationEcheance: this.buildObligationEcheance(),
            infosSupplementaires: this.buildInfosSupplementaires(),
            impotConfig: this.buildImpotConfig()
        };
    }

    private getSuffixeCalcul(): string {
        if (!this.options.includeRedevanceSRTB && !this.options.includeReductionArtisanale) {
            return ' (Base uniquement)';
        } else if (!this.options.includeRedevanceSRTB) {
            return ' (Sans SRTB)';
        } else if (!this.options.includeReductionArtisanale) {
            return ' (Sans réduction)';
        } else if (this.options.customRedevanceSRTB || this.options.customReductionArtisanale) {
            return ' (Personnalisé)';
        }
        return '';
    }
}

// Règles spécifiques par secteur d'activité (déplacées en dehors de la classe)
const REGLES_SECTEUR: Record<TypeActivite, RegleSecteur> = {
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

// Utilitaire pour l'extraction d'année
class DateUtils {
    static extraireAnnee(periodeFiscale: string): number {
        const anneeMatch = periodeFiscale.match(/(\d{4})/);
        return anneeMatch ? parseInt(anneeMatch[1], 10) : new Date().getFullYear();
    }
}

// Classe principale avec méthodes spécialisées
class MoteurIBA {
    // Méthode principale avec toutes les composantes
    public static calculerIBA(input: IBAInput): IBACalculationResult {
        return this.calculerIBAvecOptions(input, {});
    }

    // Méthode sans redevance SRTB
    public static calculerIBAWithoutRedevanceSRTB(input: IBAInput): IBACalculationResult {
        return this.calculerIBAvecOptions(input, { includeRedevanceSRTB: false });
    }

    // Méthode sans réduction artisanale
    public static calculerIBAWithoutReductionArtisanale(input: IBAInput): IBACalculationResult {
        return this.calculerIBAvecOptions(input, { includeReductionArtisanale: false });
    }

    // Méthode sans SRTB ni réduction artisanale
    public static calculerIBAWithoutSRTB_ReductionArtisanale(input: IBAInput): IBACalculationResult {
        return this.calculerIBAvecOptions(input, { 
            includeRedevanceSRTB: false, 
            includeReductionArtisanale: false 
        });
    }

    // Méthode avec montants personnalisés
    public static calculerIBAPersonnalise(
        input: IBAInput, 
        customRedevanceSRTB?: number, 
        customReductionArtisanale?: number
    ): IBACalculationResult {
        return this.calculerIBAvecOptions(input, {
            customRedevanceSRTB: customRedevanceSRTB,
            customReductionArtisanale: customReductionArtisanale,
            includeRedevanceSRTB: customRedevanceSRTB !== undefined,
            includeReductionArtisanale: customReductionArtisanale !== undefined
        });
    }

    // Méthode générique avec options
    public static calculerIBAvecOptions(
        input: IBAInput, 
        options: IBACalculationOptions
    ): IBACalculationResult {
        try {
            // Validation des entrées
            if (input.chiffreAffaire <= 0) {
                return IBAErrorHandler.genererErreurValidation('Le chiffre d\'affaires doit être positif');
            }

            if (input.charges < 0) {
                return IBAErrorHandler.genererErreurValidation('Les charges ne peuvent pas être négatives');
            }

            // Validation spécifique pour les stations-services
            if (input.secteur === TypeActivite.STATIONS_SERVICES && (!input.nbrLitreAnnee || input.nbrLitreAnnee <= 0)) {
                return IBAErrorHandler.genererErreurValidation('Le nombre de litres vendus annuellement est requis et doit être positif pour les stations-services');
            }

            // Extraire l'année de la période fiscale
            const annee = DateUtils.extraireAnnee(input.periodeFiscale);
            
            // Vérifier si l'année est 2026 ou ultérieure
            if (annee >= 2026) {
                return IBAErrorHandler.genererErreurAnnee(input, annee);
            }

            // Construction de la réponse avec les options spécifiées
            return new IBAResponseBuilder(input, options).build();
        } catch (error) {
            return IBAErrorHandler.genererErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de l\'IBA');
        }
    }
}

export default MoteurIBA;
