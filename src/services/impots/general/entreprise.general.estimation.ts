import { impotGeneralCalculationState } from './impot.general.calculation.state';
import { GlobalEstimationInfoData } from '../../../types/frontend.result.return.type';

import {
    BackendEstimationError,
    BackendEstimationFailureResponse,
    BackendEstimationContext
} from '../../../types/frontend.errors.estomation.type';

// Interface pour l'estimation globale qui étend GlobalEstimationInfoData
interface GlobalEstimationResult extends GlobalEstimationInfoData {
    success: boolean;
    estimationsParImpot: Record<string, any>;
    errors?: string[];
}

import MoteurTPSimplifie, { TypeEntreprise } from './tps/TPS.general';
import MoteurAIB from './reel/AIB.general';
import MoteurIBA from './reel/IBA.general';
import MoteurIRF from './reel/IRF.general';
import MoteurIS from './reel/IS.general';
import MoteurPatente from './reel/PATENTE.general';
import MoteurITS from './reel/ITS.general';
import MoteurTFUEntreprise from './reel/TFU.general.entreprise';
import MoteurTVM from './reel/TVM.general';




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
    etablissements: Etablissement[];
    isImporter?: boolean;
    importExportAmount?: number;
}

interface Etablissement {
    location: 
        | 'cotonou' 
        | 'porto-novo' 
        | 'ouidah' 
        | 'abomey' 
        | 'parakou' 
        | 'other-zone1' 
        | 'other-zone2' 
        | 'alibori' 
        | 'atacora' 
        | 'borgou' 
        | 'donga' 
        | 'atlantique' 
        | 'collines' 
        | 'couffo' 
        | 'littoral' 
        | 'mono' 
        | 'oueme' 
        | 'plateau' 
        | 'zou';
    
    rentalValue: number;
    nom?: string;     // Nom de l'établissement (optionnel)
    adresse?: string; // Adresse (optionnel)
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
    typeEntreprise: TypeEntreprise;
}


// INTERFACE FOR THE ENTIRE CALCULATION REQUEST FROM THE FRONTEND

interface EntrepriseGeneralEstimationRequest {
    dataImpot: Record<string, AIBInput | IBAInput | IRFInput | ISInput | PatenteInput | ITSInput | TFUEntrepriseInput | TVMInput | TPSInput>;
    chiffreAffaire?: number;  // Chiffre d'affaires global (optionnel, peut être dans dataImpot)
    periodeFiscale?: string;  // Période fiscale globale (optionnel, peut être dans dataImpot)
    typeEntreprise?: TypeEntreprise;  // Type d'entreprise global (optionnel)
}



// MÉTHODE PRINCIPALE POUR L'ESTIMATION GLOBALE DES IMPÔTS DES ENTREPRISES
export class EntrepriseGeneralEstimation {

    // Liste des impôts conditionnels (optionnels) - ne génèrent pas d'erreur s'ils ne sont pas applicables
    private static readonly IMPOTS_CONDITIONNELS = ['TVM', 'TFU'];
    
    // Seuil pour déterminer le régime TPS vs REEL
    private static readonly SEUIL_REGIME_REEL = 50_000_000;

    // Méthode pour vérifier si un impôt conditionnel est applicable
    private static estImpotConditionnelApplicable(impotCode: string, dataImpot: any): boolean {
        const codeUpper = impotCode.toUpperCase();
        
        if (codeUpper === 'TVM') {
            // TVM est applicable seulement si hasVehicles est explicitement true ET qu'il y a des véhicules
            // Si hasVehicles est false, null, undefined ou absent, l'impôt n'est pas applicable
            if (dataImpot?.hasVehicles !== true) {
                return false;
            }
            return Array.isArray(dataImpot.vehicles) && dataImpot.vehicles.length > 0;
        }
        
        if (codeUpper === 'TFU') {
            // TFU est applicable seulement si possessionProprietes est explicitement true ET qu'il y a des propriétés
            // Si possessionProprietes est false, null, undefined ou absent, l'impôt n'est pas applicable
            if (dataImpot?.possessionProprietes !== true) {
                return false;
            }
            return Array.isArray(dataImpot.proprietes) && dataImpot.proprietes.length > 0;
        }
        
        // Pour les autres impôts, on considère qu'ils sont toujours applicables
        return true;
    }

