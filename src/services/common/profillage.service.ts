import { ProfilingData, ApplicableTax } from '../../types/profilage.result.return.type'
import { ListTypesContribuableEntreprise, ListTypesRegime } from '../../types/general.entreprise.type';
import { BackendEstimationFailureResponse, BackendEstimationError, BackendEstimationContext } from '../../types/frontend.errors.estomation.type';


interface donneesProfilageRecu {
    periodeFiscale: string;
    chiffreAffaire: number;
    typeContribuableEntreprise: string;
    dateDebutExercice: string;
}

class MoteurProfillage {
    private static CHIFFRE_AFFAIRE_SEUIL = 50_000_000;

    // Map des taxes par régime - selon les nouvelles spécifications
    private static readonly TAXES_PAR_REGIME = new Map<string, ApplicableTax[]>([
        [
            'REEL', [
                // Taxes communes pour REEL (EI et SI)
                {
                    code: 'AIB',
                    name: 'Acompte sur Impôt assis sur le Bénéfice',
                    category: 'Impôt direct',
                    applicability: 'Obligatoire pour régime réel',
                    frequency: 'Mensuelle',
                    description: 'Avance sur impôt sur les bénéfices',
                    priority: 'high',
                    required: true,
                    icon: 'Calculator'
                },
                {
                    code: 'IRCM',
                    name: 'Impôt sur le Revenu des Capitaux Mobiliers',
                    category: 'Impôt direct',
                    applicability: 'Obligatoire pour régime réel',
                    frequency: 'Annuelle',
                    description: 'Impôt sur les revenus de capitaux mobiliers',
                    priority: 'medium',
                    required: false,
                    icon: 'FileText'
                },
                // {
                //     code: 'IRF',
                //     name: 'Impôt sur le Revenu Foncier',
                //     category: 'Impôt direct',
                //     applicability: 'Obligatoire pour régime réel',
                //     frequency: 'Annuelle',
                //     description: 'Impôt sur les revenus fonciers',
                //     priority: 'medium',
                //     required: false,
                //     icon: 'Building'
                // },
                {
                    code: 'IRF',
                    name: 'Impôt sur le Revenu Foncier',
                    category: 'Impôt direct',
                    applicability: 'Applicable aux personnes physiques, entreprises individuelles (IBA) et associés de sociétés immobilières non soumises à l’IS. Non applicable aux sociétés soumises à l’IS.',
                    frequency: 'Annuelle',
                    description: 'Impôt sur les revenus fonciers (loyers, terrains, baux, concessions, etc.) au taux unique de 12% + redevance ORTB 4 000 FCFA.',
                    priority: 'medium',
                    required: false,
                    icon: 'Building'
                },
                {
                    code: 'ITS',
                    name: 'Impôt sur les Traitements et Salaires',
                    category: 'Impôt direct',
                    applicability: 'Obligatoire pour régime réel',
                    frequency: 'Mensuelle',
                    description: 'Impôt sur les salaires versés',
                    priority: 'high',
                    required: true,
                    icon: 'User'
                },
                {
                    code: 'PATENTE',
                    name: 'Contribution des Patentes',
                    category: 'Contribution locale',
                    applicability: 'Obligatoire pour régime réel',
                    frequency: 'Annuelle',
                    description: "Contribution locale liée à l'activité exercée",
                    priority: 'high',
                    required: true,
                    icon: 'MapPin'
                },
                {
                    code: 'TVA',
                    name: 'Taxe sur la Valeur Ajoutée',
                    category: 'Impôt indirect',
                    applicability: 'Obligatoire pour régime réel',
                    frequency: 'Mensuelle ou Trimestrielle',
                    description: 'Taxe sur la consommation facturée au client final',
                    priority: 'high',
                    required: true,
                    icon: 'CreditCard'
                },
                {
                    code: 'VPS',
                    name: 'Versement Patronal sur Salaires',
                    category: 'Contribution sociale',
                    applicability: 'Obligatoire pour régime réel',
                    frequency: 'Mensuelle',
                    description: 'Versement sur les salaires versés',
                    priority: 'medium',
                    required: true,
                    icon: 'DollarSign'
                },

                // Taxes spécifiques aux EI en régime REEL
                {
                    code: 'IBA',
                    name: "Impôt sur les Bénéfices d'affaire",
                    category: 'Impôt direct',
                    applicability: 'Spécifique aux entreprises individuelles',
                    frequency: 'Annuelle',
                    description: "Impôt sur les Bénéfices d'affaire",
                    priority: 'medium',
                    required: true,
                    icon: 'FileText',
                    typeContribuableOnly: ['EI']
                },
                // Taxes spécifiques aux SI en régime REEL
                {
                    code: 'IS',
                    name: 'Impôt sur les Sociétés',
                    category: 'Impôt direct',
                    applicability: 'Spécifique aux sociétés',
                    frequency: 'Annuelle',
                    description: 'Impôt sur les bénéfices des sociétés',
                    priority: 'high',
                    required: true,
                    icon: 'Building',
                    typeContribuableOnly: ['SI']
                }
            ]
        ],

        ['TPS', [
            {
                code: 'TPS',
                name: 'Taxe Professionnelle Synthétique',
                category: 'Impôt forfaitaire',
                applicability: 'Obligatoire pour régime TPS',
                frequency: 'Annuelle',
                description: 'Impôt forfaitaire pour les petites entreprises',
                priority: 'high',
                required: true,
                icon: 'Receipt'
            }
        ]],

        ['COMMUN', [
            {
                code: 'TVM',
                name: 'Taxe sur les Vehicules a Moteur',
                category: 'Impôt indirect',
                applicability: 'Obligatoire pour régime TVM',
                frequency: 'Mensuelle',
                description: 'Taxe sur la valeur des marchandises importées',
                priority: 'high',
                required: false,
                icon: 'CreditCard'
            },
            {
                code: 'TFU',
                name: 'Taxe Foncière Unique',
                category: 'Impôt direct local',
                applicability: 'Applicable aux propriétaires de biens bâtis et non bâtis, ainsi qu’aux usufruitiers, emphytéotes ou preneurs de baux à construction. En cas d’impossibilité d’atteindre le propriétaire, le possesseur ou le locataire est redevable.',
                frequency: 'Annuelle (avec acomptes : 50% avant le 10 février et solde avant le 30 avril)',
                description: 'Impôt local sur les propriétés bâties (base : valeur locative) et non bâties (base : évaluation administrative). Les taux sont fixés par les conseils communaux, avec des plafonds fixés par le CGI.',
                priority: 'high',
                required: true,
                icon: 'Home'
            }
            
            // {
            //     code: 'TFU',
            //     name: 'Taxe Forfaitaire Unique Entreprise',
            //     category: 'Contribution sociale',
            //     applicability: 'Taxe Forfaitaire Unique Entreprise',
            //     frequency: 'Annuelle',
            //     description: 'Versement sur les salaires versés',
            //     priority: 'medium',
            //     required: false,
            //     icon: 'Building'
            // }
        ]]
    ]);

