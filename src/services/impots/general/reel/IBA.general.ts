import { BackendEstimationFailureResponse } from "@/types/frontend.errors.estomation.type";
import { GlobalEstimationInfoData } from "@/types/frontend.result.return.type";
import { buildFiscalParametersFailureResponse, FiscalParametersError } from '@/services/fiscal-parameters/errors';
import { fiscalParameterResolver } from '@/services/fiscal-parameters/FiscalParameterResolver';
import { IbaFiscalParams, IbaSectorRule } from '@/types/fiscal-parameters';

export enum TypeActivite {
    ENSEIGNEMENT_PRIVE = 'enseignement-prive',
    INDUSTRIE = 'industrie',
    BTP = 'batiment-travaux-publics',
    IMMOBILIER = 'immobilier',
    STATIONS_SERVICES = 'stations-services',
    ARTISANAT = 'artisanat',
    AGRICULTURE = 'agriculture',
    PECHE = 'peche',
    ELEVAGE = 'elevage',
    CHERCHEUR_VARIETE = 'chercheur-variete-vegetale',
    PROFESSION_LIBERALE = 'profession-liberale',
    CHARGES_OFFICES = 'charges-offices',
    PROPRIETE_INTELLECTUELLE = 'propriete-intellectuelle',
    LOCATION_ETABLISSEMENT = 'location-etablissement-commercial',
    INTERMEDIAIRE_IMMO = 'intermediaire-immobilier',
    ACHAT_REVENTE_IMMO = 'achat-revente-immobilier',
    LOTISSEMENT_TERRAIN = 'lotissement-terrain',
    AUTRE = 'autre'
}

export enum ConditionsReduction {
    ARTISANALE = 'artisanale',
    NORMALE = 'normale'
}

interface IBAInput {
    chiffreAffaire: number;
    charges: number;
    secteur: TypeActivite;
    conditionsReduction?: ConditionsReduction;
    periodeFiscale: string;
    nbrLitreAnnee?: number;
}

interface IBACalculationOptions {
    includeRedevanceSRTB?: boolean;
    includeReductionArtisanale?: boolean;
    customRedevanceSRTB?: number;
    customReductionArtisanale?: number;
}

export type IBACalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

class IBAErrorHandler {
    static genererErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [{ code: 'VALIDATION_ERROR', message, details: `Erreur de validation des données d'entrée pour le calcul de l'IBA.`, severity: 'error' }],
            context: { typeContribuable: 'Entrepreneur individuel', regime: 'IBA', missingData: ['donnees_entree', 'chiffre_affaires', 'charges'] },
            timestamp: new Date().toISOString(),
            requestId: `iba_calc_${Date.now()}`
        };
    }
}

class IBAResponseBuilder {
    private beneficeImposable = 0;
    private impotBase = 0;
    private impotFinal = 0;
    private tauxPrincipal = 0;
    private impotNominal = 0;
    private impotMinimumSectoriel = 0;
    private minimumAbsolu = 0;
    private redevanceSRTB = 0;

    constructor(
        private readonly input: IBAInput,
        private readonly params: IbaFiscalParams,
        private readonly options: IBACalculationOptions = {}
    ) {
        this.options = {
            includeRedevanceSRTB: true,
            includeReductionArtisanale: true,
            ...options
        };
        this.initializeCalculations();
    }

    private getRegleSecteur(): IbaSectorRule {
        return this.params.regles_secteur[this.input.secteur] ?? this.params.regles_secteur[TypeActivite.AUTRE] ?? {};
    }

    private initializeCalculations() {
        const regle = this.getRegleSecteur();
        this.beneficeImposable = Math.max(0, this.input.chiffreAffaire - this.input.charges);
        this.tauxPrincipal = regle.taux ?? this.params.taux_general;
        this.impotNominal = this.beneficeImposable * this.tauxPrincipal;

        if (regle.tauxParLitre && this.input.nbrLitreAnnee) {
            this.impotMinimumSectoriel = this.input.nbrLitreAnnee * regle.tauxParLitre;
        } else if (regle.minPourcent) {
            this.impotMinimumSectoriel = this.input.chiffreAffaire * regle.minPourcent;
        } else {
            this.impotMinimumSectoriel = this.input.chiffreAffaire * this.params.minimum_general_pourcent;
        }

        this.minimumAbsolu = regle.min ?? this.params.minimum_absolu_general;
        this.impotBase = Math.max(this.impotNominal, this.impotMinimumSectoriel, this.minimumAbsolu);

        let facteurReduction = 1;
        const reductionApplicable =
            this.options.includeReductionArtisanale &&
            (this.input.conditionsReduction === ConditionsReduction.ARTISANALE || this.input.secteur === TypeActivite.ARTISANAT);
        if (reductionApplicable) {
            facteurReduction = this.options.customReductionArtisanale ?? regle.reductionArtisanale ?? this.params.facteur_reduction_artisanale;
        }

        this.redevanceSRTB = this.options.includeRedevanceSRTB ? (this.options.customRedevanceSRTB ?? this.params.redevance_srtb) : 0;
        this.impotFinal = Math.round(this.impotBase * facteurReduction + this.redevanceSRTB);
    }

