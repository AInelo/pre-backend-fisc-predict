import { Db, Collection, ObjectId } from 'mongodb';
import { MongoConnection } from '../config/databases/MongoConnection';
import { Impot, ImpotDocument, ConstanteFiscale } from '../models/impot';

/**
 * Repository pour la gestion des impôts et leurs constantes en base de données
 */
export class ImpotRepository {
  private db: Db;
  private collection: Collection<ImpotDocument>;
  private readonly COLLECTION_NAME = 'impots';

  constructor() {
    const mongoConnection = MongoConnection.getInstance();
    this.db = mongoConnection.getDb();
    this.collection = this.db.collection<ImpotDocument>(this.COLLECTION_NAME);
  }

  /**
   * Crée un index pour optimiser les recherches par code et année fiscale
   */
  public async createIndexes(): Promise<void> {
    try {
      await this.collection.createIndex({ code: 1, anneeFiscale: 1 }, { unique: true });
      await this.collection.createIndex({ anneeFiscale: 1 });
      await this.collection.createIndex({ actif: 1 });
      console.log('✅ Index créés pour la collection impots');
    } catch (error) {
      console.error('❌ Erreur lors de la création des index:', error);
    }
  }

  /**
   * Trouve un impôt par son code et son année fiscale
   */
  public async findByCodeAndYear(code: string, anneeFiscale: number): Promise<ImpotDocument | null> {
    return await this.collection.findOne({ code, anneeFiscale });
  }

  /**
   * Trouve tous les impôts pour une année fiscale donnée
   */
  public async findByYear(anneeFiscale: number): Promise<ImpotDocument[]> {
    return await this.collection.find({ anneeFiscale }).toArray();
  }

  /**
   * Trouve tous les impôts actifs pour une année fiscale
   */
  public async findActiveByYear(anneeFiscale: number): Promise<ImpotDocument[]> {
    return await this.collection.find({ anneeFiscale, actif: true }).toArray();
  }

  /**
   * Trouve un impôt par son ID
   */
  public async findById(id: string): Promise<ImpotDocument | null> {
    return await this.collection.findOne({ _id: new ObjectId(id) });
  }

  /**
   * Crée un nouvel impôt
   */
  public async create(impot: Omit<Impot, '_id' | 'dateCreation' | 'dateModification'>): Promise<ImpotDocument> {
    const now = new Date();
    const impotDocument: Omit<ImpotDocument, '_id'> = {
      ...impot,
      dateCreation: now,
      dateModification: now,
      version: 1
    };

    const result = await this.collection.insertOne(impotDocument as ImpotDocument);
    return await this.findById(result.insertedId.toString()) as ImpotDocument;
  }

  /**
   * Met à jour un impôt existant
   */
  public async update(
    code: string,
    anneeFiscale: number,
    updates: Partial<Omit<Impot, '_id' | 'code' | 'anneeFiscale' | 'dateCreation'>>
  ): Promise<ImpotDocument | null> {
    const updateDoc = {
      ...updates,
      dateModification: new Date(),
      $inc: { version: 1 }
    };

    const result = await this.collection.findOneAndUpdate(
      { code, anneeFiscale },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    return result || null;
  }

  /**
   * Met à jour les constantes d'un impôt
   */
  public async updateConstantes(
    code: string,
    anneeFiscale: number,
    constantes: ConstanteFiscale[]
  ): Promise<ImpotDocument | null> {
    return await this.update(code, anneeFiscale, { constantes });
  }

  /**
   * Ajoute ou met à jour une constante spécifique
   */
  public async upsertConstante(
    code: string,
    anneeFiscale: number,
    constante: ConstanteFiscale
  ): Promise<ImpotDocument | null> {
    const impot = await this.findByCodeAndYear(code, anneeFiscale);
    
    if (!impot) {
      throw new Error(`Impot ${code} pour l'année ${anneeFiscale} introuvable`);
    }

    const constantes = [...impot.constantes];
    const index = constantes.findIndex(c => c.code === constante.code);
    
    if (index >= 0) {
      constantes[index] = constante;
    } else {
      constantes.push(constante);
    }

    return await this.updateConstantes(code, anneeFiscale, constantes);
  }

  /**
   * Récupère une constante spécifique d'un impôt
   */
  public async getConstante(
    code: string,
    anneeFiscale: number,
    constanteCode: string
  ): Promise<ConstanteFiscale | null> {
    const impot = await this.findByCodeAndYear(code, anneeFiscale);
    
    if (!impot) {
      return null;
    }

    const constante = impot.constantes.find(c => c.code === constanteCode);
    return constante || null;
  }

  /**
   * Supprime un impôt
   */
  public async delete(code: string, anneeFiscale: number): Promise<boolean> {
    const result = await this.collection.deleteOne({ code, anneeFiscale });
    return result.deletedCount > 0;
  }

  /**
   * Liste tous les impôts
   */
  public async findAll(): Promise<ImpotDocument[]> {
    return await this.collection.find({}).toArray();
  }

  /**
   * Trouve un impôt par type
   */
  public async findByType(type: 'reel' | 'tps' | 'autre', anneeFiscale?: number): Promise<ImpotDocument[]> {
    const query: any = { type };
    if (anneeFiscale) {
      query.anneeFiscale = anneeFiscale;
    }
    return await this.collection.find(query).toArray();
  }
}

