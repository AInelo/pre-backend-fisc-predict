import { GlobalEstimationInfoData } from '../../../../types/frontend.result.return.type';
import { BackendEstimationFailureResponse } from '../../../../types/frontend.errors.estomation.type';
import { buildFiscalParametersFailureResponse, FiscalParametersError } from '@/services/fiscal-parameters/errors';
import { fiscalParameterResolver } from '@/services/fiscal-parameters/FiscalParameterResolver';
import { TfuArrondissement, TfuDepartement, TfuParticulierFiscalParams, TfuTarifCategorie } from '@/types/fiscal-parameters';

export type TFUCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

interface TFUBatimentInfos {
    categorie: string;
    squareMeters: number;
}

interface TFUParcelleInfos {
    departement: string;
    commune: string;
    arrondissement: string;
    nbrBatiments: number;
    batiments: TFUBatimentInfos | TFUBatimentInfos[];
    nbrPiscines: number;
}

interface TFUInput {
    periodeFiscale: string;
    nbrParcelles: number;
    parcelles: TFUParcelleInfos | TFUParcelleInfos[];
}

class MoteurTFU {
    public static async calculerTFU(input: TFUInput): Promise<TFUCalculationResult> {
        try {
            if (!input) {
                return this.genererReponseErreurValidation('Aucune donnée TFU fournie');
            }

            const parcelles = Array.isArray(input.parcelles)
                ? input.parcelles
                : input.parcelles
                    ? [input.parcelles]
                    : [];

            if (parcelles.length === 0) {
                return this.genererReponseErreurValidation('Aucune parcelle fournie pour le calcul de la TFU');
            }

            const params = await fiscalParameterResolver.resolveRequiredParams<'TFU'>({
                codeImpot: 'TFU',
                typeContribuable: 'PARTICULIER',
                periodeFiscale: input.periodeFiscale,
            }) as unknown as TfuParticulierFiscalParams;

            let totalTFU = 0;
            let totalSurface = 0;
            let totalPiscines = 0;
            const detailsCalculs: string[] = [];
            const variablesEnter: any[] = [];
            const surfacesParcelles: number[] = [];
            const piscinesParcelles: number[] = [];

            for (let parcelleIndex = 0; parcelleIndex < parcelles.length; parcelleIndex++) {
                const parcelle = parcelles[parcelleIndex];
                const batiments = Array.isArray(parcelle.batiments)
                    ? parcelle.batiments
                    : parcelle.batiments
                        ? [parcelle.batiments]
                        : [];

                if (batiments.length === 0) {
                    return this.genererReponseErreurValidation(`Aucun bâtiment renseigné pour la parcelle ${parcelleIndex + 1}`);
                }

                if (typeof parcelle.nbrBatiments === 'number' && parcelle.nbrBatiments >= 0 && parcelle.nbrBatiments !== batiments.length) {
                    return this.genererReponseErreurValidation(
                        `Le nombre de bâtiments indiqué (${parcelle.nbrBatiments}) ne correspond pas au nombre de bâtiments fournis (${batiments.length}) pour la parcelle ${parcelleIndex + 1}`
                    );
                }

                let sommeTFUBatiments = 0;
                let surfaceParcelle = 0;
                let minimumBatimentLePlusGrand = 0;
                let surfaceBatimentLePlusGrand = 0;
                const detailsBatiments: string[] = [];

                for (let batimentIndex = 0; batimentIndex < batiments.length; batimentIndex++) {
                    const batiment = batiments[batimentIndex];

                    if (batiment.squareMeters < 0) {
                        return this.genererReponseErreurValidation(`La surface du bâtiment ${batimentIndex + 1} de la parcelle ${parcelleIndex + 1} ne peut pas être négative`);
                    }

                    const rateData = this.findTFURate(
                        params.departements,
                        parcelle.departement,
                        parcelle.commune,
                        parcelle.arrondissement,
                        batiment.categorie
                    );

                    if (!rateData) {
                        return this.genererReponseErreurValidation(`Tarif TFU non trouvé pour ${parcelle.departement} - ${parcelle.commune} - ${parcelle.arrondissement} (catégorie ${batiment.categorie})`);
                    }

                    const tfu = batiment.squareMeters * rateData.tfu_par_m2;
                    const tfuFinale = Math.max(tfu, rateData.tfu_minimum);
                    const tfuArrondie = Math.round(tfuFinale);

                    sommeTFUBatiments += tfuArrondie;
                    surfaceParcelle += batiment.squareMeters;
                    totalSurface += batiment.squareMeters;

                    if (batiment.squareMeters >= surfaceBatimentLePlusGrand) {
                        surfaceBatimentLePlusGrand = batiment.squareMeters;
                        minimumBatimentLePlusGrand = rateData.tfu_minimum;
                    }

                    const tfuCalculee = Math.round(tfu);
                    const minimumApplique = tfuArrondie > tfuCalculee;
                    const detailBatiment = minimumApplique
                        ? `Bâtiment ${batimentIndex + 1}: ${batiment.squareMeters} m² × ${rateData.tfu_par_m2.toFixed(2)} FCFA/m² = ${tfuCalculee.toLocaleString('fr-FR')} FCFA → Minimum appliqué : ${tfuArrondie.toLocaleString('fr-FR')} FCFA`
                        : `Bâtiment ${batimentIndex + 1}: ${batiment.squareMeters} m² × ${rateData.tfu_par_m2.toFixed(2)} FCFA/m² = ${tfuArrondie.toLocaleString('fr-FR')} FCFA`;

                    detailsBatiments.push(detailBatiment);
                }

                const nombrePiscines = parcelle.nbrPiscines ?? 0;
                if (nombrePiscines < 0) {
                    return this.genererReponseErreurValidation(`Le nombre de piscines pour la parcelle ${parcelleIndex + 1} ne peut pas être négatif`);
                }
                const montantMinimumBatimentLePlusGrand = Math.round(minimumBatimentLePlusGrand);
                const montantPiscines = nombrePiscines * params.montant_piscine;
                totalPiscines += nombrePiscines;

                const tfuBatimentsRetenue = Math.max(sommeTFUBatiments, montantMinimumBatimentLePlusGrand);
                const tfuParcelle = tfuBatimentsRetenue + montantPiscines;
                totalTFU += tfuParcelle;
                surfacesParcelles.push(surfaceParcelle);
                piscinesParcelles.push(nombrePiscines);

                const detailParcelle = [
                    `Parcelle ${parcelleIndex + 1} - ${parcelle.departement} / ${parcelle.commune} / ${parcelle.arrondissement}`,
                    ...detailsBatiments,
                    `Somme TFU bâtiments : ${sommeTFUBatiments.toLocaleString('fr-FR')} FCFA`,
                    `Minimum (bâtiment le plus grand) : ${montantMinimumBatimentLePlusGrand.toLocaleString('fr-FR')} FCFA`,
                    `TFU retenue pour la parcelle : ${tfuBatimentsRetenue.toLocaleString('fr-FR')} FCFA`,
                    `Piscines (${nombrePiscines}) : ${montantPiscines.toLocaleString('fr-FR')} FCFA`,
                    `Montant total parcelle : ${tfuParcelle.toLocaleString('fr-FR')} FCFA`
                ].join(' | ');

                detailsCalculs.push(detailParcelle);

                variablesEnter.push({
                    label: `Parcelle ${parcelleIndex + 1}`,
                    description: `Surface totale des bâtiments (${batiments.length} bâtiment(s))`,
                    value: surfaceParcelle,
                    currency: 'm²',
                });

                if (nombrePiscines > 0) {
                    variablesEnter.push({
                        label: `Piscines - Parcelle ${parcelleIndex + 1}`,
                        description: `Nombre de piscines déclarées`,
                        value: nombrePiscines,
                        currency: 'unité(s)',
                    });
                }
            }

            const premiereParcelle = parcelles[0];
            const detailsDescription = detailsCalculs.length > 0
                ? `Détails par parcelle:\n${detailsCalculs.join('\n')}`
                : 'Aucun détail de calcul disponible';

            return {
                totalEstimation: totalTFU,
                totalEstimationCurrency: 'FCFA',

                VariableEnter: variablesEnter,

                impotDetailCalcule: [
                    {
                        impotTitle: 'TFU (Taxe Foncière Urbaine)',
                        impotDescription: parcelles.length === 1
                            ? `Calculée pour la parcelle située à ${premiereParcelle.departement} - ${premiereParcelle.commune} - ${premiereParcelle.arrondissement} (surface totale des bâtiments : ${surfacesParcelles[0]} m², piscines : ${piscinesParcelles[0]})`
                            : `Calculée pour ${parcelles.length} parcelles (surface totale : ${totalSurface} m², piscines : ${totalPiscines})`,
                        impotValue: totalTFU,
                        impotValueCurrency: 'FCFA',
                        impotTaux: 'Tarifs variables par bâtiment et par zone',
                        importCalculeDescription: detailsDescription
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
                    impotTitle: params.title,
                    label: params.label,
                    description: params.description,
                    competentCenter: params.competent_center
                }
            };
        } catch (error) {
            if (error instanceof FiscalParametersError) {
                return buildFiscalParametersFailureResponse(error, {
                    typeContribuable: 'Propriétaire foncier',
                    regime: 'TFU',
                });
            }
            return this.genererReponseErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de la TFU');
        }
    }

    private static findTFURate(
        departements: TfuDepartement[],
        departementSlug: string,
        communeSlug: string,
        arrondissementSlug: string,
        categorieSlug: string
    ): TfuTarifCategorie | null {
        try {
            const departement = departements.find(d => d.slug === departementSlug);
            if (!departement) return null;

            const commune = departement.communes.find(c => c.slug === communeSlug);
            if (!commune) return null;

            const arrondissement = commune.arrondissements.find(a => a.slug === arrondissementSlug);
            if (!arrondissement) return null;

            const tarifKey = Object.keys(arrondissement.tarifs).find(key =>
                arrondissement.tarifs[key].slug_description === categorieSlug
            );
            if (!tarifKey) return null;

            return arrondissement.tarifs[tarifKey] ?? null;
        } catch {
            return null;
        }
    }

    private static genererReponseErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'VALIDATION_ERROR',
                    message,
                    details: `Erreur de validation des données d'entrée pour le calcul de la TFU.`,
                    severity: 'error'
                }
            ],
            context: {
                typeContribuable: 'Propriétaire foncier',
                regime: 'TFU',
                missingData: ['parcelles', 'batiments']
            },
            timestamp: new Date().toISOString(),
            requestId: `tfu_calc_${Date.now()}`
        };
    }
}

export default MoteurTFU;
