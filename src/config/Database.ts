import mysql from 'mysql2/promise';
import { MongoClient, Db, Collection, ObjectId, Document as MongoDocument } from 'mongodb';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// dotenv.config();

const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

/**
 * 
 * Classe singleton `Database` pour gérer les connexions et requêtes à MySQL et MongoDB.
 * Fournit un accès centralisé à la base relationnelle (MySQL) et non relationnelle (MongoDB).
 */
export class Database {
    private static instance: Database;
    private pool: mysql.Pool;
    
    private mongoClient: MongoClient;
    private mongoDB: Db;
    private isMongoConnected: boolean = false;
    
    // Flag pour éviter l'initialisation multiple
    private isInitialized: boolean = false;
    private initializationPromise: Promise<void> | null = null;

    /**
     * Constructeur privé pour forcer l'utilisation de la méthode `getInstance`.
     * Initialise les connexions aux bases de données MySQL et MongoDB.
     */
    private constructor() {
        // ==================== CONFIGURATION MYSQL ====================
        this.pool = mysql.createPool({
            host: String(process.env.DB_HOST),
            port: parseInt(String(process.env.DB_PORT)),
            user: String(process.env.DB_USER),
            password: String(process.env.DB_PASSWORD),
            database: String(process.env.DB_NAME),
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            timezone: '+00:00',
        });

        console.log(`Pool MySQL créé pour la base dans le constructeur : 

            ENV ${process.env.NODE_ENV}
            DB NAME ${process.env.DB_NAME} et 
            DB_USER ${process.env.DB_USER}
            DB_HOST ${process.env.DB_HOST} 
            DB_PASSWORD ${process.env.DB_PASSWORD}
            DB_PORT ${process.env.DB_PORT}
            MONGO_URL ${process.env.MONGO_URL}
            MONGO_DB_NAME ${process.env.MONGO_DB_NAME}
            \n\n` +
            `La connexion est prête à être utilisée. Si vous utilisez un environnement de test, assurez-vous que la base de données est configurée correctement dans votre fichier .env.${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}.\n` +
            `Si vous utilisez un environnement de test, la base de données sera créée automatiquement si elle n'existe pas déjà     
            . La connexion sera établie à la première requête.`);

        // ==================== CONFIGURATION MONGODB ====================
        const mongoUrl = String(process.env.MONGO_URL);
        const mongoDbName = String(process.env.MONGO_DB_NAME);

        this.mongoClient = new MongoClient(mongoUrl);
        this.mongoDB = this.mongoClient.db(mongoDbName);

        console.log(`Client MongoDB initialisé pour la base : ${mongoDbName}. Connexion en attente d'initiation.`);

        // ⚠️ NE PAS appeler l'initialisation dans le constructeur
        // L'initialisation sera faite via la méthode init() ou de manière lazy
    }

    /**
     * Méthode publique pour initialiser complètement la base de données
     * Cette méthode doit être appelée explicitement après getInstance()
     */
    public async init(): Promise<void> {
        // Éviter l'initialisation multiple
        if (this.isInitialized) {
            return;
        }

        // Si une initialisation est déjà en cours, attendre qu'elle se termine
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this.performInitialization();
        await this.initializationPromise;
    }

    /**
     * Effectue l'initialisation complète dans le bon ordre
     */
    private async performInitialization(): Promise<void> {
        try {
            console.log('🚀 Début de l\'initialisation de la base de données...');

            // 1. Initialiser MongoDB
            await this.initMongoDB();
            console.log('✅ MongoDB initialisé');

            // 2. Initialiser MySQL (création base + tables)
            await this.initializeConfigMysql();
            console.log('✅ MySQL initialisé (base + tables créées)');

            // 3. Initialiser les templates MongoDB
            await this.initializeConfigMongoDb();
            console.log('✅ Templates MongoDB insérés');

            // 4. Maintenant on peut ajouter les données (car les tables existent)
            await this.addedCommuneToDatabase();
            console.log('✅ Communes ajoutées');

            await this.addedHopitauxToDatabase();
            console.log('✅ Hôpitaux ajoutés');

            this.isInitialized = true;
            console.log('✅ Initialisation complète terminée');

        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation complète :', error);
            this.isInitialized = false;
            this.initializationPromise = null;
            throw error;
        }
    }

