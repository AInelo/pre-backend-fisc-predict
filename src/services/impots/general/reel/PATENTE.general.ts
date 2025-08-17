import { BackendEstimationFailureResponse } from "@/types/frontend.errors.estomation.type";
import { GlobalEstimationInfoData } from "@/types/frontend.result.return.type";

interface PatenteInput {
    chiffreAffaire: number;
    periodeFiscale: string;
    
    location: 'cotonou' | 'porto-novo' | 'ouidah' | 'abomey' | 'parakou' | 'other-zone1' | 'other-zone2' | 'alibori' | 'atacora' | 'borgou' | 'donga' | 'atlantique' | 'collines' | 'couffo' | 'littoral' | 'mono' | 'oueme' | 'plateau' | 'zou';
    rentalValue: number;

    isImporter?: boolean;
    importExportAmount?: number;
}


export type PatenteCalculationResult = GlobalEstimationInfoData | BackendEstimationFailureResponse;

class MoteurPatente {
    public static calculerPatente(input: PatenteInput): PatenteCalculationResult {
        try {
            // Validation des entrées
            if (input.chiffreAffaire <= 0) {
                return this.genererReponseErreurValidation('Le chiffre d\'affaires doit être positif');
            }

            if (input.rentalValue < 0) {
                return this.genererReponseErreurValidation('La valeur locative ne peut pas être négative');
            }

            // Extraire l'année de la période fiscale
            const annee = this.extraireAnnee(input.periodeFiscale);
            
            // Vérifier si l'année est 2026 ou ultérieure
            if (annee >= 2026) {
                return this.genererReponseErreur(input, annee);
            }

            // Déterminer la zone de l'établissement
            const zone = this.getLocationZone(input.location);
            const baseFixedRate = zone === 'first' ? 70000 : 60000;
            
            // Ajuster le taux fixe selon le chiffre d'affaires
            let patentFixedRate = this.adjustForchiffreAffaire(baseFixedRate, input.chiffreAffaire);
            
            // Ajuster pour les activités d'import-export
            patentFixedRate = this.adjustForImportExport(patentFixedRate, input);
            
            // Calculer la part proportionnelle
            const proportionalRate = this.calculerTauxProportionnel(input.location);
            const patentProportionalRate = this.calculerPartProportionnelle(input.rentalValue, proportionalRate, patentFixedRate);
            
            // Calculer la patente totale
            const patenteTotale = patentFixedRate + patentProportionalRate;
            const patenteTotaleArrondie = Math.round(patenteTotale);

            // Préparer les variables d'entrée
            const variablesEnter = [
                {
                    label: "Chiffre d'affaires",
                    description: "Revenus totaux de l'activité",
                    value: input.chiffreAffaire,
                    currency: 'FCFA'
                },
                {
                    label: "Localisation",
                    description: "Zone géographique de l'établissement",
                    value: this.getLocationValue(input.location),
                    currency: ''
                },
                {
                    label: "Valeur locative",
                    description: "Valeur locative annuelle de l'établissement",
                    value: input.rentalValue,
                    currency: 'FCFA'
                }
            ];

            // Préparer les détails de calcul
            const impotDetailCalcule = [
                {
                    impotTitle: 'Patente - Part fixe',
                    impotDescription: `Part fixe de la patente selon la zone ${zone === 'first' ? '1' : '2'} (${input.location})`,
                    impotValue: patentFixedRate,
                    impotValueCurrency: 'FCFA',
                    impotTaux: 'Montant fixe',
                    importCalculeDescription: `Part fixe = ${patentFixedRate.toLocaleString('fr-FR')} FCFA (zone ${zone === 'first' ? '1' : '2'})`
                }
            ];

            // Ajouter la part proportionnelle si applicable
            if (input.rentalValue > 0) {
                impotDetailCalcule.push({
                    impotTitle: 'Patente - Part proportionnelle',
                    impotDescription: `Part proportionnelle calculée sur la valeur locative (${proportionalRate}%)`,
                    impotValue: Math.round(patentProportionalRate),
                    impotValueCurrency: 'FCFA',
                    impotTaux: `${proportionalRate}%`,
                    importCalculeDescription: `Part proportionnelle = ${input.rentalValue.toLocaleString('fr-FR')} FCFA × ${proportionalRate}% = ${Math.round(patentProportionalRate).toLocaleString('fr-FR')} FCFA`
                });
            }

            // Ajouter la surtaxe import-export si applicable
            if (input.isImporter && input.importExportAmount) {
                const surtaxeImportExport = this.calculerSurtaxeImportExport(input.importExportAmount);
                impotDetailCalcule.push({
                    impotTitle: 'Surtaxe import-export',
                    impotDescription: 'Surtaxe spéciale pour les activités d\'import-export',
                    impotValue: surtaxeImportExport,
                    impotValueCurrency: 'FCFA',
                    impotTaux: 'Variable selon le montant',
                    importCalculeDescription: `Surtaxe import-export = ${surtaxeImportExport.toLocaleString('fr-FR')} FCFA (montant: ${input.importExportAmount.toLocaleString('fr-FR')} FCFA)`
                });
            }

            return {
                totalEstimation: patenteTotaleArrondie,
                totalEstimationCurrency: 'FCFA',
                VariableEnter: variablesEnter,
                impotDetailCalcule: impotDetailCalcule,

                obligationEcheance: [
                    {
                        impotTitle: 'Patente - Paiement annuel',
                        echeancePaiement: {
                            echeancePeriodeLimite: '30 avril',
                            echeanceDescription: "Paiement de la patente annuelle."
                        },
                        obligationDescription: "La patente doit être payée au plus tard le 30 avril de chaque année."
                    },
                    {
                        impotTitle: 'Patente - Déclaration des établissements',
                        echeancePaiement: {
                            echeancePeriodeLimite: '30 jours après ouverture',
                            echeanceDescription: "Déclaration de l'ouverture d'un nouvel établissement."
                        },
                        obligationDescription: "Tout nouvel établissement doit être déclaré dans les 30 jours suivant son ouverture."
                    },
                    {
                        impotTitle: 'Patente - Mise à jour des informations',
                        echeancePaiement: {
                            echeancePeriodeLimite: '30 jours après changement',
                            echeanceDescription: "Déclaration des modifications importantes."
                        },
                        obligationDescription: "Les modifications importantes (changement d'adresse, d'activité, etc.) doivent être déclarées dans les 30 jours."
                    }
                ],

                infosSupplementaires: [
                    {
                        infosTitle: 'Zones géographiques et tarifs',
                        infosDescription: [
                            "Zone 1 (Cotonou, Porto-Novo, Ouidah, Abomey) : Part fixe de 70 000 FCFA",
                            "Zone 2 (Parakou, autres villes) : Part fixe de 60 000 FCFA",
                            "Taux proportionnels variables selon la localisation (12% à 25%)",
                            "Majoration pour chiffre d'affaires supérieur à 1 milliard FCFA"
                        ]
                    },
                    {
                        infosTitle: 'Calcul de la part proportionnelle',
                        infosDescription: [
                            "La part proportionnelle est calculée sur la valeur locative annuelle.",
                            "Taux minimum : 1/3 de la part fixe si la valeur locative est faible.",
                            "La valeur locative est déterminée par l'administration ou déclarée par le contribuable."
                        ]
                    },
                    {
                        infosTitle: 'Surtaxes spéciales',
                        infosDescription: [
                            "Surtaxe import-export selon le montant des transactions.",
                            "Majoration pour les établissements à fort chiffre d'affaires.",
                            "Possibilité de réductions pour certaines activités ou zones défavorisées."
                        ]
                    }
                ],

                impotConfig: {
                    impotTitle: 'Patente',
                    label: 'Patente',
                    description: `La patente est un impôt local annuel calculé sur la base d'une part fixe selon la zone géographique
                            et d'une part proportionnelle sur la valeur locative de l'établissement.
                            Elle s'applique à tous les établissements commerciaux, industriels et artisanaux.
                            Le paiement est annuel et doit être effectué avant le 30 avril.`,
                    competentCenter: "Centre des Impôts des Petites Entreprises (CIPE) de votre ressort territorial.",
                    paymentSchedule: [
                        {
                            date: "30 avril",
                            description: "Paiement annuel de la patente"
                        }
                    ]
                }
            };
        } catch (error) {
            return this.genererReponseErreurValidation(error instanceof Error ? error.message : 'Erreur lors du calcul de la patente');
        }
    }

