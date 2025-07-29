import { GlobalEstimationInfoData } from '../../../../types/frontend.result.return.type';
import {BackendEstimationError, BackendEstimationFailureResponse, BackendEstimationContext } from '../../../../types/frontend.errors.estomation.type';
import tfuData from '../../../../data/tfu_data_with_slugs.json';

// Type union pour le retour de la fonction
export type TFUCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

// Interface pour les données TFU
interface TFUInput {
  departement: string;
  commune: string;
  arrondissement: string;
  categorie: string;
  squareMeters: number;
  periodeFiscale: string;
}

// Interface pour les tarifs TFU
interface TFUTarif {
  nom_categorie: string;
  slug_categorie: string;
  description: string;
  slug_description: string;
  tfu_par_m2: number;
  tfu_minimum: number;
}

class MoteurTFU {
    public static calculerTFU(input: TFUInput | TFUInput[]): TFUCalculationResult {
        try {
            // Convertir en tableau pour un traitement uniforme
            const inputs = Array.isArray(input) ? input : [input];
            
            if (inputs.length === 0) {
                return this.genererReponseErreurValidation('Aucune donnée TFU fournie');
            }

            // Extraire l'année de la période fiscale (utiliser la première pour la validation)
            const annee = this.extraireAnnee(inputs[0].periodeFiscale);
            
            // Vérifier si l'année est 2026 ou ultérieure
            if (annee >= 2026) {
                return this.genererReponseErreur(inputs[0], annee);
            }

            // Calculer la TFU pour chaque propriété
            let totalTFU = 0;
            let totalSurface = 0;
            const detailsCalculs: string[] = [];
            const variablesEnter: any[] = [];

            for (const singleInput of inputs) {
                // Validation des entrées
                if (singleInput.squareMeters < 0) {
                    return this.genererReponseErreurValidation('La surface en mètres carrés ne peut pas être négative');
                }

                // Récupérer les données de tarif
                const rateData = this.findTFURate(singleInput);
                if (!rateData) {
                    return this.genererReponseErreurValidation(`Tarif TFU non trouvé pour ${singleInput.departement} - ${singleInput.commune} - ${singleInput.arrondissement}`);
                }

                // Calculer la TFU : nombre de mètres carrés × TFU par m²
                let tfu = singleInput.squareMeters * rateData.tfu_par_m2;

                // Appliquer le minimum si le résultat est inférieur
                const tfuFinale = Math.max(tfu, rateData.tfu_minimum);

                // Arrondir à l'entier le plus proche
                const tfuArrondie = Math.round(tfuFinale);

                totalTFU += tfuArrondie;
                totalSurface += singleInput.squareMeters;

                // Ajouter les détails du calcul
                detailsCalculs.push(
                    `${singleInput.departement} - ${singleInput.commune} - ${singleInput.arrondissement}: ${singleInput.squareMeters} m² × ${rateData.tfu_par_m2.toFixed(2)} FCFA/m² = ${tfuArrondie.toLocaleString('fr-FR')} FCFA`
                );

                // Ajouter les variables d'entrée
                variablesEnter.push({
                    label: `Surface - ${singleInput.departement}`,
                    description: `Surface de la propriété à ${singleInput.commune}`,
                    value: singleInput.squareMeters,
                    currency: 'm²',
                });
            }

            return {
                totalEstimation: totalTFU,
                totalEstimationCurrency: 'FCFA',
                contribuableRegime: 'TFU',

                VariableEnter: variablesEnter,

                impotDetailCalcule: [
                    {
                        impotTitle: 'TFU (Taxe Foncière Urbaine)',
                        impotDescription: inputs.length === 1 
                            ? `Calculée selon le tarif de ${inputs[0].departement} - ${inputs[0].commune} - ${inputs[0].arrondissement}`
                            : `Calculée pour ${inputs.length} propriétés avec cumul des montants`,
                        impotValue: totalTFU,
                        impotValueCurrency: 'FCFA',
                        impotTaux: inputs.length === 1 ? `${this.findTFURate(inputs[0])?.tfu_par_m2.toFixed(2)} FCFA/m²` : 'Tarifs variables',
                        importCalculeDescription: inputs.length === 1 
                            ? `TFU = ${inputs[0].squareMeters} m² × ${this.findTFURate(inputs[0])?.tfu_par_m2.toFixed(2)} FCFA/m² = ${totalTFU.toLocaleString('fr-FR')} FCFA`
                            : `Cumul TFU pour ${inputs.length} propriétés: ${totalTFU.toLocaleString('fr-FR')} FCFA (Surface totale: ${totalSurface} m²)`
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
                        infosTitle: 'Obligations spécifiques',
                        infosDescription: [
                            "Obligation de pose d'une plaque signalétique sur vos propriétés non bâties ou inscription d'une mention à l'entrée de vos constructions.",
                            "La plaque doit comporter l'adresse complète et préciser obligatoirement le numéro « Rue entrée de la parcelle »."
                        ]
                    },
                    {
                        infosTitle: 'Informations à déclarer annuellement',
                        infosDescription: [
                            "Nom et prénoms de chaque locataire, consistance des locaux loués, montant du loyer principal et charges.",
                            "Nom et prénoms de chaque occupant à titre gratuit et consistance du local occupé.",
                            "Consistance des locaux occupés par le déclarant lui-même.",
                            "Consistance des locaux vacants."
                        ]
                    },
                    {
                        infosTitle: 'Sanctions',
                        infosDescription: [
                            "Pénalité de 20% sur le montant des droits en cas de défaut ou d'inexactitude des renseignements.",
                            "Pénalité de 40% du montant des droits si la déclaration n'a pas été déposée dans les trente (30) jours suivant la réception d'une mise en demeure.",
                            "Pénalité de 40% si les déclarations n'ont pas été déposées deux (2) mois après la date de dépôt."
                        ]
                    }
                ],

                impotConfig: {
                    impotTitle: 'Taxe Foncière Urbaine',
                    label: 'TFU',
                    description: `La TFU est calculée selon la surface de la propriété et les tarifs en vigueur dans la zone géographique.
                            Le calcul prend en compte le tarif par m² et applique un minimum forfaitaire.
                            Les tarifs varient selon le département, la commune, l'arrondissement et la catégorie de construction.`,
                    competentCenter: "Centre des Impôts territorialement compétent selon l'adresse de la propriété."
                }
            };
        } catch (error) {
            return this.genererReponseErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de la TFU');
        }
    }