    /**
     * Initialise la connexion à MongoDB.
     */
    private async initMongoDB(): Promise<void> {
        try {
            const mongoUrl = String(process.env.MONGO_URL);
            const dbName = String(process.env.MONGO_DB_NAME);

            this.mongoClient = new MongoClient(mongoUrl);
            await this.mongoClient.connect();

            this.mongoDB = this.mongoClient.db(dbName);
            this.isMongoConnected = true;

            console.log(`✅ Base de données MongoDB connectée : ${this.mongoDB.databaseName}`);
        } catch (error) {
            console.error('❌ Erreur de connexion à MongoDB :', error);
            this.isMongoConnected = false;
            throw error;
        }
    }

    public async ensureMongoConnected(): Promise<void> {
        if (!this.isMongoConnected) {
            await this.initMongoDB();
        }
    }

    /**
     * Retourne l'instance unique de la base de données.
     * Implémente le design pattern Singleton.
     */
    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    /**
     * Méthode statique pour obtenir une instance initialisée
     * Recommandée pour éviter les erreurs
     */
    public static async getInitializedInstance(): Promise<Database> {
        const instance = Database.getInstance();
        await instance.init();
        return instance;
    }

    // ==================== MÉTHODES MYSQL ====================

    public getPool(): mysql.Pool {
        if (!this.pool) {
            // recrée le pool si null
            this.pool = mysql.createPool({
                host: String(process.env.DB_HOST),
                port: parseInt(String(process.env.DB_PORT)),
                user: String(process.env.DB_USER),
                password: String(process.env.DB_PASSWORD),
                database: String(process.env.DB_NAME),
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                timezone: '+00:00',
            });
            console.log('Pool MySQL recréé automatiquement dans getPool()');
        }
        return this.pool;
    }

    /**
     * Découpe un fichier SQL en liste de requêtes CREATE TABLE valides.
     */
    private filsSqlReadedToListOfTableCreation(tablesSqlFileReaded: string): string[] {
        return tablesSqlFileReaded
            .split(';')                     // Séparer par ;
            .map(part => part.trim())       // Enlever les espaces
            .filter(part =>
                part.toUpperCase().startsWith('CREATE TABLE') && part.length > 0
            )                               // Garder uniquement les CREATE TABLE
            .map(part => part + ';');       // Reconstituer la requête avec ;
    }

    public async addedCommuneToDatabase(): Promise<void> {
        try {
            const pool = this.getPool();

            // Vérification du nombre de communes existantes (info uniquement)
            const [rows] = await pool.query('SELECT COUNT(*) AS count FROM commune');
            const count = parseInt((rows as any)[0].count, 10);
            
            if (count > 0) {
                console.log(`ℹ️ La table "commune" contient déjà ${count} données. Aucune insertion effectuée.`);
                return;
            }

            console.log(`ℹ️ La table "commune" est vide. Insertion des données...`);

            // Lecture et exécution du script SQL
            const sqlPath = path.resolve(__dirname, '../databases/communes.sql');
            const sqlContent = await fs.readFile(sqlPath, 'utf-8'); 

            const sqlQueries = sqlContent
                .split(';')
                .map(query => query.trim())
                .filter(query => query.length > 0);

            for (const query of sqlQueries) {
                console.log(`📝 Exécution de la requête : ${query.split('\n')[0]}...`);
                await pool.query(query);
            }

            console.log('✅ Ajout des communes terminé.');
        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout des communes :', error);
            throw error;
        }
    }

