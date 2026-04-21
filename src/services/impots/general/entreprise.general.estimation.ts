import { impotGeneralCalculationState } from './impot.general.calculation.state';
import { GlobalEstimationInfoData } from '../../../types/frontend.result.return.type';
import { BackendEstimationFailureResponse } from '../../../types/frontend.errors.estomation.type';
import MoteurTPSimplifie, { TypeEntreprise } from './tps/TPS.general';
import MoteurAIB from './reel/AIB.general';
import MoteurIBA, { ConditionsReduction, TypeActivite } from './reel/IBA.general';
import MoteurIRF from './reel/IRF.general';
import MoteurIS from './reel/IS.general';
import MoteurPatente from './reel/PATENTE.general';
import MoteurITS from './reel/ITS.general';
import MoteurTFUEntreprise from './reel/TFU.general.entreprise';
import MoteurTVM from './reel/TVM.general';

interface AIBInput {
    aibCollected: number;
    aibGranted: number;
    periodeFiscale: string;
}

interface IBAInput {
    chiffreAffaire: number;
    charges: number;
    secteur: TypeActivite;
    conditionsReduction?: ConditionsReduction;
    periodeFiscale: string;
    nbrLitreAnnee?: number;
}

interface IRFInput {
    revenuLocatif: number;
    isAlreadyTaxed: boolean;
    periodeFiscale: string;
}

interface ISInput {
    chiffreAffaire: number;
    charges: number;
    secteur: 'education' | 'industry' | 'real-estate' | 'construction' | 'gas-station' | 'general';
    dureeCreation?: number;
    pourcentageActionsNonCotees?: number;
    estExoneree?: boolean;
    nbrLitreParAn?: number;
    periodeFiscale: string;
}

interface PatenteInput {
    chiffreAffaire: number;
    periodeFiscale: string;
    etablissements: any[];
    isImporter?: boolean;
    importExportAmount?: number;
}

interface ITSInput {
    salaireAnnuel: number;
    periodeFiscale: string;
}

interface TFUEntrepriseInput {
    possessionProprietes: boolean;
    NbrProprietes: number;
    proprietes: any[];
    periodeFiscale: string;
}

interface TVMInput {
    hasVehicles: boolean;
    vehicles: any[];
    periodeFiscale: string;
}

interface TPSInput {
    chiffreAffaire: number;
    periodeFiscale: string;
    typeEntreprise: TypeEntreprise;
}

interface EntrepriseGeneralEstimationRequest {
    dataImpot: Record<string, AIBInput | IBAInput | IRFInput | ISInput | PatenteInput | ITSInput | TFUEntrepriseInput | TVMInput | TPSInput>;
    chiffreAffaire?: number;
    periodeFiscale?: string;
    typeEntreprise?: TypeEntreprise;
}

interface GlobalEstimationResult extends GlobalEstimationInfoData {
    success: boolean;
    estimationsParImpot: Record<string, any>;
    errors?: string[];
}

export class EntrepriseGeneralEstimation {
    private static readonly IMPOTS_CONDITIONNELS = ['TVM', 'TFU'];
    private static readonly SEUIL_REGIME_REEL = 50_000_000;

    private static estImpotConditionnelApplicable(impotCode: string, dataImpot: any): boolean {
        if (impotCode === 'TVM') {
            return dataImpot?.hasVehicles === true && Array.isArray(dataImpot.vehicles) && dataImpot.vehicles.length > 0;
        }

        if (impotCode === 'TFU') {
            return dataImpot?.possessionProprietes === true && Array.isArray(dataImpot.proprietes) && dataImpot.proprietes.length > 0;
        }

        return true;
    }