    private static getLocationZone(location: string): 'first' | 'second' {
        const firstZone = ['cotonou', 'porto-novo', 'ouidah', 'abomey', 'other-zone1',
            'atlantique', 'collines', 'couffo', 'littoral', 'mono', 'oueme', 'plateau', 'zou'];
        return firstZone.includes(location) ? 'first' : 'second';
    }

    private static getLocationValue(location: string): number {
        const locationValues: Record<string, number> = {
            'cotonou': 1, 'porto-novo': 2, 'ouidah': 3, 'abomey': 4, 'parakou': 5,
            'other-zone1': 6, 'other-zone2': 7, 'alibori': 8, 'atacora': 9,
            'borgou': 10, 'donga': 11, 'atlantique': 12, 'collines': 13,
            'couffo': 14, 'littoral': 15, 'mono': 16, 'oueme': 17, 'plateau': 18, 'zou': 19
        };
        return locationValues[location] || 20;
    }

    private static calculerTauxProportionnel(location: string): number {
        const rates: Record<string, number> = {
            cotonou: 17, 'porto-novo': 17, ouidah: 18, abomey: 14, parakou: 25,
            alibori: 15, borgou: 15, atacora: 15, donga: 15,
            mono: 12, couffo: 12,
            atlantique: 13.5, collines: 13.5, oueme: 13.5, plateau: 13.5, zou: 13.5,
            'other-zone1': 13.5, 'other-zone2': 13.5, littoral: 13.5,
        };
        return rates[location] || 13.5;
    }

