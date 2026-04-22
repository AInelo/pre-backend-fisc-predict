import { DatabaseManager } from '@/config/databases/DatabaseManager';
import {
  FiscalParametersModel,
  FiscalParametersQueryModel,
} from '@/models/fiscal-parameters';
import { FiscalParametersError } from '@/services/fiscal-parameters/errors';
import {
  FiscalContributorType,
  FiscalParamsFor,
  FiscalTaxCode,
} from '@/types/fiscal-parameters';

type FiscalParametersStoredDocument<TParams> = FiscalParametersModel<TParams> & { _id?: unknown };

export class FiscalParametersRepository {
    private readonly databaseManager = DatabaseManager.getInstance();
    private readonly collectionName =
    process.env.MONGO_FISCAL_PARAMETERS_COLLECTION || 'parametres_fiscaux';

  public async getRequiredParams<TCode extends FiscalTaxCode>(
    query: FiscalParametersQueryModel
  ): Promise<FiscalParamsFor<TCode>> {
    if (!query.codeImpot || !query.typeContribuable || !Number.isInteger(query.annee)) {
      throw new FiscalParametersError(
        'La requête de paramètres fiscaux est invalide.',
        'FISCAL_PARAMS_QUERY_INVALID',
        query
      );
    }

    try {
      await this.databaseManager.initAll();
    } catch (error) {
      throw new FiscalParametersError(
        error instanceof Error ? error.message : 'MongoDB n’est pas configuré.',
        'MONGO_NOT_CONFIGURED',
        query
      );
    }

    const collection =
      this.databaseManager
        .getMongo()
        .getCollection<FiscalParametersStoredDocument<FiscalParamsFor<TCode>>>(this.collectionName);

    const document = await collection.findOne({
      code_impot: query.codeImpot,
      type_contribuable: query.typeContribuable,
      annee: query.annee,
    });

    if (!document) {
      throw new FiscalParametersError(
        `Aucun paramétrage fiscal actif trouvé pour ${query.codeImpot} (${query.typeContribuable}) en ${query.annee}.`,
        'FISCAL_PARAMS_NOT_FOUND',
        query
      );
    }

    if (!document.actif) {
      throw new FiscalParametersError(
        `Le paramétrage fiscal ${query.codeImpot} (${query.typeContribuable}) ${query.annee} existe mais il est inactif.`,
        'FISCAL_PARAMS_INACTIVE',
        query
      );
    }

    if (!document.parametres || typeof document.parametres !== 'object') {
      throw new FiscalParametersError(
        `Le document de paramètres fiscaux ${query.codeImpot} (${query.typeContribuable}) ${query.annee} est invalide.`,
        'FISCAL_PARAMS_INVALID',
        query
      );
    }

    return document.parametres;
  }




  

  public async getAllByAnneeAndType(
    annee: number,
    typeContribuable: FiscalContributorType
  ): Promise<Array<FiscalParametersModel<Record<string, unknown>>>> {
    await this.databaseManager.initAll();
    const collection = this.databaseManager
      .getMongo()
      .getCollection<FiscalParametersStoredDocument<Record<string, unknown>>>(this.collectionName);

    const documents = await collection
      .find({ annee, type_contribuable: typeContribuable, actif: true })
      .sort({ code_impot: 1 })
      .toArray();

    return documents.map(({ _id, ...doc }) => doc as FiscalParametersModel<Record<string, unknown>>);
  }

  public async getAnneesDisponibles(): Promise<number[]> {
    await this.databaseManager.initAll();
    const collection = this.databaseManager
      .getMongo()
      .getCollection<FiscalParametersStoredDocument<Record<string, unknown>>>(this.collectionName);

    const annees = await collection.distinct('annee', { actif: true });
    return (annees as number[]).sort((a, b) => a - b);
  }

  public async upsertMany(
    documents: Array<FiscalParametersModel<Record<string, unknown>>>
  ): Promise<void> {
    await this.databaseManager.initAll();
    const collection = this.databaseManager
      .getMongo()
      .getCollection<FiscalParametersStoredDocument<Record<string, unknown>>>(this.collectionName);

    for (const document of documents) {
      await collection.updateOne(
        {
          code_impot: document.code_impot,
          type_contribuable: document.type_contribuable,
          annee: document.annee,
        },
        { $set: document },
        { upsert: true }
      );
    }

    await collection.createIndex(
      { code_impot: 1, type_contribuable: 1, annee: 1 },
      { unique: true, name: 'fiscal_params_unique_triplet' }
    );
  }
}

export const fiscalParametersRepository = new FiscalParametersRepository();
export type { FiscalTaxCode, FiscalContributorType };
