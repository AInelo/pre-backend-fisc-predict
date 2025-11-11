// import { DataSource } from 'typeorm';
// import dotenv from 'dotenv';
// import path from 'path';

// // Import des entités TypeORM
// import { EtablissementEntity } from '../../models/etablissement/Etablissement';
// import { BanqueSangEntity } from '../../models/etablissement/BanqueSang';
// import { LitEntity } from '../../models/etablissement/Lit';
// import { ProduitMedicamentEntity } from '../../models/etablissement/ProduitMedicament';

// import { UtilisateurMinistereEntity } from '../../models/ministere/UtilisateurMinistere';

// import { ProfessionnelEntity } from '../../models/professionnel/Professionnel';
// import { AssuranceSanteEntity } from '../../models/professionnel/AssuranceSante';

// import { PatientEntity } from '../../models/patient/Patient';
// import { DossierMedicalEntity } from '../../models/patient/DossierMedical';
// import { ConsultationEntity } from '../../models/patient/Consultation';
// import { AnalyseMedicaleEntity } from '../../models/patient/AnalyseMedicale';
// import { AnalyseResultatEntity } from '../../models/patient/AnalyseResultat';
// import { OrdonnanceEntity } from '../../models/patient/Ordonnance';
// import { OrdonnanceMedicamentEntity } from '../../models/patient/OrdonnanceMedicament';
// import { VaccinationEntity } from '../../models/patient/Vaccination';
// import { VaccinationReactionEntity } from '../../models/patient/VaccinationReaction';

// const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.dev';
// dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// /**
//  * Gestion de la connexion MySQL via TypeORM
//  */
// export class MySQLDatabase {
//     private static instance: MySQLDatabase;
//     private dataSource: DataSource;
//     private isInitialized: boolean = false;
//     private initializationPromise: Promise<void> | null = null;

//     private constructor() {
//         this.dataSource = new DataSource({
//             type: 'mysql',
//             host: process.env.DB_HOST,
//             port: parseInt(process.env.DB_PORT || '3306'),
//             username: process.env.DB_USER,
//             password: process.env.DB_PASSWORD,
//             database: process.env.DB_NAME,
//             entities: [
//                 EtablissementEntity,
//                 BanqueSangEntity,
//                 LitEntity,
//                 ProduitMedicamentEntity,
//                 UtilisateurMinistereEntity,
//                 ProfessionnelEntity,
//                 AssuranceSanteEntity,
//                 PatientEntity,
//                 DossierMedicalEntity,
//                 ConsultationEntity,
//                 AnalyseMedicaleEntity,
//                 AnalyseResultatEntity,
//                 OrdonnanceEntity,
//                 OrdonnanceMedicamentEntity,
//                 VaccinationEntity,
//                 VaccinationReactionEntity
//             ],
//             migrations: ['src/migrations/**/*.{ts,js}'],
//             synchronize: process.env.NODE_ENV !== 'production',
//             logging: process.env.NODE_ENV === 'development',
//             timezone: 'Z',
//         });

//         console.log(`🔧 MySQL configuré: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
//     }

//     public static getInstance(): MySQLDatabase {
//         if (!MySQLDatabase.instance) {
//             MySQLDatabase.instance = new MySQLDatabase();
//         }
//         return MySQLDatabase.instance;
//     }

//     public static async getInitializedInstance(): Promise<MySQLDatabase> {
//         const instance = MySQLDatabase.getInstance();
//         await instance.init();
//         return instance;
//     }

//     public async init(): Promise<void> {
//         if (this.isInitialized) return;
//         if (this.initializationPromise) return this.initializationPromise;

//         this.initializationPromise = this.performInitialization();
//         await this.initializationPromise;
//     }

//     private async performInitialization(): Promise<void> {
//         try {
//             const maxAttempts = parseInt(process.env.DB_CONNECT_MAX_TRIES || '5', 10);
//             let attempt = 0;

//             while (!this.isInitialized && attempt < maxAttempts) {
//                 try {
//                     attempt++;
//                     console.log(`⏳ Connexion MySQL (${attempt}/${maxAttempts})...`);
//                     await this.dataSource.initialize();
//                     this.isInitialized = true;
//                     console.log(`✅ MySQL connecté: ${process.env.DB_NAME}`);

//                     if (process.env.NODE_ENV === 'production') {
//                         await this.dataSource.runMigrations();
//                         console.log('✅ Migrations exécutées');
//                     }
//                 } catch (err) {
//                     console.warn('⚠️ Échec connexion MySQL:', (err as any)?.message);
//                     if (this.dataSource.isInitialized) {
//                         await this.dataSource.destroy();
//                     }
//                     if (attempt >= maxAttempts) throw err;
                    
//                     const delayMs = Math.min(30000, 1000 * Math.pow(2, attempt - 1));
//                     await new Promise(res => setTimeout(res, delayMs));
//                 }
//             }
//         } catch (error) {
//             console.error('❌ Erreur MySQL:', error);
//             this.isInitialized = false;
//             this.initializationPromise = null;
//             throw error;
//         }
//     }

//     public getDataSource(): DataSource {
//         if (!this.isInitialized) {
//             throw new Error('MySQL non initialisé. Appelez init() d\'abord.');
//         }
//         return this.dataSource;
//     }

//     public isReady(): boolean {
//         return this.isInitialized && this.dataSource.isInitialized;
//     }

//     public async close(): Promise<void> {
//         if (this.isInitialized && this.dataSource.isInitialized) {
//             await this.dataSource.destroy();
//             this.isInitialized = false;
//             this.initializationPromise = null;
//             console.log('✅ MySQL fermé');
//         }
//     }

//     public async clean(): Promise<void> {
//         if (this.isInitialized) {
//             await this.dataSource.dropDatabase();
//             await this.dataSource.synchronize();
//             console.log('🧹 Base MySQL nettoyée');
//         }
//     }
// }