import { ImpotRepository } from '../../repositories/impot.repository';
import { Impot } from '../../models/impot';

/**
 * Script de seeding pour initialiser les impôts et leurs constantes fiscales
 */
export class ImpotsSeeder {
  private repository: ImpotRepository;

  constructor() {
    this.repository = new ImpotRepository();
  }

  /**
   * Initialise tous les impôts et leurs constantes pour les années 2025 et 2026
   */
  public async seed(): Promise<void> {
    console.log('🌱 Début du seeding des impôts...');

    // Créer les index
    await this.repository.createIndexes();

    // Seeder pour l'année 2025
    await this.seedYear2025();

    // Seeder pour l'année 2026
    await this.seedYear2026();

    console.log('✅ Seeding des impôts terminé');
  }

  /**
   * Initialise les impôts pour l'année 2025
   */
  private async seedYear2025(): Promise<void> {
    console.log('📅 Seeding année 2025...');

    // IBA - Impôt sur les Bénéfices des Artisans
    await this.seedIBA(2025, true);

    // IS - Impôt sur les Sociétés
    await this.seedIS(2025, true);

    // PATENTE
    await this.seedPATENTE(2025, true);

    // IRF - Impôt sur le Revenu Foncier
    await this.seedIRF(2025, true);

    // ITS - Impôt sur les Traitements et Salaires
    await this.seedITS(2025, true);

    // TVA - Taxe sur la Valeur Ajoutée
    await this.seedTVA(2025, true);
  }

  /**
   * Initialise les impôts pour l'année 2026
   */
  private async seedYear2026(): Promise<void> {
    console.log('📅 Seeding année 2026...');

    // Pour 2026, on peut soit désactiver les impôts, soit utiliser les mêmes constantes
    // Ici, on les désactive par défaut (actif: false) car le code vérifie annee >= 2026
    await this.seedIBA(2026, false);
    await this.seedIS(2026, false);
    await this.seedPATENTE(2026, false);
    await this.seedIRF(2026, false);
    await this.seedITS(2026, false);
    await this.seedTVA(2026, false);
  }

  /**
   * Seed IBA
   */
  private async seedIBA(annee: number, actif: boolean): Promise<void> {
    const impot: Omit<Impot, '_id' | 'dateCreation' | 'dateModification'> = {
      code: 'IBA',
      nom: 'Impôt sur les Bénéfices des Artisans',
      description: 'Impôt sur les bénéfices des artisans et entreprises individuelles',
      type: 'reel',
      anneeFiscale: annee,
      actif,
      constantes: [
        {
          code: 'TAUX_GENERAL',
          valeur: 0.30,
          type: 'number',
          description: 'Taux général d\'imposition',
          unite: '%'
        },
        {
          code: 'TAUX_ENSEIGNEMENT',
          valeur: 0.25,
          type: 'number',
          description: 'Taux pour l\'enseignement privé',
          unite: '%'
        },
        {
          code: 'MINIMUM_GENERAL',
          valeur: 0.015,
          type: 'number',
          description: 'Taux minimum général',
          unite: '%'
        },
        {
          code: 'MINIMUM_BTP',
          valeur: 0.03,
          type: 'number',
          description: 'Taux minimum BTP',
          unite: '%'
        },
        {
          code: 'MINIMUM_IMMOBILIER',
          valeur: 0.10,
          type: 'number',
          description: 'Taux minimum immobilier',
          unite: '%'
        },
        {
          code: 'TAUX_PETROLIER',
          valeur: 0.60,
          type: 'number',
          description: 'Taux pétrolier (FCFA par litre)',
          unite: 'FCFA/litre'
        },
        {
          code: 'MINIMUM_ABSOLU_GENERAL',
          valeur: 500000,
          type: 'number',
          description: 'Minimum absolu général',
          unite: 'FCFA'
        },
        {
          code: 'MINIMUM_ABSOLU_STATIONS',
          valeur: 250000,
          type: 'number',
          description: 'Minimum absolu stations-services',
          unite: 'FCFA'
        },
        {
          code: 'REDEVANCE_SRTB',
          valeur: 4000,
          type: 'number',
          description: 'Redevance SRTB',
          unite: 'FCFA'
        },
        {
          code: 'SEUIL_REGIME_REEL',
          valeur: 50000000,
          type: 'number',
          description: 'Seuil de passage au régime réel',
          unite: 'FCFA'
        }
      ]
    };

    await this.upsertImpot(impot);
  }

