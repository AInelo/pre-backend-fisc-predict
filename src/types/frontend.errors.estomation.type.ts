// Ces interfaces représentent exactement ce qui vient du backend
export interface BackendEstimationError {
  code: string;
  message: string;
  details?: string;
  severity: 'warning' | 'error' | 'info';
}

export interface BackendEstimationContext {
  typeContribuable?: string;
  regime?: string;
  chiffreAffaires?: number;
  missingData?: string[];
}

export interface BackendEstimationFailureResponse {
  success: false;
  errors: BackendEstimationError[];
  context?: BackendEstimationContext;
  timestamp: string;
  requestId?: string;
}
