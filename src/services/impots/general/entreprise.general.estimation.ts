import {impotGeneralCalculationState} from './impot.general.calculation.state';
import { GlobalEstimationInfoData } from '../../../types/frontend.result.return.type';

import {
    BackendEstimationError, 
    BackendEstimationFailureResponse, 
    BackendEstimationContext 
} from '../../../types/frontend.errors.estomation.type';

import MoteurTPSimplifie from './tps/TPS.general';
import MoteurAIB from './reel/AIB.general';
import MoteurIBA from './reel/IBA.general';
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
    secteur: 'education' | 'industry' | 'real-estate' | 'construction' | 'gas-station' | 'general';
    location?: string;
    isArtisanWithFamily?: boolean;
    periodeFiscale: string;
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
    location: 'cotonou' | 'porto-novo' | 'ouidah' | 'abomey' | 'parakou' | 'other-zone1' | 'other-zone2' | 'alibori' | 'atacora' | 'borgou' | 'donga' | 'atlantique' | 'collines' | 'couffo' | 'littoral' | 'mono' | 'oueme' | 'plateau' | 'zou';
    rentalValue: number;
    isImporter?: boolean;
    importExportAmount?: number;
    periodeFiscale: string;
}


interface ITSInput {
    salaireAnnuel: number;
    periodeFiscale: string;
}

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

interface TVMInput {
    hasVehicles: boolean;
    vehicles: VehicleInput[];
    periodeFiscale: string;
}

interface VehicleInput {
    vehicleType: 'tricycle' | 'company' | 'private' | 'public-persons' | 'public-goods';
    power?: number;
    capacity?: number;
}

interface TPSInput {
    chiffreAffaire: number;
    periodeFiscale: string;
}


// INTERFACE FOR THE ENTIRE CALCULATION REQUEST FROM THE FRONTEND

interface EntrepriseGeneralEstimationRequest {
    dataImpot : Record<string, AIBInput | IBAInput | IRFInput | ISInput | PatenteInput | ITSInput | TFUEntrepriseInput | TVMInput | TPSInput>;
}

// INTERFACE FOR THE GLOBAL ESTIMATION RESPONSE
interface EntrepriseGeneralEstimationResponse {
    success: boolean;
    totalEstimation: number;
    totalEstimationCurrency: string;
    contribuableRegime: string;
    VariableEnter: Record<string, any[]>;
    impotDetailCalcule: Record<string, any[]>;
    obligationEcheance: Record<string, any[]>;
    infosSupplementaires: Record<string, any[]>;
    impotConfig: Record<string, any>;
    estimationsParImpot: Record<string, any>;
    errors?: string[];
}

// MÉTHODE PRINCIPALE POUR L'ESTIMATION GLOBALE DES IMPÔTS DES ENTREPRISES
export class EntrepriseGeneralEstimation {
    