  /**
   * Seed IS
   */
  private async seedIS(annee: number, actif: boolean): Promise<void> {
    const impot: Omit<Impot, '_id' | 'dateCreation' | 'dateModification'> = {
      code: 'IS',
      nom: 'Impôt sur les Sociétés',
      description: 'Impôt sur les bénéfices des sociétés',
      type: 'reel',
      anneeFiscale: annee,
      actif,
      constantes: [
        {
          code: 'TAUX_GENERAL',
          valeur: 0.30,
          type: 'number',
          description: 'Taux général d\'imposition',
          unite: '%'
        },
        {
          code: 'TAUX_REDUIT',
          valeur: 0.25,
          type: 'number',
          description: 'Taux réduit pour enseignement et industriel',
          unite: '%'
        },
        {
          code: 'TAUX_MIN_GENERAL',
          valeur: 0.01,
          type: 'number',
          description: 'Taux minimum général',
          unite: '%'
        },
        {
          code: 'TAUX_MIN_BTP',
          valeur: 0.03,
          type: 'number',
          description: 'Taux minimum BTP',
          unite: '%'
        },
        {
          code: 'TAUX_MIN_IMMOBILIER',
          valeur: 0.10,
          type: 'number',
          description: 'Taux minimum immobilier',
          unite: '%'
        },
        {
          code: 'TAUX_STATION',
          valeur: 0.60,
          type: 'number',
          description: 'Taux station-service (FCFA par litre)',
          unite: 'FCFA/litre'
        },
        {
          code: 'IMPOT_MIN_ABSOLU',
          valeur: 250000,
          type: 'number',
          description: 'Impôt minimum absolu',
          unite: 'FCFA'
        },
        {
          code: 'REDEVANCE_SRTB',
          valeur: 4000,
          type: 'number',
          description: 'Redevance SRTB',
          unite: 'FCFA'
        },
        {
          code: 'QUOTE_PART_MOBILIER',
          valeur: 0.30,
          type: 'number',
          description: 'Quote-part mobilier',
          unite: '%'
        }
      ]
    };

    await this.upsertImpot(impot);
  }

  /**
   * Seed PATENTE
   */
  private async seedPATENTE(annee: number, actif: boolean): Promise<void> {
    const impot: Omit<Impot, '_id' | 'dateCreation' | 'dateModification'> = {
      code: 'PATENTE',
      nom: 'Patente',
      description: 'Contribution de patente',
      type: 'reel',
      anneeFiscale: annee,
      actif,
      constantes: [
        {
          code: 'TARIF_BASE_ZONE_1',
          valeur: 70000,
          type: 'number',
          description: 'Tarif de base zone 1',
          unite: 'FCFA'
        },
        {
          code: 'TARIF_BASE_ZONE_2',
          valeur: 60000,
          type: 'number',
          description: 'Tarif de base zone 2',
          unite: 'FCFA'
        },
        {
          code: 'SEUIL_CA_CLASSIQUE',
          valeur: 1000000000,
          type: 'number',
          description: 'Seuil CA classique',
          unite: 'FCFA'
        },
        {
          code: 'COEFFICIENT_CA',
          valeur: 10000,
          type: 'number',
          description: 'Coefficient CA',
          unite: ''
        },
        {
          code: 'BAREME_IMPORT_EXPORT',
          valeur: [
            { seuil: 80000000, montant: 150000 },
            { seuil: 200000000, montant: 337500 },
            { seuil: 500000000, montant: 525000 },
            { seuil: 1000000000, montant: 675000 },
            { seuil: 2000000000, montant: 900000 },
            { seuil: 10000000000, montant: 1125000 }
          ],
          type: 'array',
          description: 'Barème importateurs/exportateurs'
        },
        {
          code: 'TAUX_COMMUNES',
          valeur: {
            'cotonou': 0.17,
            'porto-novo': 0.17,
            'ouidah': 0.18,
            'parakou': 0.25,
            'abomey': 0.14,
            'autres-oueme-plateau': 0.13,
            'autres-atlantique': 0.13,
            'autres-zou-collines': 0.135,
            'autres-borgou-alibori': 0.15,
            'atacora-donga': 0.15,
            'mono-couffo': 0.12
          },
          type: 'object',
          description: 'Taux par commune'
        },
        {
          code: 'TAUX_MARCHE_PUBLIC',
          valeur: 0.005,
          type: 'number',
          description: 'Taux patente complémentaire',
          unite: '%'
        },
        {
          code: 'SEUIL_EXEMPTION_MOIS',
          valeur: 12,
          type: 'number',
          description: 'Seuil d\'exemption en mois',
          unite: 'mois'
        },
        {
          code: 'TAUX_ACOMPTE',
          valeur: 0.5,
          type: 'number',
          description: 'Taux d\'acompte',
          unite: '%'
        }
      ]
    };

    await this.upsertImpot(impot);
  }