    public async addedHopitauxToDatabase(): Promise<void> {
        try {
            const pool = this.getPool();

            // Vérification du nombre d'hôpitaux existants (info uniquement)
            const [rows] = await pool.query('SELECT COUNT(*) AS count FROM hopital');
            const count = parseInt((rows as any)[0].count, 10);
            
            if (count > 0) {
                console.log(`ℹ️ La table "hopital" contient déjà ${count} enregistrements. Aucune insertion effectuée.`);
                return;
            }

            console.log(`ℹ️ La table "hopital" est vide. Insertion des données...`);

            // Lecture et exécution du fichier SQL
            const sqlPath = path.resolve(__dirname, '../databases/hopitaux.sql');
            const sqlContent = await fs.readFile(sqlPath, 'utf-8');
            const sqlQueries = sqlContent
                .split(';')
                .map(query => query.trim())
                .filter(query => query.length > 0);

            for (const query of sqlQueries) {
                console.log(`📝 Exécution de la requête : ${query.split('\n')[0]}...`);
                await pool.query(query);
            }

            console.log('✅ Ajout (idempotent) des hôpitaux terminé.');
        } catch (error) {
            console.error('❌ Erreur lors de l\'ajout des hôpitaux :', error);
            throw error;
        }
    }

    public async initializeConfigMysql(): Promise<void> {
        try {
            const dbCreateSqlPath = path.resolve(__dirname, '../databases/database.create.sql');
            const tablesCreateSqlPath = path.resolve(__dirname, '../databases/tables.create.sql');

            const databaseSql = await fs.readFile(dbCreateSqlPath, 'utf-8');
            const tablesSqlFileReaded = await fs.readFile(tablesCreateSqlPath, 'utf-8');

            const tablesSql = this.filsSqlReadedToListOfTableCreation(tablesSqlFileReaded);

            // Connexion temporaire sans base pour créer la DB
            const tempPool = mysql.createPool({
                host: String(process.env.DB_HOST),
                port: parseInt(String(process.env.DB_PORT)),
                user: String(process.env.DB_USER),
                password: String(process.env.DB_PASSWORD),
                waitForConnections: true,
                connectionLimit: 1,
                queueLimit: 0,
            });

            await tempPool.query(databaseSql);
            await tempPool.end();

            // Maintenant on connecte sur la bonne base
            const pool = this.getPool();

            for (const sql of tablesSql) {
                console.log(`📝 Exécution : ${sql.split('\n')[0]}...`);
                await pool.query(sql);
            }

            console.log('✅ Initialisation MySQL terminée (base + tables créées).');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation MySQL :', error);
            throw error;
        }
    }

    public async cleanInitializeConfigMysql(): Promise<void> {
        try {
            const dbName = String(process.env.DB_NAME);

            // Connexion temporaire sans DB pour drop la base
            const tempPool = mysql.createPool({
                host: process.env.DB_HOST,
                port: parseInt(String(process.env.DB_PORT)),
                user: String(process.env.DB_USER),
                password: String(process.env.DB_PASSWORD),
                waitForConnections: true,
                connectionLimit: 1,
                queueLimit: 0,
            });

            // Supprimer la base si elle existe
            await tempPool.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
            console.log(`Base MySQL '${dbName}' supprimée.`);

            // Fermer connexion temporaire
            await tempPool.end();
        } catch (error) {
            console.error('Erreur lors du nettoyage MySQL :', error);
            throw error;
        }
    }

