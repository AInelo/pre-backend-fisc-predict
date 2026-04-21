import { Collection, Db, Document, MongoClient } from 'mongodb';

export class MongoDatabase {
    private static instance: MongoDatabase;
    private client: MongoClient | null = null;
    private db: Db | null = null;
    private isConnected = false;
    private initializationPromise: Promise<void> | null = null;

    private constructor() {}

    public static getInstance(): MongoDatabase {
        if (!MongoDatabase.instance) {
            MongoDatabase.instance = new MongoDatabase();
        }
        return MongoDatabase.instance;
    }

    public static async getInitializedInstance(): Promise<MongoDatabase> {
        const instance = MongoDatabase.getInstance();
        await instance.init();
        return instance;
    }

    public async init(): Promise<void> {
        if (this.isConnected) {
            return;
        }
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this.performInitialization();
        await this.initializationPromise;
    }

    private async performInitialization(): Promise<void> {
        const mongoUrl = process.env.MONGO_URL;
        const dbName = process.env.MONGO_DB_NAME;

        if (!mongoUrl || !dbName) {
            this.initializationPromise = null;
            throw new Error('MONGO_URL ou MONGO_DB_NAME manquant');
        }

        try {
            this.client = new MongoClient(mongoUrl);
            await this.client.connect();
            this.db = this.client.db(dbName);
            this.isConnected = true;

            await this.ensureCollections();
            console.log(`✅ MongoDB connecté: ${dbName}`);
        } catch (error) {
            this.client = null;
            this.db = null;
            this.isConnected = false;
            this.initializationPromise = null;
            throw error;
        }
    }

    private async ensureCollections(): Promise<void> {
        if (!this.db) {
            throw new Error('Connexion MongoDB non disponible');
        }

        const collectionNames = (
            process.env.COLLECTION_NAMES ??
            process.env.MONGO_FISCAL_PARAMETERS_COLLECTION ??
            'parametres_fiscaux'
        )
            .split(',')
            .map((name) => name.trim())
            .filter((name) => name.length > 0);

        const existingCollections = await this.db.listCollections().toArray();
        const existingNames = new Set(existingCollections.map((collection) => collection.name));

        for (const name of collectionNames) {
            if (!existingNames.has(name)) {
                await this.db.createCollection(name);
            }
        }
    }

    public getDb(): Db {
        if (!this.db || !this.isConnected) {
            throw new Error('MongoDB non connecté. Appelez init() d\'abord.');
        }

        return this.db;
    }

    public getCollection<TSchema extends Document = Document>(name: string): Collection<TSchema> {
        return this.getDb().collection<TSchema>(name);
    }

    public isReady(): boolean {
        return this.isConnected;
    }

    public async reconnect(): Promise<void> {
        await this.close();
        await this.init();
    }

    public async close(): Promise<void> {
        if (this.client) {
            await this.client.close();
        }

        this.client = null;
        this.db = null;
        this.isConnected = false;
        this.initializationPromise = null;
    }

    public async clean(): Promise<void> {
        if (this.db) {
            await this.db.dropDatabase();
        }
    }
}
