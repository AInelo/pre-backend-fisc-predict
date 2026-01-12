import { Request, Response } from 'express';
import { calculerEstimationGlobaleEntreprise } from '../../../services/impots/general/entreprise.general.estimation';
import { BackendEstimationFailureResponse } from '../../../types/frontend.errors.estomation.type';

export class EntrepriseGeneralEstimationController {
    
    /**
     * Calcule l'estimation globale de tous les impôts pour une entreprise
     * POST /api/general/entreprise/estimation-globale
     */
    public static async calculerEstimationGlobale(req: Request, res: Response): Promise<void> {
        try {
            // Validation des données d'entrée
            if (!req.body || !req.body.dataImpot) {
                const errorResponse: BackendEstimationFailureResponse = {
                    success: false,
                    errors: [
                        {
                            code: 'MISSING_DATA',
                            message: 'Les données d\'impôts sont requises dans le corps de la requête',
                            details: 'Le champ "dataImpot" est obligatoire',
                            severity: 'error'
                        }
                    ],
                    context: {
                        typeContribuable: 'Entreprise',
                        regime: 'Général'
                    },
                    timestamp: new Date().toISOString(),
                    requestId: `estimation_globale_${Date.now()}`
                };
                
                res.status(400).json({
                    success: false,
                    message: 'Données manquantes',
                    data: errorResponse
                });
                return;
            }

            // Validation que dataImpot est un objet non vide
            if (typeof req.body.dataImpot !== 'object' || Object.keys(req.body.dataImpot).length === 0) {
                const errorResponse: BackendEstimationFailureResponse = {
                    success: false,
                    errors: [
                        {
                            code: 'EMPTY_DATA',
                            message: 'Les données d\'impôts ne peuvent pas être vides',
                            details: 'Le champ "dataImpot" doit contenir au moins un impôt à calculer',
                            severity: 'error'
                        }
                    ],
                    context: {
                        typeContribuable: 'Entreprise',
                        regime: 'Général'
                    },
                    timestamp: new Date().toISOString(),
                    requestId: `estimation_globale_${Date.now()}`
                };
                
                res.status(400).json({
                    success: false,
                    message: 'Données vides',
                    data: errorResponse
                });
                return;
            }

            // Log pour déboguer les données reçues
            console.log(`[DEBUG] Données reçues dans le contrôleur:`, JSON.stringify({
                hasChiffreAffaire: 'chiffreAffaire' in req.body,
                chiffreAffaire: req.body.chiffreAffaire,
                hasDataImpot: 'dataImpot' in req.body,
                dataImpotKeys: req.body.dataImpot ? Object.keys(req.body.dataImpot) : [],
                allKeys: Object.keys(req.body || {})
            }));

            // Appeler le service de calcul
            const resultat = calculerEstimationGlobaleEntreprise(req.body);
            
            // Retourner le résultat
            if (resultat && 'success' in resultat && resultat.success === true) {
                res.status(200).json({
                    success: true,
                    message: 'Estimation globale calculée avec succès',
                    data: resultat
                });
            } else {
                // Gérer les erreurs de calcul
                let errorDetails = 'Erreur inconnue lors du calcul';
                if (resultat && 'errors' in resultat) {
                    if (Array.isArray(resultat.errors)) {
                        errorDetails = resultat.errors.join('; ');
                    } else if (typeof resultat.errors === 'string') {
                        errorDetails = resultat.errors;
                    }
                }

                // Ajouter des informations de débogage si disponibles
                const debugInfo = resultat && 'estimationsParImpot' in resultat 
                    ? ` Impôts traités: ${Object.keys(resultat.estimationsParImpot || {}).join(', ')}`
                    : '';

                const errorResponse: BackendEstimationFailureResponse = {
                    success: false,
                    errors: [
                        {
                            code: 'CALCULATION_ERROR',
                            message: 'Erreur lors du calcul de l\'estimation globale',
                            details: errorDetails + debugInfo,
                            severity: 'error'
                        }
                    ],
                    context: {
                        typeContribuable: 'Entreprise',
                        regime: 'Général'
                    },
                    timestamp: new Date().toISOString(),
                    requestId: `estimation_globale_${Date.now()}`
                };
                
                res.status(400).json({
                    success: false,
                    message: 'Erreur lors du calcul de l\'estimation globale',
                    data: errorResponse
                });
            }

        } catch (error) {
            console.error('Erreur dans le contrôleur d\'estimation globale:', error);
            
            const errorResponse: BackendEstimationFailureResponse = {
                success: false,
                errors: [
                    {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Erreur interne du serveur',
                        details: error instanceof Error ? error.message : 'Erreur inconnue',
                        severity: 'error'
                    }
                ],
                context: {
                    typeContribuable: 'Entreprise',
                    regime: 'Général'
                },
                timestamp: new Date().toISOString(),
                requestId: `estimation_globale_${Date.now()}`
            };
            
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur',
                data: errorResponse
            });
        }
    }

    /**
     * Récupère la liste des impôts disponibles pour le calcul
     * GET /api/general/entreprise/impots-disponibles
     */
    public static async getImpotsDisponibles(req: Request, res: Response): Promise<void> {
        try {
            // Importer l'état des impôts
            const { impotGeneralCalculationState } = await import('../../../services/impots/general/impot.general.calculation.state');
            
            // Filtrer seulement les impôts disponibles
            const impotsDisponibles = impotGeneralCalculationState
                .filter((impot: any) => impot.state === 'available')
                .map((impot: any) => ({
                    code: impot.impotCode,
                    nom: this.getNomImpot(impot.impotCode),
                    description: this.getDescriptionImpot(impot.impotCode)
                }));

            res.status(200).json({
                success: true,
                message: 'Liste des impôts disponibles récupérée avec succès',
                data: {
                    total: impotsDisponibles.length,
                    impots: impotsDisponibles
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des impôts disponibles:', error);
            
            const errorResponse: BackendEstimationFailureResponse = {
                success: false,
                errors: [
                    {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Erreur interne du serveur',
                        details: error instanceof Error ? error.message : 'Erreur inconnue',
                        severity: 'error'
                    }
                ],
                context: {
                    typeContribuable: 'Entreprise',
                    regime: 'Général'
                },
                timestamp: new Date().toISOString(),
                requestId: `impots_disponibles_${Date.now()}`
            };
            
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur',
                data: errorResponse
            });
        }
    }

    /**
     * Récupère les informations détaillées d'un impôt spécifique
     * GET /api/general/entreprise/impot/:code
     */
    public static async getImpotDetails(req: Request, res: Response): Promise<void> {
        try {
            const { code } = req.params;
            
            if (!code) {
                const errorResponse: BackendEstimationFailureResponse = {
                    success: false,
                    errors: [
                        {
                            code: 'MISSING_CODE',
                            message: 'Le code de l\'impôt est requis',
                            details: 'Le paramètre "code" est obligatoire dans l\'URL',
                            severity: 'error'
                        }
                    ],
                    context: {
                        typeContribuable: 'Entreprise',
                        regime: 'Général'
                    },
                    timestamp: new Date().toISOString(),
                    requestId: `impot_details_${Date.now()}`
                };
                
                res.status(400).json({
                    success: false,
                    message: 'Code manquant',
                    data: errorResponse
                });
                return;
            }

            // Importer l'état des impôts
            const { impotGeneralCalculationState } = await import('../../../services/impots/general/impot.general.calculation.state');
            
            // Trouver l'impôt
            const impot = impotGeneralCalculationState.find((impot: any) => 
                impot.impotCode === code.toUpperCase()
            );

            if (!impot) {
                const errorResponse: BackendEstimationFailureResponse = {
                    success: false,
                    errors: [
                        {
                            code: 'IMPOT_NOT_FOUND',
                            message: `Impôt avec le code "${code}" non trouvé`,
                            details: 'Le code d\'impôt spécifié n\'existe pas dans le système',
                            severity: 'error'
                        }
                    ],
                    context: {
                        typeContribuable: 'Entreprise',
                        regime: 'Général'
                    },
                    timestamp: new Date().toISOString(),
                    requestId: `impot_details_${Date.now()}`
                };
                
                res.status(404).json({
                    success: false,
                    message: 'Impôt non trouvé',
                    data: errorResponse
                });
                return;
            }

            res.status(200).json({
                success: true,
                message: 'Informations de l\'impôt récupérées avec succès',
                data: {
                    code: impot.impotCode,
                    nom: this.getNomImpot(impot.impotCode),
                    description: this.getDescriptionImpot(impot.impotCode),
                    statut: impot.state,
                    disponible: impot.state === 'available'
                }
            });

        } catch (error) {
            console.error('Erreur lors de la récupération des détails de l\'impôt:', error);
            
            const errorResponse: BackendEstimationFailureResponse = {
                success: false,
                errors: [
                    {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Erreur interne du serveur',
                        details: error instanceof Error ? error.message : 'Erreur inconnue',
                        severity: 'error'
                    }
                ],
                context: {
                    typeContribuable: 'Entreprise',
                    regime: 'Général'
                },
                timestamp: new Date().toISOString(),
                requestId: `impot_details_${Date.now()}`
            };
            
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur',
                data: errorResponse
            });
        }
    }

    // Méthodes utilitaires privées
    private static getNomImpot(code: string): string {
        const noms: Record<string, string> = {
            'AIB': 'Accompte sur l\'Impôt sur les Bénéfices',
            'IS': 'Impôt sur les Sociétés',
            'TFU': 'Taxe Foncière Urbaine',
            'IRF': 'Impôt sur les Revenus Fonciers',
            'ITS': 'Impôt sur les Traitements et Salaires',
            'IBA': 'Impôt sur le Bénéfice d\'Affaire',
            'PATENTE': 'Patente',
            'TVM': 'Taxe sur les Véhicules à Moteur',
            'TVA': 'Taxe sur la Valeur Ajoutée',
            'VPS': 'Versement Patronal de Sécurité',
            'IRCM': 'Impôt sur les Revenus des Capitaux Mobiliers',
            'TPS': 'Taxe Professionnelle Synthétique'
        };
        return noms[code] || code;
    }

    private static getDescriptionImpot(code: string): string {
        const descriptions: Record<string, string> = {
            'AIB': 'Acompte mensuel sur l\'impôt sur les bénéfices',
            'IS': 'Impôt direct sur le bénéfice des entreprises',
            'TFU': 'Taxe foncière sur les propriétés urbaines',
            'IRF': 'Impôt sur les revenus locatifs',
            'ITS': 'Impôt sur les salaires et traitements',
            'IBA': 'Impôt sur le bénéfice des entrepreneurs individuels',
            'PATENTE': 'Taxe locale sur les établissements commerciaux',
            'TVM': 'Taxe annuelle sur les véhicules à moteur',
            'TVA': 'Taxe sur la consommation',
            'VPS': 'Contribution patronale de sécurité sociale',
            'IRCM': 'Impôt sur les revenus de placements',
            'TPS': 'Taxe professionnelle simplifiée pour petites entreprises'
        };
        return descriptions[code] || 'Description non disponible';
    }
}

// Export des méthodes du contrôleur
export const calculerEstimationGlobale = EntrepriseGeneralEstimationController.calculerEstimationGlobale;
export const getImpotsDisponibles = EntrepriseGeneralEstimationController.getImpotsDisponibles;
export const getImpotDetails = EntrepriseGeneralEstimationController.getImpotDetails;
