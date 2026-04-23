import { BackendEstimationFailureResponse } from '@/types/frontend.errors.estomation.type';
import { FiscalParametersQueryModel } from '@/models/fiscal-parameters';
import { FiscalTaxCode } from '@/types/fiscal-parameters';

export class FiscalParametersError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'MONGO_NOT_CONFIGURED'
      | 'MONGO_NOT_CONNECTED'
      | 'FISCAL_PARAMS_NOT_FOUND'
      | 'FISCAL_PARAMS_INACTIVE'
      | 'FISCAL_PARAMS_INVALID'
      | 'FISCAL_PARAMS_QUERY_INVALID',
    public readonly query?: FiscalParametersQueryModel,
    public readonly missingData: string[] = []
  ) {
    super(message);
    this.name = 'FiscalParametersError';
  }
}

const IMPOT_NOMS: Record<FiscalTaxCode, string> = {
  TPS:     'Taxe Professionnelle Synthétique',
  ITS:     'Impôt sur les Traitements et Salaires',
  IRF:     'Impôt sur les Revenus Fonciers',
  AIB:     "Acompte sur l'Impôt sur les Bénéfices",
  IBA:     "Impôt sur le Bénéfice d'Affaire",
  IS:      'Impôt sur les Sociétés',
  PATENTE: 'Patente',
  TFU:     'Taxe Foncière Urbaine',
  TVM:     'Taxe sur les Véhicules à Moteur',
};

const IMPOT_MISSING_DATA: Record<FiscalTaxCode, string[]> = {
  TPS:     ['taux_tps', 'montant_minimum', 'redevance_rtb', 'cci_rates'],
  ITS:     ['bareme_its', 'seuil_exoneration', 'redevance_srtb'],
  IRF:     ['taux_standard', 'taux_reduit', 'redevance_srtb'],
  AIB:     ['redevance_srtb'],
  IBA:     ['taux_general', 'minimum_general_pourcent', 'regles_secteur'],
  IS:      ['taux_principal_par_secteur', 'taux_minimum_par_secteur', 'cci_rates'],
  PATENTE: ['fixed_rate_zone1', 'fixed_rate_zone2', 'proportional_rates'],
  TFU:     ['taux_standard', 'taux_par_ville'],
  TVM:     ['tarifs'],
};

export function buildFiscalParametersFailureResponse(
  error: FiscalParametersError,
  context?: {
    typeContribuable?: string;
    regime?: string;
    chiffreAffaire?: number;
  }
): BackendEstimationFailureResponse {
  if (error.code === 'FISCAL_PARAMS_NOT_FOUND' && error.query) {
    const { codeImpot, annee } = error.query;
    const nomImpot = IMPOT_NOMS[codeImpot] ?? codeImpot;
    const missingData = IMPOT_MISSING_DATA[codeImpot] ?? [];

    return {
      success: false,
      errors: [
        {
          code: 'CONSTANTES_NON_DISPONIBLES',
          message: `Les constantes de calcul de la ${codeImpot} pour l'année ${annee} ne sont pas encore disponibles.`,
          details: `Le calcul de la ${nomImpot} pour l'année ${annee} ne peut pas être effectué car les paramètres officiels n'ont pas encore été publiés par l'administration fiscale béninoise.`,
          severity: 'info',
        },
      ],
      context: {
        ...context,
        missingData,
      },
      timestamp: new Date().toISOString(),
      requestId: `${codeImpot.toLowerCase()}_calc_${Date.now()}`,
    };
  }

  return {
    success: false,
    errors: [
      {
        code: error.code,
        message: error.message,
        details: error.query
          ? `code_impot=${error.query.codeImpot}, type_contribuable=${error.query.typeContribuable}, annee=${error.query.annee}`
          : undefined,
        severity: 'error',
      },
    ],
    context: {
      ...context,
      missingData: error.missingData.length > 0 ? error.missingData : undefined,
    },
    timestamp: new Date().toISOString(),
    requestId: `fiscal_params_${Date.now()}`,
  };
}
