import { BackendEstimationFailureResponse } from "@/types/frontend.errors.estomation.type";
import { GlobalEstimationInfoData } from "@/types/frontend.result.return.type";


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





export type TFUEntrepriseCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

class MoteurTFUEntreprise {
    public static calculerTFUEntreprise(input: TFUEntrepriseInput): TFUEntrepriseCalculationResult {
        try {
            // Validation des entrées
            if (!input.possessionProprietes) {
                return this.genererReponseErreurValidation('Aucune propriété déclarée');
            }

            if (!input.proprietes || input.proprietes.length === 0) {
                return this.genererReponseErreurValidation('La liste des propriétés est vide');
            }

            if (input.NbrProprietes !== input.proprietes.length) {
                return this.genererReponseErreurValidation('Le nombre de propriétés ne correspond pas à la liste fournie');
            }

            // Extraire l'année de la période fiscale
            const annee = this.extraireAnnee(input.periodeFiscale);
            
            // Vérifier si l'année est 2026 ou ultérieure
            if (annee >= 2026) {
                return this.genererReponseErreur(input, annee);
            }

            // Calculer la TFU pour chaque propriété
            let totalTFU = 0;
            const detailsProprietes = [];

            for (const propriete of input.proprietes) {
                if (propriete.valeurLocative <= 0) continue;

                const taux = propriete.tauxTfu / 100; // Convertir le pourcentage en décimal
                const taxe = propriete.valeurLocative * taux;
                totalTFU += taxe;

                detailsProprietes.push({
                    ville: propriete.ville,
                    valeurLocative: propriete.valeurLocative,
                    proprieteBatie: propriete.proprieteBatie,
                    tauxTfu: propriete.tauxTfu,
                    taxeCalculee: Math.round(taxe)
                });
            }

            const totalTFUArrondi = Math.round(totalTFU);

            // Préparer les variables d'entrée
            const variablesEnter = [
                {
                    label: "Nombre de propriétés",
                    description: "Nombre total de propriétés imposables à la TFU",
                    value: input.NbrProprietes,
                    currency: ''
                },
                {
                    label: "Valeur locative totale",
                    description: "Somme des valeurs locatives de toutes les propriétés",
                    value: input.proprietes.reduce((sum, p) => sum + p.valeurLocative, 0),
                    currency: 'FCFA'
                }
            ];

            // Calculer la surface totale (approximative basée sur la valeur locative)
            const surfaceTotale = Math.round(input.proprietes.reduce((sum, p) => sum + p.valeurLocative, 0) / 1000);

            return {
                totalEstimation: totalTFUArrondi,
                totalEstimationCurrency: 'FCFA',
                contribuableRegime: 'TFU Entreprise',

                VariableEnter: variablesEnter,

                impotDetailCalcule: [
                    {
                        impotTitle: 'TFU (Taxe Foncière Unique)',
                        impotDescription: input.proprietes.length === 1
                            ? `Calculée selon le tarif de ${input.proprietes[0].ville}`
                            : `Calculée pour ${input.proprietes.length} propriétés avec cumul des montants`,
                        impotValue: totalTFUArrondi,
                        impotValueCurrency: 'FCFA',
                        impotTaux: input.proprietes.length === 1 
                            ? `${input.proprietes[0].tauxTfu.toFixed(2)}%` 
                            : 'Tarifs variables selon les propriétés',
                        importCalculeDescription: input.proprietes.length === 1
                            ? `TFU = ${input.proprietes[0].valeurLocative.toLocaleString('fr-FR')} FCFA × ${input.proprietes[0].tauxTfu.toFixed(2)}% = ${totalTFUArrondi.toLocaleString('fr-FR')} FCFA`
                            : `Cumul TFU pour ${input.proprietes.length} propriétés: ${totalTFUArrondi.toLocaleString('fr-FR')} FCFA (Valeur locative totale: ${(input.proprietes.reduce((sum, p) => sum + p.valeurLocative, 0)).toLocaleString('fr-FR')} FCFA)`
                    }
                ],

                obligationEcheance: [
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
                ],

                infosSupplementaires: [
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
                ],

                impotConfig: {
                    impotTitle: 'Taxe Foncière Urbaine - Entreprises',
                    label: 'TFU Entreprise',
                    description: `La TFU pour les entreprises est calculée selon la valeur locative de chaque propriété et les taux en vigueur.
                            Le calcul prend en compte le nombre de propriétés et applique les taux spécifiques à chaque bien.
                            Les entreprises ont des obligations déclaratives renforcées et doivent tenir un registre de leurs propriétés.`,
                    competentCenter: "Centre des Impôts territorialement compétent selon l'adresse de la propriété principale.",
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
                }
            };
        } catch (error) {
            return this.genererReponseErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de la TFU Entreprise');
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

    private static genererReponseErreur(input: TFUEntrepriseInput, annee: number): BackendEstimationFailureResponse {
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
                chiffreAffaires: input.proprietes.reduce((sum, p) => sum + p.valeurLocative, 0),
                missingData: ['taux_tfu', 'seuils_imposition', 'tarifs_geographiques']
            },
            timestamp: new Date().toISOString(),
            requestId: `tfu_entreprise_calc_${Date.now()}`
        };
    }

    private static genererReponseErreurValidation(message: string): BackendEstimationFailureResponse {
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

export default MoteurTFUEntreprise;


