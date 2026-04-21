import { fiscalParametersRepository } from '@/repositories/fiscal-parameters/FiscalParametersRepository';
import { fiscalParametersSeed2025 } from '@/data/fiscal-parameters/fiscal-parameters.seed';

export interface FiscalParametersSeedingConfig {
    autoSeed: boolean;
    allowProductionSeeding: boolean;
}

export const defaultSeedingConfig: FiscalParametersSeedingConfig = {
    autoSeed: process.env.AUTO_SEED_FISCAL_PARAMS === 'true',
    allowProductionSeeding: process.env.ALLOW_PRODUCTION_SEEDING === 'true',
};

export async function seedFiscalParameters(config: FiscalParametersSeedingConfig = defaultSeedingConfig): Promise<void> {
    if (!config.autoSeed) {
        return;
    }

    if (process.env.NODE_ENV === 'production' && !config.allowProductionSeeding) {
        throw new Error('Le seeding des paramètres fiscaux est désactivé en production.');
    }

    await fiscalParametersRepository.upsertMany(fiscalParametersSeed2025);
}
