import { fiscalParametersRepository } from '@/repositories/fiscal-parameters/FiscalParametersRepository';
import { FiscalParametersError } from '@/services/fiscal-parameters/errors';
import { extractFiscalYear } from '@/services/fiscal-parameters/year';
import {
  FiscalContributorType,
  FiscalParamsFor,
  FiscalTaxCode,
} from '@/types/fiscal-parameters';

interface FiscalContextInput {
  codeImpot: FiscalTaxCode;
  typeContribuable: FiscalContributorType;
  periodeFiscale: string;
}

export class FiscalParameterResolver {
  public async resolveRequiredParams<TCode extends FiscalTaxCode>(
    input: FiscalContextInput
  ): Promise<FiscalParamsFor<TCode>> {
    const annee = extractFiscalYear(input.periodeFiscale);
    return fiscalParametersRepository.getRequiredParams<TCode>({
      codeImpot: input.codeImpot,
      typeContribuable: input.typeContribuable,
      annee,
    });
  }

  public extractYear(periodeFiscale: string): number {
    return extractFiscalYear(periodeFiscale);
  }

  public ensureBooleanFlag(value: boolean | undefined, message: string): void {
    if (!value) {
      throw new FiscalParametersError(message, 'FISCAL_PARAMS_QUERY_INVALID');
    }
  }
}

export const fiscalParameterResolver = new FiscalParameterResolver();
