// import { MongoDatabase } from "./MongoDatabase";

// /**
//  * Gestionnaire centralisé pour MongoDB
//  */
// export class DatabaseManager {
//     private static instance: DatabaseManager;
//     private mongoDb: MongoDatabase;

//     private constructor() {
//         this.mongoDb = MongoDatabase.getInstance();
//     }

//     public static getInstance(): DatabaseManager {
//         if (!DatabaseManager.instance) {
//             DatabaseManager.instance = new DatabaseManager();
//         }
//         return DatabaseManager.instance;
//     }

//     public async initAll(): Promise<void> {
//         console.log('🚀 Initialisation de MongoDB...');
//         await this.mongoDb.init();
//         console.log('✅ MongoDB est prêt');
//     }

//     public getMongo(): MongoDatabase {
//         return this.mongoDb;
//     }

//     public async closeAll(): Promise<void> {
//         await this.mongoDb.close();
//     }

//     public async cleanAll(): Promise<void> {
//         await this.mongoDb.clean();
//     }

//     public isReady(): boolean {
//         return this.mongoDb.isReady();
//     }
// }