  /**
   * Seed IRF
   */
  private async seedIRF(annee: number, actif: boolean): Promise<void> {
    const impot: Omit<Impot, '_id' | 'dateCreation' | 'dateModification'> = {
      code: 'IRF',
      nom: 'Impôt sur le Revenu Foncier',
      description: 'Impôt sur les revenus fonciers',
      type: 'reel',
      anneeFiscale: annee,
      actif,
      constantes: [
        {
          code: 'TAUX_NORMAL',
          valeur: 0.12,
          type: 'number',
          description: 'Taux normal',
          unite: '%'
        },
        {
          code: 'TAUX_REDUIT',
          valeur: 0.10,
          type: 'number',
          description: 'Taux réduit',
          unite: '%'
        },
        {
          code: 'RSRTB',
          valeur: 4000,
          type: 'number',
          description: 'Redevance SRTB',
          unite: 'FCFA'
        },
        {
          code: 'JOUR_ECHEANCE',
          valeur: 10,
          type: 'number',
          description: 'Jour d\'échéance',
          unite: 'jour'
        }
      ]
    };

    await this.upsertImpot(impot);
  }

  /**
   * Seed ITS
   */
  private async seedITS(annee: number, actif: boolean): Promise<void> {
    const impot: Omit<Impot, '_id' | 'dateCreation' | 'dateModification'> = {
      code: 'ITS',
      nom: 'Impôt sur les Traitements et Salaires',
      description: 'Impôt sur les salaires et traitements',
      type: 'reel',
      anneeFiscale: annee,
      actif,
      constantes: [
        // Les constantes ITS peuvent être ajoutées ici selon les besoins
        {
          code: 'TAUX_BASE',
          valeur: 0.0,
          type: 'number',
          description: 'Taux de base (barème progressif)',
          unite: '%'
        }
      ]
    };

    await this.upsertImpot(impot);
  }

  /**
   * Seed TVA
   */
  private async seedTVA(annee: number, actif: boolean): Promise<void> {
    const impot: Omit<Impot, '_id' | 'dateCreation' | 'dateModification'> = {
      code: 'TVA',
      nom: 'Taxe sur la Valeur Ajoutée',
      description: 'Taxe sur la valeur ajoutée',
      type: 'reel',
      anneeFiscale: annee,
      actif,
      constantes: [
        {
          code: 'TAUX_NORMAL',
          valeur: 0.18,
          type: 'number',
          description: 'Taux normal',
          unite: '%'
        },
        {
          code: 'TAUX_EXONERE',
          valeur: 0,
          type: 'number',
          description: 'Taux exonéré',
          unite: '%'
        },
        {
          code: 'SEUIL_EXONERATION',
          valeur: 50000000,
          type: 'number',
          description: 'Seuil d\'exonération',
          unite: 'FCFA'
        },
        {
          code: 'JOUR_LIMITE_DECLARATION',
          valeur: 10,
          type: 'number',
          description: 'Jour limite de déclaration',
          unite: 'jour'
        }
      ]
    };

    await this.upsertImpot(impot);
  }

  /**
   * Crée ou met à jour un impôt
   */
  private async upsertImpot(impot: Omit<Impot, '_id' | 'dateCreation' | 'dateModification'>): Promise<void> {
    try {
      const existing = await this.repository.findByCodeAndYear(impot.code, impot.anneeFiscale);
      
      if (existing) {
        await this.repository.update(impot.code, impot.anneeFiscale, {
          nom: impot.nom,
          description: impot.description,
          type: impot.type,
          actif: impot.actif,
          constantes: impot.constantes
        });
        console.log(`  ✅ Mis à jour: ${impot.code} (${impot.anneeFiscale})`);
      } else {
        await this.repository.create(impot);
        console.log(`  ✅ Créé: ${impot.code} (${impot.anneeFiscale})`);
      }
    } catch (error) {
      console.error(`  ❌ Erreur lors du seeding de ${impot.code} (${impot.anneeFiscale}):`, error);
    }
  }
}