    public static calculerEstimationGlobale(request: EntrepriseGeneralEstimationRequest): EntrepriseGeneralEstimationResponse {
        try {
            const resultats: Record<string, any> = {};
            const variablesEnter: Record<string, any[]> = {};
            const impotDetailCalcule: Record<string, any[]> = {};
            const obligationEcheance: Record<string, any[]> = {};
            const infosSupplementaires: Record<string, any[]> = {};
            const impotConfig: Record<string, any> = {};
            const errors: string[] = [];
            
            let totalEstimation = 0;
            let totalEstimationCurrency = 'FCFA';
            let contribuableRegime = 'Entreprise - Régime Général';

            // Traiter chaque impôt dans la requête
            for (const [impotCode, dataImpot] of Object.entries(request.dataImpot)) {
                // Vérifier si l'impôt est disponible
                const impotState = impotGeneralCalculationState.find(impot => 
                    impot.impotCode === impotCode.toUpperCase()
                );

                if (!impotState || impotState.state !== 'available') {
                    errors.push(`L'impôt ${impotCode} n'est pas disponible pour le calcul`);
                    continue;
                }

                try {
                    // Calculer l'impôt selon son type
                    const resultat = this.calculerImpot(impotCode, dataImpot);
                    
                    if (resultat && 'success' in resultat && resultat.success === false) {
                        // Gérer les erreurs de calcul
                        if ('errors' in resultat && resultat.errors) {
                            resultat.errors.forEach((error: any) => {
                                errors.push(`${impotCode}: ${error.message}`);
                            });
                        }
                        continue;
                    }

                    if (resultat && 'totalEstimation' in resultat) {
                        // Ajouter le résultat au total
                        totalEstimation += resultat.totalEstimation;
                        
                        // Stocker le résultat complet
                        resultats[impotCode] = resultat;
                        
                        // Extraire les composants pour la réponse globale
                        if (resultat.VariableEnter) {
                            variablesEnter[impotCode] = Array.isArray(resultat.VariableEnter) 
                                ? resultat.VariableEnter 
                                : [resultat.VariableEnter];
                        }
                        
                        if (resultat.impotDetailCalcule) {
                            impotDetailCalcule[impotCode] = Array.isArray(resultat.impotDetailCalcule) 
                                ? resultat.impotDetailCalcule 
                                : [resultat.impotDetailCalcule];
                        }
                        
                        if (resultat.obligationEcheance) {
                            obligationEcheance[impotCode] = Array.isArray(resultat.obligationEcheance) 
                                ? resultat.obligationEcheance 
                                : [resultat.obligationEcheance];
                        }
                        
                        if (resultat.infosSupplementaires) {
                            infosSupplementaires[impotCode] = Array.isArray(resultat.infosSupplementaires) 
                                ? resultat.infosSupplementaires 
                                : [resultat.infosSupplementaires];
                        }
                        
                        if (resultat.impotConfig) {
                            impotConfig[impotCode] = resultat.impotConfig;
                        }
                    }
                    
                } catch (error) {
                    errors.push(`Erreur lors du calcul de ${impotCode}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
                }
            }

            // Vérifier s'il y a des résultats
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
                    errors: errors.length > 0 ? errors : ['Aucun impôt n\'a pu être calculé']
                };
            }

            return {
                success: true,
                totalEstimation: Math.round(totalEstimation),
                totalEstimationCurrency,
                contribuableRegime,
                VariableEnter: variablesEnter,
                impotDetailCalcule: impotDetailCalcule,
                obligationEcheance: obligationEcheance,
                infosSupplementaires: infosSupplementaires,
                impotConfig: impotConfig,
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

    // MÉTHODE PRIVÉE POUR CALCULER UN IMPÔT SPÉCIFIQUE
    private static calculerImpot(impotCode: string, dataImpot: any): any {
        const codeUpper = impotCode.toUpperCase();
        
        switch (codeUpper) {
            case 'AIB':
                return MoteurAIB.calculerAIB(dataImpot as AIBInput);
                
            case 'IBA':
                return MoteurIBA.calculerIBA(dataImpot as IBAInput);
                
            case 'IRF':
                return MoteurIRF.calculerIRF(dataImpot as IRFInput);
                
            case 'IS':
                return MoteurIS.calculerIS(dataImpot as ISInput);
                
            case 'PATENTE':
                return MoteurPatente.calculerPatente(dataImpot as PatenteInput);
                
            case 'TFU':
                return MoteurTFUEntreprise.calculerTFUEntreprise(dataImpot as TFUEntrepriseInput);
                
            case 'TVM':
                return MoteurTVM.calculerTVM(dataImpot as TVMInput);
                
            case 'TPS':
                const tpsData = dataImpot as TPSInput;
                return MoteurTPSimplifie.calculerTPS(tpsData.chiffreAffaire, tpsData.periodeFiscale);
                
            case 'ITS':
                // TODO: Implémenter quand le moteur ITS sera disponible
                throw new Error(`Le moteur pour l'impôt ${impotCode} n'est pas encore implémenté`);
                
            default:
                throw new Error(`Type d'impôt non reconnu: ${impotCode}`);
        }
    }
}

// EXPORT DE LA MÉTHODE PRINCIPALE
export const calculerEstimationGlobaleEntreprise = EntrepriseGeneralEstimation.calculerEstimationGlobale;