    public static async calculerEstimationGlobale(request: EntrepriseGeneralEstimationRequest): Promise<GlobalEstimationResult | BackendEstimationFailureResponse> {
        try {
            const resultats: Record<string, any> = {};
            const variablesEnter: Record<string, any[]> = {};
            const impotDetailCalcule: Record<string, any[]> = {};
            const obligationEcheance: Record<string, any[]> = {};
            const infosSupplementaires: Record<string, any[]> = {};
            const impotConfig: Record<string, any> = {};
            const errors: string[] = [];

            let totalEstimation = 0;
            let contribuableRegime = 'Entreprise - Régime Général';

            const chiffreAffaire = this.extraireChiffreAffaire(request);
            const regime = this.determinerRegime(chiffreAffaire);

            for (const [impotCode, dataImpot] of Object.entries(request.dataImpot)) {
                const codeUpper = impotCode.toUpperCase();
                const impotState = impotGeneralCalculationState.find((impot) => impot.impotCode === codeUpper);

                if (!impotState || impotState.state !== 'available') {
                    errors.push(`L'impôt ${impotCode} n'est pas disponible pour le calcul`);
                    continue;
                }

                if (this.IMPOTS_CONDITIONNELS.includes(codeUpper) && !this.estImpotConditionnelApplicable(codeUpper, dataImpot)) {
                    continue;
                }

                const resultat = await this.calculerImpot(codeUpper, dataImpot);
                if (resultat && 'success' in resultat && resultat.success === false) {
                    resultat.errors?.forEach((error: any) => errors.push(`${impotCode}: ${error.message}`));
                    continue;
                }

                if (!resultat || !('totalEstimation' in resultat)) {
                    errors.push(`${impotCode}: Le calcul a retourné un résultat vide`);
                    continue;
                }

                totalEstimation += resultat.totalEstimation;
                resultats[codeUpper] = resultat;
                variablesEnter[codeUpper] = Array.isArray(resultat.VariableEnter) ? resultat.VariableEnter : [resultat.VariableEnter];
                impotDetailCalcule[codeUpper] = Array.isArray(resultat.impotDetailCalcule) ? resultat.impotDetailCalcule : [resultat.impotDetailCalcule];
                obligationEcheance[codeUpper] = Array.isArray(resultat.obligationEcheance) ? resultat.obligationEcheance : [resultat.obligationEcheance];
                infosSupplementaires[codeUpper] = Array.isArray(resultat.infosSupplementaires) ? resultat.infosSupplementaires : [resultat.infosSupplementaires];
                impotConfig[codeUpper] = resultat.impotConfig;
            }

            if (Object.keys(resultats).length === 0 && regime === 'TPS' && chiffreAffaire > 0) {
                const tpsInput: TPSInput = {
                    chiffreAffaire,
                    periodeFiscale: this.extrairePeriodeFiscale(request),
                    typeEntreprise: this.extraireTypeEntreprise(request)
                };

                const resultatTPS = await MoteurTPSimplifie.calculerTPS(tpsInput);
                if (resultatTPS && 'totalEstimation' in resultatTPS && !('success' in resultatTPS && resultatTPS.success === false)) {
                    totalEstimation += resultatTPS.totalEstimation;
                    resultats['TPS'] = resultatTPS;
                    variablesEnter['TPS'] = Array.isArray(resultatTPS.VariableEnter) ? resultatTPS.VariableEnter : [resultatTPS.VariableEnter];
                    impotDetailCalcule['TPS'] = Array.isArray(resultatTPS.impotDetailCalcule) ? resultatTPS.impotDetailCalcule : [resultatTPS.impotDetailCalcule];
                    obligationEcheance['TPS'] = Array.isArray(resultatTPS.obligationEcheance) ? resultatTPS.obligationEcheance : [resultatTPS.obligationEcheance];
                    infosSupplementaires['TPS'] = Array.isArray(resultatTPS.infosSupplementaires) ? resultatTPS.infosSupplementaires : [resultatTPS.infosSupplementaires];
                    impotConfig['TPS'] = resultatTPS.impotConfig;
                    contribuableRegime = 'Entreprise - Régime TPS';
                } else if (resultatTPS && 'errors' in resultatTPS) {
                    resultatTPS.errors?.forEach((error: any) => errors.push(`TPS: ${error.message}`));
                }
            }

            if (Object.keys(resultats).length === 0) {
                return {
                    success: false,
                    totalEstimation: 0,
                    totalEstimationCurrency: 'FCFA',
                    contribuableRegime: 'Entreprise - Régime Général',
                    VariableEnter: {},
                    impotDetailCalcule: {},
                    obligationEcheance: {},
                    infosSupplementaires: {},
                    impotConfig: {},
                    estimationsParImpot: {},
                    errors: [errors.length > 0 ? errors.join('; ') : 'Aucun impôt n\'a pu être calculé.']
                };
            }

            return {
                success: true,
                totalEstimation: Math.round(totalEstimation),
                totalEstimationCurrency: 'FCFA',
                contribuableRegime,
                VariableEnter: variablesEnter,
                impotDetailCalcule,
                obligationEcheance,
                infosSupplementaires,
                impotConfig,
                estimationsParImpot: resultats,
                errors: errors.length > 0 ? errors : undefined
            };
        } catch (error) {
            return {
                success: false,
                totalEstimation: 0,
                totalEstimationCurrency: 'FCFA',
                contribuableRegime: 'Entreprise - Régime Général',
                VariableEnter: {},
                impotDetailCalcule: {},
                obligationEcheance: {},
                infosSupplementaires: {},
                impotConfig: {},
                estimationsParImpot: {},
                errors: [`Erreur générale: ${error instanceof Error ? error.message : 'Erreur inconnue'}`]
            };
        }
    }

