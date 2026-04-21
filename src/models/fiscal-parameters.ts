import {
  FiscalContributorType,
  FiscalParamsFor,
  FiscalTaxCode,
} from '@/types/fiscal-parameters';

export interface FiscalParametersMeta {
  label: string;
  updatedAt: string;
  updatedBy: string;
}

export interface FiscalParametersModel<TParams = Record<string, unknown>> {
  code_impot: FiscalTaxCode;
  type_contribuable: FiscalContributorType;
  annee: number;
  actif: boolean;
  parametres: TParams;
  meta: FiscalParametersMeta;
}

export interface FiscalParametersQueryModel {
  codeImpot: FiscalTaxCode;
  typeContribuable: FiscalContributorType;
  annee: number;
}

export type FiscalParametersByTaxModel<TCode extends FiscalTaxCode> = FiscalParametersModel<
  FiscalParamsFor<TCode>
>;
