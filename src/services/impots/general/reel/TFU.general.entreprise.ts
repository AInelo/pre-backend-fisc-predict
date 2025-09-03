import { BackendEstimationFailureResponse } from "@/types/frontend.errors.estomation.type";
import { GlobalEstimationInfoData, VariableEnter, ImpotDetailCalcule } from "@/types/frontend.result.return.type";


interface TFUEntrepriseInput {
    possessionProprietes: boolean;
    NbrProprietes: number;
    proprietes: ProprieteInformation[];
    periodeFiscale: string;
}

interface ProprieteInformation {
    ville: string;
    valeurLocative: number;
    proprieteBatie: boolean;
    tauxTfu: number;
}

// Options de calcul pour TFU Entreprise
interface TFUEntrepriseCalculationOptions {
    includeDetailsParPropriete?: boolean; // inclure les lignes détaillées par propriété (true par défaut)
    customTauxParVille?: Record<string, number>; // permet de surcharger les taux par ville
}

export type TFUEntrepriseCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

// Configuration centrale
class TFUEntrepriseConfig {
    static readonly TITLE = 'Taxe Foncière Urbaine - Entreprises';
    static readonly LABEL = 'TFU Entreprise';
    static readonly DESCRIPTION = `La TFU pour les entreprises est calculée selon la valeur locative de chaque propriété et les taux en vigueur.
            Le calcul prend en compte le nombre de propriétés et applique les taux spécifiques à chaque bien.
            Les entreprises ont des obligations déclaratives renforcées et doivent tenir un registre de leurs propriétés.`;
    static readonly COMPETENT_CENTER = "Centre des Impôts territorialement compétent selon l'adresse de la propriété principale.";
}

// Gestion d'erreurs
class TFUEntrepriseErrorHandler {
    static genererErreurAnnee(input: TFUEntrepriseInput, annee: number): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'CONSTANTES_NON_DISPONIBLES',
                    message: `Les taux TFU pour l'année ${annee} ne sont pas encore disponibles.`,
                    details: `Le calcul de la Taxe Foncière Urbaine pour l'année ${annee} ne peut pas être effectué car les taux officiels n'ont pas encore été publiés par l'administration fiscale béninoise.`,
                    severity: 'info'
                }
            ],
            context: {
                typeContribuable: 'Entreprise propriétaire foncière',
                regime: 'TFU Entreprise',
                chiffreAffaire: input.proprietes.reduce((sum, p) => sum + p.valeurLocative, 0),
                missingData: ['taux_tfu', 'seuils_imposition', 'tarifs_geographiques']
            },
            timestamp: new Date().toISOString(),
            requestId: `tfu_entreprise_calc_${Date.now()}`
        };
    }

    static genererErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'VALIDATION_ERROR',
                    message: message,
                    details: `Erreur de validation des données d'entrée pour le calcul de la TFU Entreprise.`,
                    severity: 'error'
                }
            ],
            context: {
                typeContribuable: 'Entreprise propriétaire foncière',
                regime: 'TFU Entreprise',
                missingData: ['donnees_entree', 'proprietes', 'taux_tfu']
            },
            timestamp: new Date().toISOString(),
            requestId: `tfu_entreprise_calc_${Date.now()}`
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
class TFUEntrepriseResponseBuilder {
    private input: TFUEntrepriseInput;
    private options: TFUEntrepriseCalculationOptions;

    private totalTFU: number = 0;
    private variablesEnter: VariableEnter[] = [];
    private details: ImpotDetailCalcule[] = [];

    constructor(input: TFUEntrepriseInput, options: TFUEntrepriseCalculationOptions = {}) {
        this.input = input;
        this.options = { includeDetailsParPropriete: true, ...options };
        this.initializeCalculations();
    }