    public static getProfil(donneesProfilageRecu: donneesProfilageRecu): ProfilingData | BackendEstimationFailureResponse {
        try {
            // Validation de la période fiscale
            const annee = this.extraireAnnee(donneesProfilageRecu.periodeFiscale);

            // Vérifier si l'année est 2026 ou ultérieure
            if (annee >= 2026) {
                return this.genererReponseErreur(donneesProfilageRecu, annee);
            }

            // Détermination du régime fiscal basé sur le chiffre d'affaires
            const regime = this.determinerRegime(
                donneesProfilageRecu.chiffreAffaire,
                donneesProfilageRecu.typeContribuableEntreprise
            );

            // Construction du profil fiscal
            const profile = {
                typeContribuableEntreprise: donneesProfilageRecu.typeContribuableEntreprise,
                annualRevenue: donneesProfilageRecu.chiffreAffaire,
                regime: regime,
                periodeFiscale: donneesProfilageRecu.periodeFiscale,
                dateDebutExercice: donneesProfilageRecu.dateDebutExercice
            };

            // Détermination des taxes applicables
            const taxes = this.determinerTaxesApplicables(profile);

            return {
                profile,
                taxes
            };
        } catch (error) {
            return this.genererReponseErreurValidation(error instanceof Error ? error.message : 'Erreur lors de la génération du profil fiscal');
        }
    }

    private static determinerRegime(chiffreAffaire: number, typeContribuable: string): string {
        // Recherche du régime dans les types disponibles
        const regimeReel = ListTypesRegime.find(r => r.sigle === 'REEL');
        const regimeTPS = ListTypesRegime.find(r => r.sigle === 'TPS');

        // Règle : REEL si CA > 50 000 000, sinon TPS
        if (chiffreAffaire > this.CHIFFRE_AFFAIRE_SEUIL) {
            return regimeReel?.sigle || 'REEL';
        } else {
            return regimeTPS?.sigle || 'TPS';
        }
    }

    private static determinerTaxesApplicables(profile: any): any[] {
        const taxes: any[] = [];

        // 1. Récupération des taxes spécifiques au régime
        const taxesRegime = this.TAXES_PAR_REGIME.get(profile.regime) || [];

        // 2. Récupération des taxes communes (applicables à tous les régimes)
        const taxesCommunes = this.TAXES_PAR_REGIME.get('COMMUN') || [];

        // 3. Traitement des taxes du régime
        taxesRegime.forEach(applicableTax => {
            const taxeApplicable = this.evaluerTaxeApplicable(applicableTax, profile);
            if (taxeApplicable) {
                taxes.push(taxeApplicable);
            }
        });

        // 4. Traitement des taxes communes
        taxesCommunes.forEach(applicableTax => {
            const taxeApplicable = this.evaluerTaxeApplicable(applicableTax, profile);
            if (taxeApplicable) {
                taxes.push(taxeApplicable);
            }
        });

        return taxes;
    }