    // Recherche du tarif TFU en utilisant les slugs pour une précision maximale
    private static findTFURate(input: TFUInput): TFUTarif | null {
        try {
            // On suppose que les champs d'entrée sont déjà des slugs ou à convertir en slug
            const departement = tfuData.departements.find(d =>
                d.slug === input.departement
            );
            if (!departement) return null;

            const commune = departement.communes.find(c =>
                c.slug === input.commune
            );
            if (!commune) return null;

            const arrondissement = commune.arrondissements.find(a =>
                a.slug === input.arrondissement
            );
            if (!arrondissement) return null;

            // On suppose que input.categorie est le slug de la catégorie (slug_categorie)
            // Il faut donc trouver la clé du tarif dont le slug_categorie correspond à input.categorie
            const tarifKey = Object.keys(arrondissement.tarifs).find(key => {
                const cat = arrondissement.tarifs[key as keyof typeof arrondissement.tarifs];
                // On vérifie le slug de la catégorie
                return cat.slug_categorie === input.categorie;
            });

            if (!tarifKey) return null;

            const tarif = arrondissement.tarifs[tarifKey as keyof typeof arrondissement.tarifs];
            return tarif || null;
        } catch (error) {
            return null;
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

    private static genererReponseErreur(input: TFUInput, annee: number): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'CONSTANTES_NON_DISPONIBLES',
                    message: `Les tarifs TFU pour l'année ${annee} ne sont pas encore disponibles.`,
                    details: `Le calcul de la Taxe Foncière Urbaine pour l'année ${annee} ne peut pas être effectué car les tarifs officiels n'ont pas encore été publiés par l'administration fiscale béninoise.`,
                    severity: 'info'
                }
            ],
            context: {
                typeContribuable: 'Propriétaire foncier',
                regime: 'TFU',
                chiffreAffaires: input.squareMeters,
                missingData: ['tarifs_tfu', 'zones_geographiques', 'categories_construction']
            },
            timestamp: new Date().toISOString(),
            requestId: `tfu_calc_${Date.now()}`
        };
    }

    private static genererReponseErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'VALIDATION_ERROR',
                    message: message,
                    details: `Erreur de validation des données d'entrée pour le calcul de la TFU.`,
                    severity: 'error'
                }
            ],
            context: {
                typeContribuable: 'Propriétaire foncier',
                regime: 'TFU',
                missingData: ['donnees_entree']
            },
            timestamp: new Date().toISOString(),
            requestId: `tfu_calc_${Date.now()}`
        };
    }
}

export default MoteurTFU; 