    private initializeCalculations() {
        let totalTFU = 0;

        // Variables globales
        this.variablesEnter.push(
            {
                label: "Nombre de propriétés",
                description: "Nombre total de propriétés imposables à la TFU",
                value: this.input.NbrProprietes,
                currency: ''
            },
            {
                label: "Valeur locative totale",
                description: "Somme des valeurs locatives de toutes les propriétés",
                value: this.input.proprietes.reduce((sum, p) => sum + p.valeurLocative, 0),
                currency: 'FCFA'
            }
        );

        // Détails par propriété et total
        for (const propriete of this.input.proprietes) {
            if (propriete.valeurLocative <= 0) continue;

            // Surcharge de taux si fournie
            const tauxPourcent = this.options.customTauxParVille && this.options.customTauxParVille[propriete.ville] !== undefined
                ? this.options.customTauxParVille[propriete.ville]
                : propriete.tauxTfu;

            const taux = tauxPourcent / 100;
            const taxe = propriete.valeurLocative * taux;
            totalTFU += taxe;

            if (this.options.includeDetailsParPropriete) {
                this.details.push({
                    impotTitle: `TFU - ${propriete.ville}`,
                    impotDescription: propriete.proprieteBatie ? 'Propriété bâtie' : 'Propriété non bâtie',
                    impotValue: Math.round(taxe),
                    impotValueCurrency: 'FCFA',
                    impotTaux: `${tauxPourcent.toFixed(2)}%`,
                    importCalculeDescription: `TFU = ${propriete.valeurLocative.toLocaleString('fr-FR')} FCFA × ${tauxPourcent.toFixed(2)}% = ${Math.round(taxe).toLocaleString('fr-FR')} FCFA`
                });
            }
        }

        this.totalTFU = Math.round(totalTFU);

        // Ajouter un récapitulatif global si détails désactivés
        if (!this.options.includeDetailsParPropriete) {
            const descriptionGlobale = this.input.proprietes.length === 1
                ? `Calculée selon le tarif de ${this.input.proprietes[0].ville}`
                : `Calculée pour ${this.input.proprietes.length} propriétés avec cumul des montants`;

            const tauxInfo = this.input.proprietes.length === 1
                ? `${(this.options.customTauxParVille?.[this.input.proprietes[0].ville] ?? this.input.proprietes[0].tauxTfu).toFixed(2)}%`
                : 'Tarifs variables selon les propriétés';

            const valeurTotale = this.input.proprietes.reduce((sum, p) => sum + p.valeurLocative, 0);

            this.details.push({
                impotTitle: 'TFU (Taxe Foncière Unique)',
                impotDescription: descriptionGlobale,
                impotValue: this.totalTFU,
                impotValueCurrency: 'FCFA',
                impotTaux: tauxInfo,
                importCalculeDescription: this.input.proprietes.length === 1
                    ? `TFU = ${this.input.proprietes[0].valeurLocative.toLocaleString('fr-FR')} FCFA × ${tauxInfo} = ${this.totalTFU.toLocaleString('fr-FR')} FCFA`
                    : `Cumul TFU pour ${this.input.proprietes.length} propriétés: ${this.totalTFU.toLocaleString('fr-FR')} FCFA (Valeur locative totale: ${valeurTotale.toLocaleString('fr-FR')} FCFA)`
            });
        }
    }

    private buildObligationEcheance() {
        return [
            {
                impotTitle: 'TFU - Premier acompte',
                echeancePaiement: {
                    echeancePeriodeLimite: '10 février',
                    echeanceDescription: "50% du montant total de la taxe due l'année précédente."
                },
                obligationDescription: "Premier acompte à verser au plus tard le 10 février."
            },
            {
                impotTitle: 'TFU - Solde',
                echeancePaiement: {
                    echeancePeriodeLimite: '30 avril',
                    echeanceDescription: "Solde de 50% du montant total de la taxe due."
                },
                obligationDescription: "Le solde de 50% doit être versé au plus tard le 30 avril."
            },
            {
                impotTitle: 'TFU - Déclaration des propriétés',
                echeancePaiement: {
                    echeancePeriodeLimite: '30 jours après acquisition',
                    echeanceDescription: "Déclaration par simple lettre au service des impôts."
                },
                obligationDescription: "Obligation de déclaration de vos propriétés foncières dans un délai de trente (30) jours suivant l'acquisition ou l'achèvement des constructions."
            },
            {
                impotTitle: 'TFU - Déclaration annuelle',
                echeancePaiement: {
                    echeancePeriodeLimite: '10 décembre',
                    echeanceDescription: "Déclaration écrite aux agents chargés de l'assiette de l'impôt."
                },
                obligationDescription: "Les propriétaires et principaux locataires doivent fournir une déclaration indiquant les locataires, occupants, et locaux vacants."
            }
        ];
    }

