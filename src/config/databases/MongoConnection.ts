import { MongoClient, Db } from 'mongodb';

/**
 * Gestionnaire de connexion MongoDB avec le driver natif
 */
export class MongoConnection {
  private static instance: MongoConnection;
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected: boolean = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {
    // Singleton
  }

  public static getInstance(): MongoConnection {
    if (!MongoConnection.instance) {
      MongoConnection.instance = new MongoConnection();
    }
    return MongoConnection.instance;
  }

  /**
   * Initialise la connexion MongoDB
   */
  public async connect(): Promise<void> {
    if (this.isConnected && this.db) {
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionPromise = this.performConnection();
    await this.connectionPromise;
  }

  private async performConnection(): Promise<void> {
    try {
      const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017';
      const dbName = process.env.MONGO_DB_NAME || 'startax_db';

      console.log(`🔌 Connexion à MongoDB: ${mongoUrl}/${dbName}`);

      this.client = new MongoClient(mongoUrl);
      await this.client.connect();
      
      this.db = this.client.db(dbName);
      this.isConnected = true;

      console.log(`✅ MongoDB connecté: ${dbName}`);

      // Gestion des événements de connexion
      this.client.on('error', (err) => {
        console.error('🔴 Erreur MongoDB:', err);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        console.log('🟡 MongoDB déconnecté');
        this.isConnected = false;
      });

    } catch (error) {
      console.error('❌ Erreur de connexion MongoDB:', error);
      this.isConnected = false;
      this.connectionPromise = null;
      throw error;
    }
  }

  /**
   * Retourne l'instance de la base de données
   */
  public getDb(): Db {
    if (!this.db || !this.isConnected) {
      throw new Error('MongoDB non connecté. Appelez connect() d\'abord.');
    }
    return this.db;
  }

  /**
   * Retourne le client MongoDB
   */
  public getClient(): MongoClient {
    if (!this.client || !this.isConnected) {
      throw new Error('MongoDB non connecté. Appelez connect() d\'abord.');
    }
    return this.client;
  }

  /**
   * Vérifie si la connexion est active
   */
  public isReady(): boolean {
    return this.isConnected && this.db !== null;
  }

  /**
   * Ferme la connexion MongoDB
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.isConnected = false;
      this.connectionPromise = null;
      console.log('✅ Connexion MongoDB fermée');
    }
  }

  /**
   * Réinitialise la connexion
   */
  public async reconnect(): Promise<void> {
    await this.disconnect();
    await this.connect();
  }
}