    private static calculerImpot(impotCode: string, dataImpot: any): Promise<any> {
        switch (impotCode) {
            case 'AIB':
                return MoteurAIB.calculerAIBWithoutCCI_RedevanceSRTB(dataImpot as AIBInput);
            case 'IBA':
                return MoteurIBA.calculerIBA(dataImpot as IBAInput);
            case 'IRF':
                return MoteurIRF.calculerIRFWithoutRedevanceSRTB(dataImpot as IRFInput);
            case 'IS':
                return MoteurIS.calculerIS(dataImpot as ISInput);
            case 'PATENTE':
                return MoteurPatente.calculerPatente(dataImpot as PatenteInput);
            case 'TFU':
                return MoteurTFUEntreprise.calculerTFUEntreprise(dataImpot as TFUEntrepriseInput);
            case 'TVM':
                return MoteurTVM.calculerTVM(dataImpot as TVMInput);
            case 'TPS':
                return MoteurTPSimplifie.calculerTPS(dataImpot as TPSInput);
            case 'ITS':
                return MoteurITS.calculerITSWithoutRedevanceSRTB((dataImpot as ITSInput).salaireAnnuel, (dataImpot as ITSInput).periodeFiscale);
            default:
                return Promise.reject(new Error(`Type d'impôt non reconnu: ${impotCode}`));
        }
    }

    private static extraireChiffreAffaire(request: EntrepriseGeneralEstimationRequest | any): number {
        if (request.chiffreAffaire && typeof request.chiffreAffaire === 'number') {
            return request.chiffreAffaire;
        }

        if (request.dataImpot && typeof request.dataImpot === 'object') {
            for (const data of Object.values(request.dataImpot)) {
                const dataObj = data as any;
                if (dataObj && typeof dataObj.chiffreAffaire === 'number') {
                    return dataObj.chiffreAffaire;
                }
            }
        }

        return 0;
    }

    private static extrairePeriodeFiscale(request: EntrepriseGeneralEstimationRequest): string {
        if (request.periodeFiscale && typeof request.periodeFiscale === 'string') {
            return request.periodeFiscale;
        }

        for (const data of Object.values(request.dataImpot)) {
            if (data && typeof data === 'object' && data.periodeFiscale) {
                return data.periodeFiscale;
            }
        }

        throw new Error('La période fiscale est requise pour résoudre les paramètres fiscaux.');
    }

    private static extraireTypeEntreprise(request: EntrepriseGeneralEstimationRequest): TypeEntreprise {
        if (request.typeEntreprise) {
            return request.typeEntreprise;
        }

        for (const data of Object.values(request.dataImpot)) {
            if (data && typeof data === 'object' && 'typeEntreprise' in data && (data as TPSInput).typeEntreprise) {
                return (data as TPSInput).typeEntreprise;
            }
        }

        return TypeEntreprise.SOCIETE;
    }

    private static determinerRegime(chiffreAffaire: number): 'TPS' | 'REEL' {
        return chiffreAffaire >= this.SEUIL_REGIME_REEL ? 'REEL' : 'TPS';
    }
}

export const calculerEstimationGlobaleEntreprise = EntrepriseGeneralEstimation.calculerEstimationGlobale;
