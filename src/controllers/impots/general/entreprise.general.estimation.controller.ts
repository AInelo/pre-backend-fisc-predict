import { Request, Response } from 'express';
import { calculerEstimationGlobaleEntreprise } from '../../../services/impots/general/entreprise.general.estimation';

export class EntrepriseGeneralEstimationController {
    
    /**
     * Calcule l'estimation globale de tous les impôts pour une entreprise
     * POST /api/general/entreprise/estimation-globale
     */
    public static async calculerEstimationGlobale(req: Request, res: Response): Promise<void> {
        try {
            // Validation des données d'entrée
            if (!req.body || !req.body.dataImpot) {
                res.status(400).json({
                    success: false,
                    message: 'Les données d\'impôts sont requises dans le corps de la requête',
                    details: 'Le champ "dataImpot" est obligatoire'
                });
                return;
            }

            // Validation que dataImpot est un objet non vide
            if (typeof req.body.dataImpot !== 'object' || Object.keys(req.body.dataImpot).length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Les données d\'impôts ne peuvent pas être vides',
                    details: 'Le champ "dataImpot" doit contenir au moins un impôt à calculer'
                });
                return;
            }

            // Appeler le service de calcul
            const resultat = calculerEstimationGlobaleEntreprise(req.body);
            

            // Retourner le résultat
            if (resultat.success) {
                res.status(200).json({
                    success: true,
                    message: 'Estimation globale calculée avec succès',
                    data: resultat
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: 'Erreur lors du calcul de l\'estimation globale',
                    data: resultat
                });
            }

        } catch (error) {
            console.error('Erreur dans le contrôleur d\'estimation globale:', error);
            
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur',
                details: error instanceof Error ? error.message : 'Erreur inconnue'
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
            
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur',
                details: error instanceof Error ? error.message : 'Erreur inconnue'
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
                res.status(400).json({
                    success: false,
                    message: 'Le code de l\'impôt est requis'
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
                res.status(404).json({
                    success: false,
                    message: `Impôt avec le code "${code}" non trouvé`
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
            
            res.status(500).json({
                success: false,
                message: 'Erreur interne du serveur',
                details: error instanceof Error ? error.message : 'Erreur inconnue'
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
            'IRCM': 'Impôt sur les Revenus des Capitaux Mobiliers'
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
            'IRCM': 'Impôt sur les revenus de placements'
        };
        return descriptions[code] || 'Description non disponible';
    }
}

// Export des méthodes du contrôleur
export const calculerEstimationGlobale = EntrepriseGeneralEstimationController.calculerEstimationGlobale;
export const getImpotsDisponibles = EntrepriseGeneralEstimationController.getImpotsDisponibles;
export const getImpotDetails = EntrepriseGeneralEstimationController.getImpotDetails;
