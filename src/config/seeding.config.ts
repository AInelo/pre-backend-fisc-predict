import { DatabaseManager } from '@/config/databases/DatabaseManager';
import { fiscalParametersRepository } from '@/repositories/fiscal-parameters/FiscalParametersRepository';
import { getFiscalParametersMocks } from '@/mocks/fiscal-parameters';

const SEED_METADATA_COLLECTION = 'app_seed_metadata';
const SEED_YEARS = [2025, 2026];

export interface FiscalParametersSeedingConfig {
  autoSeed: boolean;
  allowProductionSeeding: boolean;
  forceReseed: boolean;
}

export const defaultSeedingConfig: FiscalParametersSeedingConfig = {
  autoSeed: process.env.AUTO_SEED_FISCAL_PARAMS === 'true',
  allowProductionSeeding: process.env.ALLOW_PRODUCTION_SEEDING === 'true',
  forceReseed: process.env.FORCE_RESEED === 'true',
};

function seedFlagId(year: number): string {
  return `fiscal_params_${year}`;
}

async function isSeedDone(year: number): Promise<boolean> {
  const db = DatabaseManager.getInstance().getMongo().getCollection(SEED_METADATA_COLLECTION);
  const doc = await db.findOne({ _id: seedFlagId(year) as unknown as never });
  return !!doc;
}

async function markSeedDone(year: number, count: number): Promise<void> {
  const db = DatabaseManager.getInstance().getMongo().getCollection(SEED_METADATA_COLLECTION);
  await db.updateOne(
    { _id: seedFlagId(year) as unknown as never },
    { $set: { seeded_at: new Date(), count } },
    { upsert: true }
  );
}

export async function seedFiscalParameters(
  config: FiscalParametersSeedingConfig = defaultSeedingConfig
): Promise<void> {
  if (!config.autoSeed) {
    return;
  }

  if (process.env.NODE_ENV === 'production' && !config.allowProductionSeeding) {
    throw new Error('Le seeding des paramètres fiscaux est désactivé en production.');
  }

  await DatabaseManager.getInstance().initAll();

  for (const year of SEED_YEARS) {
    const alreadySeeded = !config.forceReseed && (await isSeedDone(year));

    if (alreadySeeded) {
      console.log(`✅ Seed fiscal ${year} déjà effectué — ignoré.`);
      continue;
    }

    const mocks = getFiscalParametersMocks(year);
    if (mocks.length === 0) {
      console.warn(`⚠️  Aucun mock trouvé pour l'année ${year} — seed ignoré.`);
      continue;
    }

    await fiscalParametersRepository.upsertMany(mocks);
    await markSeedDone(year, mocks.length);
    console.log(`🌱 Seed fiscal ${year} effectué — ${mocks.length} documents insérés.`);
  }
}
