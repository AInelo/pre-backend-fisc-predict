import { BackendEstimationFailureResponse } from '@/types/frontend.errors.estomation.type';
import { FiscalParametersQueryModel } from '@/models/fiscal-parameters';

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

export function buildFiscalParametersFailureResponse(
  error: FiscalParametersError,
  context?: {
    typeContribuable?: string;
    regime?: string;
    chiffreAffaire?: number;
  }
): BackendEstimationFailureResponse {
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