    private buildInfosSupplementaires() {
        return [
            {
                infosTitle: 'Obligations spécifiques entreprises',
                infosDescription: [
                    "Obligation de pose d'une plaque signalétique sur vos propriétés non bâties ou inscription d'une mention à l'entrée de vos constructions.",
                    "La plaque doit comporter l'adresse complète et préciser obligatoirement le numéro « Rue entrée de la parcelle ».",
                    "Tenue d'un registre des propriétés pour les entreprises possédant plusieurs biens immobiliers."
                ]
            },
            {
                infosTitle: 'Informations à déclarer annuellement',
                infosDescription: [
                    "Nom et prénoms de chaque locataire, consistance des locaux loués, montant du loyer principal et charges.",
                    "Nom et prénoms de chaque occupant à titre gratuit et consistance du local occupé.",
                    "Consistance des locaux occupés par l'entreprise elle-même.",
                    "Consistance des locaux vacants.",
                    "Changements dans l'utilisation des locaux au cours de l'année."
                ]
            },
            {
                infosTitle: 'Sanctions pour entreprises',
                infosDescription: [
                    "Pénalité de 20% sur le montant des droits en cas de défaut ou d'inexactitude des renseignements.",
                    "Pénalité de 40% du montant des droits si la déclaration n'a pas été déposée dans les trente (30) jours suivant la réception d'une mise en demeure.",
                    "Pénalité de 40% si les déclarations n'ont pas été déposées deux (2) mois après la date de dépôt.",
                    "Possibilité de suspension d'activité en cas de non-respect répété des obligations."
                ]
            }
        ];
    }

    private buildImpotConfig() {
        return {
            impotTitle: TFUEntrepriseConfig.TITLE,
            label: TFUEntrepriseConfig.LABEL,
            description: TFUEntrepriseConfig.DESCRIPTION,
            competentCenter: TFUEntrepriseConfig.COMPETENT_CENTER,
            paymentSchedule: [
                {
                    date: "10 février",
                    description: "Premier acompte (50% de la taxe de l'année précédente)"
                },
                {
                    date: "30 avril",
                    description: "Solde de la TFU"
                },
                {
                    date: "10 décembre",
                    description: "Déclaration annuelle des propriétés"
                }
            ]
        };
    }

    build(): GlobalEstimationInfoData {
        return {
            totalEstimation: this.totalTFU,
            totalEstimationCurrency: 'FCFA',
            VariableEnter: this.variablesEnter,
            impotDetailCalcule: this.details,
            obligationEcheance: this.buildObligationEcheance(),
            infosSupplementaires: this.buildInfosSupplementaires(),
            impotConfig: this.buildImpotConfig()
        };
    }
}

class MoteurTFUEntreprise {
    public static calculerTFUEntreprise(input: TFUEntrepriseInput): TFUEntrepriseCalculationResult {
        try {
            // Validation des entrées
            if (!input.possessionProprietes) {
                return TFUEntrepriseErrorHandler.genererErreurValidation('Aucune propriété déclarée');
            }

            if (!input.proprietes || input.proprietes.length === 0) {
                return TFUEntrepriseErrorHandler.genererErreurValidation('La liste des propriétés est vide');
            }

            if (input.NbrProprietes !== input.proprietes.length) {
                return TFUEntrepriseErrorHandler.genererErreurValidation('Le nombre de propriétés ne correspond pas à la liste fournie');
            }

            // Extraire l'année de la période fiscale
            const annee = DateUtils.extraireAnnee(input.periodeFiscale);
            
            // Vérifier si l'année est 2026 ou ultérieure
            if (annee >= 2026) {
                return TFUEntrepriseErrorHandler.genererErreurAnnee(input, annee);
            }

            return new TFUEntrepriseResponseBuilder(input, {}).build();
        } catch (error) {
            return TFUEntrepriseErrorHandler.genererErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de la TFU Entreprise');
        }
    }

    public static calculerTFUEntrepriseAvecOptions(input: TFUEntrepriseInput, options: TFUEntrepriseCalculationOptions): TFUEntrepriseCalculationResult {
        try {
            if (!input.possessionProprietes) {
                return TFUEntrepriseErrorHandler.genererErreurValidation('Aucune propriété déclarée');
            }
            if (!input.proprietes || input.proprietes.length === 0) {
                return TFUEntrepriseErrorHandler.genererErreurValidation('La liste des propriétés est vide');
            }
            if (input.NbrProprietes !== input.proprietes.length) {
                return TFUEntrepriseErrorHandler.genererErreurValidation('Le nombre de propriétés ne correspond pas à la liste fournie');
            }

            const annee = DateUtils.extraireAnnee(input.periodeFiscale);
            if (annee >= 2026) {
                return TFUEntrepriseErrorHandler.genererErreurAnnee(input, annee);
            }

            return new TFUEntrepriseResponseBuilder(input, options).build();
        } catch (error) {
            return TFUEntrepriseErrorHandler.genererErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de la TFU Entreprise');
        }
    }

    public static calculerTFUEntreprisePersonnalise(
        input: TFUEntrepriseInput,
        customTauxParVille?: Record<string, number>,
        includeDetailsParPropriete: boolean = true
    ): TFUEntrepriseCalculationResult {
        return this.calculerTFUEntrepriseAvecOptions(input, {
            customTauxParVille,
            includeDetailsParPropriete
        });
    }
}

export default MoteurTFUEntreprise;


