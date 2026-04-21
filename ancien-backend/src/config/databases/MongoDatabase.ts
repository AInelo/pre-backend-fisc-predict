// import mongoose from 'mongoose';
// import fs from 'fs/promises';
// import path from 'path';

// /**
//  * Gestion de la connexion MongoDB via Mongoose
//  */
// export class MongoDatabase {
//     private static instance: MongoDatabase;
//     private isConnected: boolean = false;
//     private initializationPromise: Promise<void> | null = null;

//     private constructor() {
//         console.log(`🔧 MongoDB configuré: ${process.env.MONGO_DB_NAME}`);
//     }

//     public static getInstance(): MongoDatabase {
//         if (!MongoDatabase.instance) {
//             MongoDatabase.instance = new MongoDatabase();
//         }
//         return MongoDatabase.instance;
//     }

//     public static async getInitializedInstance(): Promise<MongoDatabase> {
//         const instance = MongoDatabase.getInstance();
//         await instance.init();
//         return instance;
//     }

//     public async init(): Promise<void> {
//         if (this.isConnected) return;
//         if (this.initializationPromise) return this.initializationPromise;

//         this.initializationPromise = this.performInitialization();
//         await this.initializationPromise;
//     }

//     private async performInitialization(): Promise<void> {
//         try {
//             const mongoUrl = process.env.MONGO_URL;
//             const dbName = process.env.MONGO_DB_NAME;

//             if (!mongoUrl || !dbName) {
//                 throw new Error('MONGO_URL ou MONGO_DB_NAME manquant');
//             }

//             await mongoose.connect(mongoUrl, { dbName });
//             this.isConnected = true;
//             console.log(`✅ MongoDB connecté: ${dbName}`);

//             // Événements de connexion
//             mongoose.connection.on('error', (err) => {
//                 console.error('🔴 Erreur MongoDB:', err);
//             });

//             mongoose.connection.on('disconnected', () => {
//                 console.log('🟡 MongoDB déconnecté');
//                 this.isConnected = false;
//             });

//             mongoose.connection.on('reconnected', () => {
//                 console.log('🟢 MongoDB reconnecté');
//                 this.isConnected = true;
//             });

//             // Créer les collections
//             await this.ensureCollections();
            
//             // Initialiser les templates
//             await this.initializeTemplates();

//         } catch (error) {
//             console.error('❌ Erreur MongoDB:', error);
//             this.isConnected = false;
//             this.initializationPromise = null;
//             throw error;
//         }
//     }

//     private async ensureCollections(): Promise<void> {
//         const collectionNames = process.env.COLLECTION_NAMES?.split(',')
//             .map(name => name.trim())
//             .filter(name => name.length > 0) || [];

//         if (collectionNames.length === 0) return;

//         const db = mongoose.connection.db;
//         if (!db) throw new Error('Connexion MongoDB non disponible');

//         const existingCollections = await db.listCollections().toArray();
//         const existingNames = new Set(existingCollections.map(c => c.name));

//         for (const name of collectionNames) {
//             if (!existingNames.has(name)) {
//                 await db.createCollection(name);
//                 console.log(`🆕 Collection créée: ${name}`);
//             } else {
//                 console.log(`✔️ Collection existante: ${name}`);
//             }
//         }
//     }

//     private async initializeTemplates(): Promise<void> {
//         try {
//             const FormsModel = mongoose.model('forms_schemas', 
//                 new mongoose.Schema({
//                     _id: { type: String, required: true }
//                 }, { strict: false }), 'forms');

//             const existingDoc = await FormsModel.findOne({ _id: 'forms_schemas' });
//             if (existingDoc) {
//                 console.log('ℹ️ Templates déjà présents');
//                 return;
//             }

//             const templatesDir = path.resolve(__dirname, '../databases');
//             const files = await fs.readdir(templatesDir);
//             const templateFiles = files.filter(f => f.endsWith('.form.template.json'));

//             if (templateFiles.length === 0) {
//                 console.log('ℹ️ Aucun template trouvé');
//                 return;
//             }

//             const templatesData: any = {
//                 _id: 'forms_schemas',
//                 createdAt: new Date(),
//                 updatedAt: new Date()
//             };

//             for (const filename of templateFiles) {
//                 const filePath = path.join(templatesDir, filename);
//                 const fileContent = await fs.readFile(filePath, 'utf-8');
//                 const jsonData = JSON.parse(fileContent);

//                 const filenameMatch = filename.match(/^(\w+)\.form\.template\.json$/);
//                 const typeFormulaire = filenameMatch ? filenameMatch[1] : jsonData.typeFormulaire;

//                 if (typeFormulaire) {
//                     templatesData[typeFormulaire] = jsonData;
//                     console.log(`📝 Template chargé: ${typeFormulaire}`);
//                 }
//             }

//             await FormsModel.create(templatesData);
//             console.log('✅ Templates initialisés');

//         } catch (error) {
//             console.error('❌ Erreur templates:', error);
//             throw error;
//         }
//     }

//     public getConnection() {
//         if (!this.isConnected) {
//             throw new Error('MongoDB non connecté. Appelez init() d\'abord.');
//         }
//         return mongoose.connection;
//     }

//     public getMongoose(): typeof mongoose {
//         if (!this.isConnected) {
//             throw new Error('MongoDB non connecté. Appelez init() d\'abord.');
//         }
//         return mongoose;
//     }

//     public isReady(): boolean {
//         return this.isConnected;
//     }

//     public async reconnect(): Promise<void> {
//         if (this.isConnected) {
//             await mongoose.disconnect();
//             this.isConnected = false;
//         }
//         await this.init();
//     }

//     public async resetTemplates(): Promise<void> {
//         const FormsModel = mongoose.model('forms_schemas', 
//             new mongoose.Schema({}, { strict: false }), 'forms');
//         await FormsModel.findByIdAndDelete('forms_schemas');
//         console.log('🗑️ Templates supprimés');
//         await this.initializeTemplates();
//     }

//     public async close(): Promise<void> {
//         if (this.isConnected) {
//             await mongoose.disconnect();
//             this.isConnected = false;
//             this.initializationPromise = null;
//             console.log('✅ MongoDB fermé');
//         }
//     }

//     public async clean(): Promise<void> {
//         if (this.isConnected) {
//             const db = mongoose.connection.db;
//             if (db) {
//                 await db.dropDatabase();
//                 console.log('🧹 Base MongoDB nettoyée');
//             }
//         }
//     }
// }