    build(): GlobalEstimationInfoData {
        return {
            totalEstimation: this.impotFinal,
            totalEstimationCurrency: 'FCFA',
            contribuableRegime: 'Régime IBA',
            VariableEnter: [
                { label: "Chiffre d'affaires", description: "Revenus totaux de l'activité", value: this.input.chiffreAffaire, currency: 'FCFA' },
                { label: "Charges déductibles", description: "Charges et dépenses déductibles", value: this.input.charges, currency: 'FCFA' },
                { label: "Bénéfice imposable", description: "Différence entre revenus et charges", value: this.beneficeImposable, currency: 'FCFA' }
            ],
            impotDetailCalcule: [
                {
                    impotTitle: 'Impôt sur le Bénéfice d\'Affaire (IBA) - Base',
                    impotDescription: `Calculé selon le taux de ${(this.tauxPrincipal * 100).toFixed(1)}% applicable au secteur ${this.input.secteur}`,
                    impotValue: Math.round(this.impotBase),
                    impotValueCurrency: 'FCFA',
                    impotTaux: `${(this.tauxPrincipal * 100).toFixed(1)}%`,
                    importCalculeDescription: `IBA base = MAX(impôt nominal ${Math.round(this.impotNominal).toLocaleString('fr-FR')} FCFA, minimum sectoriel ${Math.round(this.impotMinimumSectoriel).toLocaleString('fr-FR')} FCFA, minimum absolu ${this.minimumAbsolu.toLocaleString('fr-FR')} FCFA)`
                }
            ],
            obligationEcheance: [
                {
                    impotTitle: 'IBA - Solde et déclaration annuelle',
                    echeancePaiement: { echeancePeriodeLimite: '30 avril', echeanceDescription: "Solde de l'IBA et déclaration annuelle avec bilan OHADA." },
                    obligationDescription: "Le solde de l'IBA doit être versé et la déclaration annuelle déposée avant le 30 avril."
                }
            ],
            infosSupplementaires: [
                {
                    infosTitle: 'Paramètres appliqués',
                    infosDescription: [
                        `Taux principal: ${(this.tauxPrincipal * 100).toFixed(1)}%`,
                        `Minimum sectoriel: ${Math.round(this.impotMinimumSectoriel).toLocaleString('fr-FR')} FCFA`,
                        `Minimum absolu: ${this.minimumAbsolu.toLocaleString('fr-FR')} FCFA`
                    ]
                }
            ],
            impotConfig: {
                impotTitle: this.params.title,
                label: this.params.label,
                description: this.params.description,
                competentCenter: this.params.competent_center
            }
        };
    }
}

class MoteurIBA {
    public static async calculerIBA(input: IBAInput): Promise<IBACalculationResult> {
        return this.calculerIBAvecOptions(input, {});
    }

    public static async calculerIBAWithoutRedevanceSRTB(input: IBAInput): Promise<IBACalculationResult> {
        return this.calculerIBAvecOptions(input, { includeRedevanceSRTB: false });
    }

    public static async calculerIBAWithoutReductionArtisanale(input: IBAInput): Promise<IBACalculationResult> {
        return this.calculerIBAvecOptions(input, { includeReductionArtisanale: false });
    }

    public static async calculerIBAWithoutSRTB_ReductionArtisanale(input: IBAInput): Promise<IBACalculationResult> {
        return this.calculerIBAvecOptions(input, { includeRedevanceSRTB: false, includeReductionArtisanale: false });
    }

    public static async calculerIBAPersonnalise(input: IBAInput, customRedevanceSRTB?: number, customReductionArtisanale?: number): Promise<IBACalculationResult> {
        return this.calculerIBAvecOptions(input, {
            customRedevanceSRTB,
            customReductionArtisanale,
            includeRedevanceSRTB: customRedevanceSRTB !== undefined,
            includeReductionArtisanale: customReductionArtisanale !== undefined
        });
    }

    public static async calculerIBAvecOptions(input: IBAInput, options: IBACalculationOptions): Promise<IBACalculationResult> {
        try {
            if (input.chiffreAffaire <= 0) {
                return IBAErrorHandler.genererErreurValidation('Le chiffre d\'affaires doit être positif');
            }
            if (input.charges < 0) {
                return IBAErrorHandler.genererErreurValidation('Les charges ne peuvent pas être négatives');
            }
            if (input.secteur === TypeActivite.STATIONS_SERVICES && (!input.nbrLitreAnnee || input.nbrLitreAnnee <= 0)) {
                return IBAErrorHandler.genererErreurValidation('Le nombre de litres vendus annuellement est requis et doit être positif pour les stations-services');
            }

            const params = await fiscalParameterResolver.resolveRequiredParams<'IBA'>({
                codeImpot: 'IBA',
                typeContribuable: 'ENTREPRISE',
                periodeFiscale: input.periodeFiscale
            });

            return new IBAResponseBuilder(input, params, options).build();
        } catch (error) {
            if (error instanceof FiscalParametersError) {
                return buildFiscalParametersFailureResponse(error, {
                    typeContribuable: 'Entrepreneur individuel',
                    regime: 'IBA',
                    chiffreAffaire: input.chiffreAffaire
                });
            }
            return IBAErrorHandler.genererErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de l\'IBA');
        }
    }
}

export default MoteurIBA;
