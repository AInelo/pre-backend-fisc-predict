import { FiscalParametersModel } from '@/models/fiscal-parameters';

// Entreprise 2025
import tpsEntreprise2025 from './2025/entreprise/TPS.json';
import isEntreprise2025 from './2025/entreprise/IS.json';
import aibEntreprise2025 from './2025/entreprise/AIB.json';
import ibaEntreprise2025 from './2025/entreprise/IBA.json';
import irfEntreprise2025 from './2025/entreprise/IRF.json';
import itsEntreprise2025 from './2025/entreprise/ITS.json';
import patenteEntreprise2025 from './2025/entreprise/PATENTE.json';
import tfuEntreprise2025 from './2025/entreprise/TFU.json';
import tvmEntreprise2025 from './2025/entreprise/TVM.json';

// Particulier 2025
import irfParticulier2025 from './2025/particulier/IRF.json';
import itsParticulier2025 from './2025/particulier/ITS.json';
import aibParticulier2025 from './2025/particulier/AIB.json';
import ibaParticulier2025 from './2025/particulier/IBA.json';
import patenteParticulier2025 from './2025/particulier/PATENTE.json';
import tpsParticulier2025 from './2025/particulier/TPS.json';
import tvmParticulier2025 from './2025/particulier/TVM.json';
import tfuParticulier2025 from './2025/particulier/TFU.json';

// Entreprise 2026
import tpsEntreprise2026 from './2026/entreprise/TPS.json';
import isEntreprise2026 from './2026/entreprise/IS.json';
import aibEntreprise2026 from './2026/entreprise/AIB.json';
import ibaEntreprise2026 from './2026/entreprise/IBA.json';
import irfEntreprise2026 from './2026/entreprise/IRF.json';
import itsEntreprise2026 from './2026/entreprise/ITS.json';
import patenteEntreprise2026 from './2026/entreprise/PATENTE.json';
import tfuEntreprise2026 from './2026/entreprise/TFU.json';
import tvmEntreprise2026 from './2026/entreprise/TVM.json';

// Particulier 2026
import irfParticulier2026 from './2026/particulier/IRF.json';
import itsParticulier2026 from './2026/particulier/ITS.json';
import aibParticulier2026 from './2026/particulier/AIB.json';
import ibaParticulier2026 from './2026/particulier/IBA.json';
import patenteParticulier2026 from './2026/particulier/PATENTE.json';
import tpsParticulier2026 from './2026/particulier/TPS.json';
import tvmParticulier2026 from './2026/particulier/TVM.json';
import tfuParticulier2026 from './2026/particulier/TFU.json';

export type FiscalParametersMocksByYear = Record<
  number,
  Array<FiscalParametersModel<Record<string, unknown>>>
>;

export const fiscalParametersMocksByYear: FiscalParametersMocksByYear = {
  2025: [
    tpsEntreprise2025, isEntreprise2025, aibEntreprise2025, ibaEntreprise2025, irfEntreprise2025,
    itsEntreprise2025, patenteEntreprise2025, tfuEntreprise2025, tvmEntreprise2025,
    irfParticulier2025, itsParticulier2025, aibParticulier2025, ibaParticulier2025,
    patenteParticulier2025, tpsParticulier2025, tvmParticulier2025, tfuParticulier2025,
  ] as Array<FiscalParametersModel<Record<string, unknown>>>,
  2026: [
    tpsEntreprise2026, isEntreprise2026, aibEntreprise2026, ibaEntreprise2026, irfEntreprise2026,
    itsEntreprise2026, patenteEntreprise2026, tfuEntreprise2026, tvmEntreprise2026,
    irfParticulier2026, itsParticulier2026, aibParticulier2026, ibaParticulier2026,
    patenteParticulier2026, tpsParticulier2026, tvmParticulier2026, tfuParticulier2026,
  ] as Array<FiscalParametersModel<Record<string, unknown>>>,
};

export function getFiscalParametersMocks(
  year: number
): Array<FiscalParametersModel<Record<string, unknown>>> {
  return fiscalParametersMocksByYear[year] ?? [];
}