    private static evaluerTaxeApplicable(applicableTax: ApplicableTax, profile: any): any | null {
        // Vérification des conditions d'applicabilité

        // 1. Condition sur le type de contribuable
        if (applicableTax.typeContribuableOnly &&
            !applicableTax.typeContribuableOnly.includes(profile.typeContribuableEntreprise)) {
            return null;
        }

        // 2. Retour de la taxe applicable
        return {
            code: applicableTax.code,
            name: applicableTax.name,
            category: applicableTax.category,
            applicability: applicableTax.applicability,
            frequency: applicableTax.frequency,
            description: applicableTax.description,
            priority: applicableTax.priority,
            required: applicableTax.required,
            icon: applicableTax.icon
        };
    }

    // Méthodes utilitaires pour la gestion des Maps
    public static ajouterTaxeRegime(regime: string, taxe: ApplicableTax): void {
        const taxesExistantes = this.TAXES_PAR_REGIME.get(regime) || [];
        taxesExistantes.push(taxe);
        this.TAXES_PAR_REGIME.set(regime, taxesExistantes);
    }

    public static supprimerTaxeRegime(regime: string, nomTaxe: string): void {
        const taxesExistantes = this.TAXES_PAR_REGIME.get(regime) || [];
        const taxesFiltered = taxesExistantes.filter(t => t.name !== nomTaxe);
        this.TAXES_PAR_REGIME.set(regime, taxesFiltered);
    }

    public static getTaxesParRegime(regime: string): ApplicableTax[] {
        return this.TAXES_PAR_REGIME.get(regime) || [];
    }

    public static getRegimesDisponibles(): string[] {
        return Array.from(this.TAXES_PAR_REGIME.keys());
    }

    // Méthodes utilitaires existantes
    public static validerDonneesProfilage(donnees: donneesProfilageRecu): boolean {
        return (
            donnees.chiffreAffaire >= 0 &&
            !!donnees.typeContribuableEntreprise &&
            !!donnees.periodeFiscale &&
            !!donnees.dateDebutExercice &&
            this.isValidDate(donnees.dateDebutExercice)
        );
    }

    private static isValidDate(dateString: string): boolean {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date.getTime());
    }

    public static getSeuilChiffreAffaire(): number {
        return this.CHIFFRE_AFFAIRE_SEUIL;
    }

    // Méthodes utilitaires pour la gestion des erreurs
    private static extraireAnnee(periodeFiscale: string): number {
        // Essayer d'extraire l'année de différents formats possibles
        const anneeMatch = periodeFiscale.match(/(\d{4})/);
        if (anneeMatch) {
            return parseInt(anneeMatch[1], 10);
        }

        // Si aucune année n'est trouvée, retourner l'année courante par défaut
        return new Date().getFullYear();
    }

    private static genererReponseErreur(donneesProfilageRecu: donneesProfilageRecu, annee: number): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'DONNEES_FISCALES_NON_DISPONIBLES',
                    message: `Les données fiscales pour l'année ${annee} ne sont pas encore disponibles.`,
                    details: `Le profilage fiscal pour l'année ${annee} ne peut pas être effectué car les données officielles n'ont pas encore été publiées par l'administration fiscale béninoise.`,
                    severity: 'info'
                }
            ],
            context: {
                typeContribuable: donneesProfilageRecu.typeContribuableEntreprise,
                regime: 'À déterminer',
                chiffreAffaire: donneesProfilageRecu.chiffreAffaire,
                missingData: ['donnees_fiscales', 'tarifs_impots', 'reglementation_fiscale']
            },
            timestamp: new Date().toISOString(),
            requestId: `profilage_calc_${Date.now()}`
        };
    }

    private static genererReponseErreurValidation(message: string): BackendEstimationFailureResponse {
        return {
            success: false,
            errors: [
                {
                    code: 'VALIDATION_ERROR',
                    message: message,
                    details: `Erreur de validation des données d'entrée pour le profilage fiscal.`,
                    severity: 'error'
                }
            ],
            context: {
                typeContribuable: 'Non déterminé',
                regime: 'Non déterminé',
                missingData: ['donnees_entree']
            },
            timestamp: new Date().toISOString(),
            requestId: `profilage_calc_${Date.now()}`
        };
    }
}

export default MoteurProfillage;
