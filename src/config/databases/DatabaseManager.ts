// import { MongoDatabase } from "./MongoDatabase";
// import { MySQLDatabase } from "./MySQLDatabase";

// /**
//  * Gestionnaire centralisé pour les deux bases de données
//  */
// export class DatabaseManager {
//     private static instance: DatabaseManager;
//     private mysqlDb: MySQLDatabase;
//     private mongoDb: MongoDatabase;

//     private constructor() {
//         this.mysqlDb = MySQLDatabase.getInstance();
//         this.mongoDb = MongoDatabase.getInstance();
//     }

//     public static getInstance(): DatabaseManager {
//         if (!DatabaseManager.instance) {
//             DatabaseManager.instance = new DatabaseManager();
//         }
//         return DatabaseManager.instance;
//     }

//     public async initAll(): Promise<void> {
//         console.log('🚀 Initialisation des bases de données...');
//         await Promise.all([
//             this.mysqlDb.init(),
//             this.mongoDb.init()
//         ]);
//         console.log('✅ Toutes les bases sont prêtes');
//     }

//     public getMySQL(): MySQLDatabase {
//         return this.mysqlDb;
//     }

//     public getMongo(): MongoDatabase {
//         return this.mongoDb;
//     }

//     public async closeAll(): Promise<void> {
//         await Promise.all([
//             this.mysqlDb.close(),
//             this.mongoDb.close()
//         ]);
//     }

//     public async cleanAll(): Promise<void> {
//         await Promise.all([
//             this.mysqlDb.clean(),
//             this.mongoDb.clean()
//         ]);
//     }

//     public isReady(): boolean {
//         return this.mysqlDb.isReady() && this.mongoDb.isReady();
//     }
// }
