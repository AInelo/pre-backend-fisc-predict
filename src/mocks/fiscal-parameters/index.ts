import { FiscalParametersModel } from '@/models/fiscal-parameters';
import { TfuParticulierFiscalParams } from '@/types/fiscal-parameters';
import tfuGeoData from '@/data/tfu_data_with_slugs.json';

// Entreprise 2025
import tpsEntreprise from './2025/entreprise/TPS.json';
import isEntreprise from './2025/entreprise/IS.json';
import aibEntreprise from './2025/entreprise/AIB.json';
import ibaEntreprise from './2025/entreprise/IBA.json';
import irfEntreprise from './2025/entreprise/IRF.json';
import itsEntreprise from './2025/entreprise/ITS.json';
import patenteEntreprise from './2025/entreprise/PATENTE.json';
import tfuEntreprise from './2025/entreprise/TFU.json';
import tvmEntreprise from './2025/entreprise/TVM.json';

// Particulier 2025
import irfParticulier from './2025/particulier/IRF.json';
import itsParticulier from './2025/particulier/ITS.json';
import aibParticulier from './2025/particulier/AIB.json';
import ibaParticulier from './2025/particulier/IBA.json';
import patenteParticulier from './2025/particulier/PATENTE.json';
import tpsParticulier from './2025/particulier/TPS.json';
import tvmParticulier from './2025/particulier/TVM.json';
import tfuParticulierBase from './2025/particulier/TFU.json';

export type FiscalParametersMocksByYear = Record<
  number,
  Array<FiscalParametersModel<Record<string, unknown>>>
>;

const tfuParticulier2025: FiscalParametersModel<TfuParticulierFiscalParams> = {
  ...(tfuParticulierBase as unknown as FiscalParametersModel<TfuParticulierFiscalParams>),
  parametres: {
    ...(tfuParticulierBase.parametres as Omit<TfuParticulierFiscalParams, 'departements'>),
    departements: tfuGeoData.departements as TfuParticulierFiscalParams['departements'],
  },
};

export const fiscalParametersMocksByYear: FiscalParametersMocksByYear = {
  2025: [
    tpsEntreprise, isEntreprise, aibEntreprise, ibaEntreprise, irfEntreprise,
    itsEntreprise, patenteEntreprise, tfuEntreprise, tvmEntreprise,
    irfParticulier, itsParticulier, aibParticulier, ibaParticulier,
    patenteParticulier, tpsParticulier, tvmParticulier,
    tfuParticulier2025 as unknown as FiscalParametersModel<Record<string, unknown>>,
  ] as Array<FiscalParametersModel<Record<string, unknown>>>,
};

export function getFiscalParametersMocks(
  year: number
): Array<FiscalParametersModel<Record<string, unknown>>> {
  return fiscalParametersMocksByYear[year] ?? [];
}