    public static calculerEstimationGlobale(request: EntrepriseGeneralEstimationRequest): GlobalEstimationResult | BackendEstimationFailureResponse {
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

            // Extraire le chiffre d'affaires pour déterminer le régime
            const chiffreAffaire = EntrepriseGeneralEstimation.extraireChiffreAffaire(request);
            const regime = EntrepriseGeneralEstimation.determinerRegime(chiffreAffaire);
            console.log(`[DEBUG] Chiffre d'affaires extrait: ${chiffreAffaire}, Régime déterminé: ${regime}`);

            // Traiter chaque impôt dans la requête
            console.log(`[DEBUG] Traitement de ${Object.keys(request.dataImpot).length} impôt(s):`, Object.keys(request.dataImpot));
            
            for (const [impotCode, dataImpot] of Object.entries(request.dataImpot)) {
                console.log(`[DEBUG] Traitement de l'impôt: ${impotCode}`);
                
                // Vérifier si l'impôt est disponible
                const impotState = impotGeneralCalculationState.find(impot =>
                    impot.impotCode === impotCode.toUpperCase()
                );

                if (!impotState || impotState.state !== 'available') {
                    const errorMsg = `L'impôt ${impotCode} n'est pas disponible pour le calcul`;
                    console.log(`[DEBUG] ${errorMsg}`);
                    errors.push(errorMsg);
                    continue;
                }

                // Vérifier si l'impôt conditionnel est applicable avant de le calculer
                const codeUpper = impotCode.toUpperCase();
                if (EntrepriseGeneralEstimation.IMPOTS_CONDITIONNELS.includes(codeUpper)) {
                    const estApplicable = EntrepriseGeneralEstimation.estImpotConditionnelApplicable(codeUpper, dataImpot);
                    console.log(`[DEBUG] ${impotCode} est conditionnel, applicable: ${estApplicable}`);
                    if (!estApplicable) {
                        // Ignorer silencieusement les impôts conditionnels non applicables
                        console.log(`[DEBUG] ${impotCode} ignoré car non applicable`);
                        continue;
                    }
                }

                try {
                    // Calculer l'impôt selon son type
                    console.log(`[DEBUG] Calcul de ${impotCode}...`);
                    const resultat = EntrepriseGeneralEstimation.calculerImpot(impotCode, dataImpot);
                    console.log(`[DEBUG] Résultat de ${impotCode}:`, resultat ? (resultat.success !== false ? 'SUCCÈS' : 'ERREUR') : 'NULL/UNDEFINED');

                    // Vérifier si le résultat est une erreur
                    if (resultat && 'success' in resultat && resultat.success === false) {
                        console.log(`[DEBUG] ${impotCode} a retourné une erreur`);
                        // Pour les impôts conditionnels, vérifier si l'erreur est due à l'absence de données
                        if (EntrepriseGeneralEstimation.IMPOTS_CONDITIONNELS.includes(codeUpper)) {
                            // Vérifier si l'erreur est liée à l'absence de données (non applicable)
                            const errorMessage = 'errors' in resultat && resultat.errors && Array.isArray(resultat.errors) 
                                ? resultat.errors[0]?.message || ''
                                : '';
                            
                            // Messages d'erreur possibles pour les impôts conditionnels non applicables
                            const messagesNonApplicables = [
                                'Aucun véhicule',
                                'Aucune propriété',
                                'liste des propriétés est vide',
                                'Aucun véhicule déclaré',
                                'Aucune propriété déclarée'
                            ];
                            
                            if (messagesNonApplicables.some(msg => errorMessage.includes(msg))) {
                                // Ignorer silencieusement - l'impôt n'est simplement pas applicable
                                continue;
                            }
                        }
                        
                        // Gérer les erreurs de calcul pour les impôts obligatoires
                        // Ne pas ignorer les erreurs des impôts obligatoires
                        if ('errors' in resultat && resultat.errors) {
                            resultat.errors.forEach((error: any) => {
                                errors.push(`${impotCode}: ${error.message}`);
                            });
                        }
                        continue;
                    }

                    // Vérifier si le résultat contient totalEstimation (succès)
                    if (resultat && 'totalEstimation' in resultat) {
                        console.log(`[DEBUG] ${impotCode} calculé avec succès: ${resultat.totalEstimation} FCFA`);
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
                    } else if (!resultat) {
                        // Si le résultat est null ou undefined, c'est une erreur
                        errors.push(`${impotCode}: Le calcul a retourné un résultat vide`);
                    }

                } catch (error) {
                    // Capturer les exceptions non gérées
                    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
                    const errorStack = error instanceof Error ? error.stack : '';
                    errors.push(`Erreur lors du calcul de ${impotCode}: ${errorMessage}`);
                    console.error(`Erreur détaillée pour ${impotCode}:`, errorMessage, errorStack);
                }
            }

            // Vérifier s'il y a des résultats
            console.log(`[DEBUG] Nombre d'impôts calculés avec succès: ${Object.keys(resultats).length}`);
            console.log(`[DEBUG] Impôts calculés:`, Object.keys(resultats));
            console.log(`[DEBUG] Nombre d'erreurs collectées: ${errors.length}`);
            console.log(`[DEBUG] Erreurs:`, errors);
            
            // Si aucun impôt n'a été calculé et que le régime est TPS, calculer automatiquement la TPS
            if (Object.keys(resultats).length === 0 && regime === 'TPS') {
                if (chiffreAffaire <= 0) {
                    console.log(`[DEBUG] Impossible de calculer la TPS automatiquement: chiffre d'affaires non trouvé ou invalide`);
                    errors.push('Le chiffre d\'affaires est requis pour calculer la TPS. Veuillez fournir le chiffre d\'affaires dans votre requête.');
                } else {
                    console.log(`[DEBUG] Aucun impôt calculé, calcul automatique de la TPS pour régime TPS`);
                    
                    try {
                        // Préparer les données TPS
                        const tpsInput: TPSInput = {
                            chiffreAffaire: chiffreAffaire,
                            periodeFiscale: EntrepriseGeneralEstimation.extrairePeriodeFiscale(request),
                            typeEntreprise: EntrepriseGeneralEstimation.extraireTypeEntreprise(request)
                        };

                        console.log(`[DEBUG] Données TPS préparées:`, tpsInput);

                        // Calculer la TPS
                        const resultatTPS = MoteurTPSimplifie.calculerTPS(tpsInput);
                        
                        // Vérifier que le résultat est un succès (GlobalEstimationInfoData) et non une erreur
                        if (resultatTPS && 'totalEstimation' in resultatTPS && !('success' in resultatTPS && resultatTPS.success === false)) {
                            const tpsResult = resultatTPS as GlobalEstimationInfoData;
                            console.log(`[DEBUG] TPS calculée automatiquement avec succès: ${tpsResult.totalEstimation} FCFA`);
                            
                            totalEstimation += tpsResult.totalEstimation;
                            resultats['TPS'] = tpsResult;
                            contribuableRegime = 'Entreprise - Régime TPS';

                            // Extraire les composants pour la réponse globale
                            if (tpsResult.VariableEnter) {
                                variablesEnter['TPS'] = Array.isArray(tpsResult.VariableEnter)
                                    ? tpsResult.VariableEnter
                                    : [tpsResult.VariableEnter];
                            }

                            if (tpsResult.impotDetailCalcule) {
                                impotDetailCalcule['TPS'] = Array.isArray(tpsResult.impotDetailCalcule)
                                    ? tpsResult.impotDetailCalcule
                                    : [tpsResult.impotDetailCalcule];
                            }

                            if (tpsResult.obligationEcheance) {
                                obligationEcheance['TPS'] = Array.isArray(tpsResult.obligationEcheance)
                                    ? tpsResult.obligationEcheance
                                    : [tpsResult.obligationEcheance];
                            }

                            if (tpsResult.infosSupplementaires) {
                                infosSupplementaires['TPS'] = Array.isArray(tpsResult.infosSupplementaires)
                                    ? tpsResult.infosSupplementaires
                                    : [tpsResult.infosSupplementaires];
                            }

                            if (tpsResult.impotConfig) {
                                impotConfig['TPS'] = tpsResult.impotConfig;
                            }
                        } else {
                            console.error(`[ERROR] Échec du calcul automatique de la TPS`);
                            errors.push('Impossible de calculer automatiquement la TPS');
                        }
                    } catch (error) {
                        console.error(`[ERROR] Erreur lors du calcul automatique de la TPS:`, error);
                        errors.push(`Erreur lors du calcul automatique de la TPS: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
                    }
                }
            }
            
            if (Object.keys(resultats).length === 0) {
                // Ajouter des informations de débogage dans les erreurs
                const debugInfo = errors.length > 0 
                    ? errors.join('; ') 
                    : 'Aucun impôt n\'a pu être calculé. Vérifiez que les données d\'entrée sont correctes.';
                
                console.error(`[ERROR] Aucun impôt calculé. Erreurs:`, debugInfo);
                
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
                    errors: [debugInfo]
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
                return MoteurAIB.calculerAIBWithoutCCI_RedevanceSRTB(dataImpot as AIBInput)
                // calculerAIB(dataImpot as AIBInput);

            case 'IBA':
                return MoteurIBA.calculerIBA(dataImpot as IBAInput);

            case 'IRF':
                return MoteurIRF.calculerIRFWithoutRedevanceSRTB(dataImpot as IRFInput)
                // calculerIRF(dataImpot as IRFInput);

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
                return MoteurTPSimplifie.calculerTPS(dataImpot as TPSInput);

            case 'ITS':
                const itsData = dataImpot as ITSInput;
                return MoteurITS.calculerITSWithoutRedevanceSRTB(itsData.salaireAnnuel, itsData.periodeFiscale)
                // calculerITS(itsData.salaireAnnuel, itsData.periodeFiscale);

            default:
                throw new Error(`Type d'impôt non reconnu: ${impotCode}`);
        }
    }

    // Méthodes utilitaires pour extraire les données nécessaires
    private static extraireChiffreAffaire(request: EntrepriseGeneralEstimationRequest | any): number {
        console.log(`[DEBUG] Extraction du chiffre d'affaires depuis:`, JSON.stringify(Object.keys(request || {})));
        
        // 1. Chercher d'abord dans le body directement avec différentes variantes
        if (request.chiffreAffaire && typeof request.chiffreAffaire === 'number') {
            console.log(`[DEBUG] Chiffre d'affaires trouvé dans request.chiffreAffaire: ${request.chiffreAffaire}`);
            return request.chiffreAffaire;
        }
        
        // Chercher avec d'autres noms possibles
        if (request.chiffreAffaires && typeof request.chiffreAffaires === 'number') {
            console.log(`[DEBUG] Chiffre d'affaires trouvé dans request.chiffreAffaires: ${request.chiffreAffaires}`);
            return request.chiffreAffaires;
        }
        
        if (request.ca && typeof request.ca === 'number') {
            console.log(`[DEBUG] Chiffre d'affaires trouvé dans request.ca: ${request.ca}`);
            return request.ca;
        }
        
        // 2. Chercher dans les différents impôts qui contiennent le chiffre d'affaires
        if (request.dataImpot && typeof request.dataImpot === 'object') {
            for (const [code, data] of Object.entries(request.dataImpot)) {
                if (data && typeof data === 'object') {
                    const dataObj = data as any;
                    // Vérifier si c'est un type qui contient chiffreAffaire
                    if ('chiffreAffaire' in dataObj && typeof dataObj.chiffreAffaire === 'number') {
                        console.log(`[DEBUG] Chiffre d'affaires trouvé dans ${code}.chiffreAffaire: ${dataObj.chiffreAffaire}`);
                        return dataObj.chiffreAffaire;
                    }
                    // Chercher avec d'autres variantes
                    if ('chiffreAffaires' in dataObj && typeof dataObj.chiffreAffaires === 'number') {
                        console.log(`[DEBUG] Chiffre d'affaires trouvé dans ${code}.chiffreAffaires: ${dataObj.chiffreAffaires}`);
                        return dataObj.chiffreAffaires;
                    }
                    if ('ca' in dataObj && typeof dataObj.ca === 'number') {
                        console.log(`[DEBUG] Chiffre d'affaires trouvé dans ${code}.ca: ${dataObj.ca}`);
                        return dataObj.ca;
                    }
                }
            }
        }
        
        console.log(`[DEBUG] Aucun chiffre d'affaires trouvé dans la requête`);
        return 0;
    }

    private static extrairePeriodeFiscale(request: EntrepriseGeneralEstimationRequest): string {
        // 1. Chercher d'abord dans le body directement
        if (request.periodeFiscale && typeof request.periodeFiscale === 'string') {
            return request.periodeFiscale;
        }
        
        // 2. Chercher dans les données des impôts
        for (const [code, data] of Object.entries(request.dataImpot)) {
            if (data && typeof data === 'object' && data.periodeFiscale) {
                return data.periodeFiscale;
            }
        }
        // Par défaut, utiliser l'année courante
        return new Date().getFullYear().toString();
    }

    private static extraireTypeEntreprise(request: EntrepriseGeneralEstimationRequest): TypeEntreprise {
        // 1. Chercher d'abord dans le body directement
        if (request.typeEntreprise) {
            return request.typeEntreprise;
        }
        
        // 2. Chercher dans les données des impôts (seulement TPS contient typeEntreprise)
        for (const [code, data] of Object.entries(request.dataImpot)) {
            if (data && typeof data === 'object' && 'typeEntreprise' in data) {
                const tpsData = data as TPSInput;
                if (tpsData.typeEntreprise) {
                    return tpsData.typeEntreprise;
                }
            }
        }
        // Par défaut, utiliser SOCIETE
        return TypeEntreprise.SOCIETE;
    }

    private static determinerRegime(chiffreAffaire: number): 'TPS' | 'REEL' {
        return chiffreAffaire >= this.SEUIL_REGIME_REEL ? 'REEL' : 'TPS';
    }
}

// EXPORT DE LA MÉTHODE PRINCIPALE
export const calculerEstimationGlobaleEntreprise = EntrepriseGeneralEstimation.calculerEstimationGlobale;