    /**
     * Initialise MongoDB : crée les collections et insère les templates JSON.
     */
    public async initializeConfigMongoDb(): Promise<void> {
        try {
            if (!this.isMongoConnected) {
                await this.initMongoDB();
            }

            // Utiliser la même collection que FormulaireTemplateModel
            const collectionName = 'forms';
            const documentId = 'forms_schemas';
            const collection = this.mongoDB.collection(collectionName);

            // Vérifier si la collection existe déjà
            const collections = await this.mongoDB.listCollections({ name: collectionName }).toArray();
            if (collections.length === 0) {
                await this.mongoDB.createCollection(collectionName);
                console.log(`Collection '${collectionName}' créée.`);
            } else {
                console.log(`Collection '${collectionName}' existe déjà.`);
            }

            // Vérifier si le document forms_schemas existe déjà
            const existingDoc = await collection.findOne({ _id: documentId as any });
            if (!existingDoc) {
                // Créer le document forms_schemas initial
                const initialDoc = {
                    _id: documentId as any,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await collection.insertOne(initialDoc);
                console.log(`Document '${documentId}' créé.`);
            } else {
                console.log(`Document '${documentId}' existe déjà.`);
            }

            // Charger tous les fichiers JSON templates du dossier databases
            const templatesDir = path.resolve(__dirname, '../databases');
            const files = await fs.readdir(templatesDir);

            // Filtrer les fichiers JSON correspondant aux templates (ex : *.form.template.json)
            const jsonTemplateFiles = files.filter(f => f.endsWith('.form.template.json'));

            console.log(`Fichiers templates trouvés : ${jsonTemplateFiles.join(', ')}`);

            for (const filename of jsonTemplateFiles) {
                const filePath = path.join(templatesDir, filename);
                const fileContent = await fs.readFile(filePath, 'utf-8');
                const jsonData = JSON.parse(fileContent);

                // Extraire le type de formulaire du nom de fichier ou du contenu
                let typeFormulaire = null;
                
                // Essayer d'extraire du nom de fichier (ex: hygieniste.form.template.json)
                const filenameMatch = filename.match(/^(\w+)\.form\.template\.json$/);
                if (filenameMatch) {
                    typeFormulaire = filenameMatch[1];
                } else if (jsonData.typeFormulaire) {
                    // Ou utiliser le type dans le JSON
                    typeFormulaire = jsonData.typeFormulaire;
                }

                if (!typeFormulaire) {
                    console.warn(`⚠️ Impossible de déterminer le type de formulaire pour ${filename}`);
                    continue;
                }

                // Vérifier si ce template existe déjà dans le document
                const currentDoc = await collection.findOne({ _id: documentId as any });
                if (currentDoc && currentDoc[typeFormulaire]) {
                    console.log(`ℹ️ Template '${typeFormulaire}' existe déjà. Mise à jour...`);
                }

                // Insérer ou mettre à jour le template dans le document forms_schemas
                const updateData = {
                    $set: {
                        [typeFormulaire]: jsonData,
                        updatedAt: new Date()
                    }
                };

                await collection.updateOne(
                    { _id: documentId as any },
                    updateData,
                    { upsert: true }
                );
                console.log(`✅ Template '${typeFormulaire}' inséré/mis à jour depuis ${filename}`);
            }

            console.log('✅ Initialisation MongoDB terminée (templates insérés).');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation MongoDB :', error);
            throw error;
        }
    }

    public async cleanInitializeConfigMongoDb(): Promise<void> {
        try {
            if (!this.isMongoConnected) {
                await this.initMongoDB();
            }

            console.log('isMongoConnected:', this.isMongoConnected);
            console.log('mongoDB:', this.mongoDB ? 'OK' : 'undefined');

            // Supprimer la collection forms (utilisée par FormulaireTemplateModel)
            const collectionName = 'forms';

            const collections = await this.mongoDB.listCollections({ name: collectionName }).toArray();
            if (collections.length > 0) {
                await this.mongoDB.collection(collectionName).drop();
                console.log(`Collection MongoDB '${collectionName}' supprimée.`);
            } else {
                console.log(`Collection MongoDB '${collectionName}' inexistante.`);
            }

            // Option 2 : Supprimer toute la base MongoDB (décommenter si besoin)
            // await this.mongoDB.dropDatabase();
            // console.log(`Base MongoDB '${this.mongoDB.databaseName}' supprimée.`);
        } catch (error) {
            console.error('Erreur lors du nettoyage MongoDB :', error);
            throw error;
        }
    }

    /**
     * Force la réinitialisation des templates de formulaires
     */
    public async forceReinitializeTemplates(): Promise<void> {
        try {
            if (!this.isMongoConnected) {
                await this.initMongoDB();
            }

            console.log('🔄 Force réinitialisation des templates...');

            // Supprimer le document forms_schemas existant
            const collectionName = 'forms';
            const documentId = 'forms_schemas';
            const collection = this.mongoDB.collection(collectionName);

            await collection.deleteOne({ _id: documentId as any });
            console.log(`🗑️ Document '${documentId}' supprimé.`);

            // Réinitialiser les templates
            await this.initializeConfigMongoDb();
            console.log('✅ Templates réinitialisés avec succès.');
        } catch (error) {
            console.error('❌ Erreur lors de la réinitialisation des templates :', error);
            throw error;
        }
    }

    /**
     * Exécute une requête SQL générique.
     * 
     * @param sql - Requête SQL
     * @param params - Paramètres optionnels
     * @returns Résultat brut de la requête
     */
    public async query(sql: string, params?: any[]): Promise<any> {
        const connection = await this.pool.getConnection();
        try {
            const [rows] = await connection.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('Erreur lors de l\'exécution de la requête:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Exécute une transaction MySQL.
     * 
     * @param callback - Fonction contenant les requêtes à exécuter dans la transaction
     * @returns Résultat retourné par la fonction callback
     */
    public async transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();
            const result = await callback(connection);
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Exécute une requête SELECT.
     * 
     * @param sql - Requête SELECT
     * @param params - Paramètres optionnels
     * @returns Résultats typés
     */
    public async select<T = mysql.RowDataPacket[]>(sql: string, params?: any[]): Promise<T> {
        const connection = await this.pool.getConnection();
        try {
            const [rows] = await connection.execute(sql, params);
            return rows as T;
        } catch (error) {
            console.error('Erreur lors de l\'exécution de la requête SELECT:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Exécute une requête INSERT.
     * 
     * @param sql - Requête INSERT
     * @param params - Paramètres de la requête
     * @returns Résultat de l'insertion (insertId, affectedRows, etc.)
     */
    public async insert(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
        const connection = await this.pool.getConnection();
        try {
            const [result] = await connection.execute(sql, params);
            return result as mysql.ResultSetHeader;
        } catch (error) {
            console.error('Erreur lors de l\'exécution de la requête INSERT:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Exécute une requête UPDATE.
     */
    public async update(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
        const connection = await this.pool.getConnection();
        try {
            const [result] = await connection.execute(sql, params);
            return result as mysql.ResultSetHeader;
        } catch (error) {
            console.error('Erreur lors de l\'exécution de la requête UPDATE:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Exécute une requête DELETE.
     */
    public async delete(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
        const connection = await this.pool.getConnection();
        try {
            const [result] = await connection.execute(sql, params);
            return result as mysql.ResultSetHeader;
        } catch (error) {
            console.error('Erreur lors de l\'exécution de la requête DELETE:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // ==================== MÉTHODES MONGODB ====================

    /**
     * Retourne l'instance MongoDB.
     * @throws Erreur si MongoDB n'est pas connecté
     */
    public getMongoDb(): Db {
        if (!this.isMongoConnected) {
            throw new Error('MongoDB n\'est pas connecté');
        }
        return this.mongoDB;
    }

    /**
     * Récupère une collection MongoDB typée.
     * 
     * @template T - Type des documents
     * @param collectionName - Nom de la collection
     * @returns Instance typée de la collection
     */
    public getCollection<T extends MongoDocument = MongoDocument>(collectionName: string): Collection<T> {
        return this.mongoDB.collection<T>(collectionName);
    }

    // ==================== FERMETURE DES CONNEXIONS ====================

    /**
     * Ferme proprement les connexions à MySQL et MongoDB.
     */
    public async close(): Promise<void> {
        if (this.mongoClient) {
            await this.mongoClient.close();
            this.isMongoConnected = false;
        }
        if (this.pool) {
            await this.pool.end(); // fermer pool MySQL
        }
    }
}