    private static calculerPartProportionnelle(rentalValue: number, proportionalRate: number, fixedRate: number): number {
        if (rentalValue <= 0) return 0;
        
        const rate = rentalValue * (proportionalRate / 100);
        const minProportional = fixedRate / 3;
        
        return Math.max(rate, minProportional);
    }

    private static adjustForchiffreAffaire(baseRate: number, chiffreAffaire: number): number {
        if (chiffreAffaire > 1000000000) {
            const additionalBillions = Math.floor(chiffreAffaire / 1000000000);
            return baseRate + additionalBillions * 10000;
        }
        return baseRate;
    }

    private static adjustForImportExport(rate: number, input: PatenteInput): number {
        if (!input.isImporter || !input.importExportAmount) return rate;
        
        const amount = input.importExportAmount;
        if (amount <= 80000000) return 150000;
        if (amount <= 200000000) return 337500;
        if (amount <= 500000000) return 525000;
        if (amount <= 1000000000) return 675000;
        if (amount <= 2000000000) return 900000;
        if (amount <= 10000000000) return 1125000;
        
        return 1125000 + Math.floor((amount - 10000000000) / 1000000000) * 10000;
    }

    private static calculerSurtaxeImportExport(amount: number): number {
        if (amount <= 80000000) return 150000;
        if (amount <= 200000000) return 337500;
        if (amount <= 500000000) return 525000;
        if (amount <= 1000000000) return 675000;
        if (amount <= 2000000000) return 900000;
        if (amount <= 10000000000) return 1125000;
        
        return 1125000 + Math.floor((amount - 10000000000) / 1000000000) * 10000;
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

    private static genererReponseErreur(input: PatenteInput, annee: number): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'CONSTANTES_NON_DISPONIBLES',
                    message: `Les taux de patente pour l'année ${annee} ne sont pas encore disponibles.`,
                    details: `Le calcul de la patente pour l'année ${annee} ne peut pas être effectué car les taux officiels n'ont pas encore été publiés par l'administration fiscale béninoise.`,
                    severity: 'info'
                }
            ],
            context: {
                typeContribuable: 'Entreprise/Entrepreneur',
                regime: 'Patente',
                chiffreAffaire: input.chiffreAffaire,
                missingData: ['taux_patente', 'seuils_imposition', 'tarifs_geographiques']
            },
            timestamp: new Date().toISOString(),
            requestId: `patente_calc_${Date.now()}`
        };
    }

    private static genererReponseErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'VALIDATION_ERROR',
                    message: message,
                    details: `Erreur de validation des données d'entrée pour le calcul de la patente.`,
                    severity: 'error'
                }
            ],
            context: {
                typeContribuable: 'Entreprise/Entrepreneur',
                regime: 'Patente',
                missingData: ['donnees_entree', 'chiffre_affaires', 'localisation']
            },
            timestamp: new Date().toISOString(),
            requestId: `patente_calc_${Date.now()}`
        };
    }
}

export default MoteurPatente;
