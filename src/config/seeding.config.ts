// /**
//  * Configuration du système de seeding pour Agbaza
//  */

// export interface SeedingConfig {
//     // Activer le seeding automatique au démarrage
//     autoSeed: boolean;
    
//     // Activer le seeding en production (dangereux)
//     allowProductionSeeding: boolean;
    
//     // Vérifier si la base est déjà seedée
//     checkExistingData: boolean;
    
//     // Hasher les mots de passe
//     hashPasswords: boolean;
    
//     // Ordre de seeding MySQL (TypeORM) - dépendances
//     mysqlSeedingOrder: string[];
    
//     // Ordre de seeding MongoDB (Mongoose) - dépendances
//     mongoSeedingOrder: string[];
    
//     // Tables MySQL à ignorer lors du nettoyage
//     protectedMySQLTables: string[];
    
//     // Collections MongoDB à ignorer lors du nettoyage
//     protectedMongoCollections: string[];
    
//     // Configuration spécifique aux bases de données
//     databaseConfig: {
//         mysql: {
//             enabled: boolean;
//             checkConnection: boolean;
//         };
//         mongo: {
//             enabled: boolean;
//             checkConnection: boolean;
//         };
//     };
    
//     // Configuration des mocks
//     mockConfig: {
//         // Nombre d'éléments à créer par défaut
//         defaultCount: number;
//         // Activer les données invalides pour les tests
//         includeInvalidData: boolean;
//         // Activer les données partielles pour les tests
//         includePartialData: boolean;
//         // Activer les données de test spécifiques
//         includeTestData: boolean;
//     };
    
//     // Configuration du hachage des mots de passe
//     passwordConfig: {
//         saltRounds: number;
//         algorithm: string;
//     };
    
//     // Configuration des logs
//     loggingConfig: {
//         enabled: boolean;
//         level: 'debug' | 'info' | 'warn' | 'error';
//         showProgress: boolean;
//         showTiming: boolean;
//     };
// }

// export const defaultSeedingConfig: SeedingConfig = {
//     autoSeed: process.env.NODE_ENV !== 'production' && process.env.AUTO_SEED !== 'false',
//     allowProductionSeeding: process.env.ALLOW_PRODUCTION_SEEDING === 'true',
//     checkExistingData: true,
//     hashPasswords: true,
    
//     // Ordre de seeding MySQL (TypeORM) - respecter les dépendances
//     mysqlSeedingOrder: [
//         'etablissements',           // Base pour les autres entités
//         'utilisateurs_ministere',   // Indépendant
//         'professionnels',           // Indépendant
//         'patients',                 // Indépendant
//         'dossiers_medicaux',        // Dépend de patients
//         'consultations',            // Dépend de patients, professionnels, établissements
//         'analyses_medicales',       // Dépend de patients, professionnels, établissements
//         'analyse_resultats',        // Dépend de analyses_medicales
//         'ordonnances',              // Dépend de patients, professionnels, établissements
//         'ordonnance_medicaments',   // Dépend de ordonnances
//         'vaccinations',             // Dépend de patients, professionnels, établissements
//         'vaccination_reactions',    // Dépend de vaccinations
//         'assurances_sante',         // Dépend de patients, professionnels
//         'banques_sang',             // Dépend de établissements
//         'lits',                     // Dépend de établissements
//         'produits_medicaments'      // Dépend de établissements
//     ],
    
//     // Ordre de seeding MongoDB (Mongoose) - respecter les dépendances
//     mongoSeedingOrder: [
//         'users',                    // Base pour les autres entités
//         'audits',                   // Indépendant
//         'coordinates',              // Indépendant
//         'document_links',           // Indépendant
//         'statistiques_ministere',   // Indépendant
//         'notifications_ministerielles', // Indépendant
//         'rapports_sante_globale',   // Indépendant
//         'communiques_presse',       // Indépendant
//         'notifications',            // Dépend de professionnels
//         'statistiques',             // Dépend de professionnels
//         'ressources_medicales',     // Dépend de patients
//         'map_cartographie',         // Dépend de établissements
//         'rapports_etablissement'    // Dépend de établissements
//     ],
    
//     // Tables MySQL protégées
//     protectedMySQLTables: [
//         'migrations',
//         'typeorm_metadata',
//         'information_schema',
//         'performance_schema',
//         'mysql',
//         'sys'
//     ],
    
//     // Collections MongoDB protégées
//     protectedMongoCollections: [
//         'system.indexes',
//         'system.users',
//         'system.roles',
//         'system.version',
//         'system.profile',
//         'system.js'
//     ],
    
//     // Configuration des bases de données
//     databaseConfig: {
//         mysql: {
//             enabled: process.env.MYSQL_ENABLED !== 'false',
//             checkConnection: process.env.MYSQL_CHECK_CONNECTION !== 'false'
//         },
//         mongo: {
//             enabled: process.env.MONGO_ENABLED !== 'false',
//             checkConnection: process.env.MONGO_CHECK_CONNECTION !== 'false'
//         }
//     },
    
//     // Configuration des mocks
//     mockConfig: {
//         defaultCount: parseInt(process.env.MOCK_DEFAULT_COUNT || '10', 10),
//         includeInvalidData: process.env.MOCK_INCLUDE_INVALID === 'true',
//         includePartialData: process.env.MOCK_INCLUDE_PARTIAL === 'true',
//         includeTestData: process.env.MOCK_INCLUDE_TEST === 'true'
//     },
    
//     // Configuration du hachage des mots de passe
//     passwordConfig: {
//         saltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS || '10', 10),
//         algorithm: process.env.PASSWORD_ALGORITHM || 'bcrypt'
//     },
    
//     // Configuration des logs
//     loggingConfig: {
//         enabled: process.env.SEEDING_LOGS_ENABLED !== 'false',
//         level: (process.env.SEEDING_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
//         showProgress: process.env.SEEDING_SHOW_PROGRESS !== 'false',
//         showTiming: process.env.SEEDING_SHOW_TIMING === 'true'
//     }
// };

// export const getSeedingConfig = (): SeedingConfig => {
//     return {
//         ...defaultSeedingConfig,
//         autoSeed: process.env.AUTO_SEED !== 'false' && (
//             process.env.NODE_ENV !== 'production' || 
//             process.env.ALLOW_PRODUCTION_SEEDING === 'true'
//         ),
//         allowProductionSeeding: process.env.ALLOW_PRODUCTION_SEEDING === 'true',
//         checkExistingData: process.env.CHECK_EXISTING_DATA !== 'false',
//         hashPasswords: process.env.HASH_PASSWORDS !== 'false',
        
//         // Configuration des bases de données
//         databaseConfig: {
//             mysql: {
//                 enabled: process.env.MYSQL_ENABLED !== 'false',
//                 checkConnection: process.env.MYSQL_CHECK_CONNECTION !== 'false'
//             },
//             mongo: {
//                 enabled: process.env.MONGO_ENABLED !== 'false',
//                 checkConnection: process.env.MONGO_CHECK_CONNECTION !== 'false'
//             }
//         },
        
//         // Configuration des mocks
//         mockConfig: {
//             defaultCount: parseInt(process.env.MOCK_DEFAULT_COUNT || '10', 10),
//             includeInvalidData: process.env.MOCK_INCLUDE_INVALID === 'true',
//             includePartialData: process.env.MOCK_INCLUDE_PARTIAL === 'true',
//             includeTestData: process.env.MOCK_INCLUDE_TEST === 'true'
//         },
        
//         // Configuration du hachage des mots de passe
//         passwordConfig: {
//             saltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS || '10', 10),
//             algorithm: process.env.PASSWORD_ALGORITHM || 'bcrypt'
//         },
        
//         // Configuration des logs
//         loggingConfig: {
//             enabled: process.env.SEEDING_LOGS_ENABLED !== 'false',
//             level: (process.env.SEEDING_LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error') || 'info',
//             showProgress: process.env.SEEDING_SHOW_PROGRESS !== 'false',
//             showTiming: process.env.SEEDING_SHOW_TIMING === 'true'
//         }
//     };
// };

// /**
//  * Configuration spécifique pour l'environnement de développement
//  */
// export const developmentSeedingConfig: SeedingConfig = {
//     ...defaultSeedingConfig,
//     autoSeed: true,
//     allowProductionSeeding: false,
//     checkExistingData: true,
//     hashPasswords: true,
//     mockConfig: {
//         defaultCount: 15,
//         includeInvalidData: true,
//         includePartialData: true,
//         includeTestData: true
//     },
//     loggingConfig: {
//         enabled: true,
//         level: 'debug',
//         showProgress: true,
//         showTiming: true
//     }
// };

// /**
//  * Configuration spécifique pour l'environnement de test
//  */
// export const testSeedingConfig: SeedingConfig = {
//     ...defaultSeedingConfig,
//     autoSeed: true,
//     allowProductionSeeding: false,
//     checkExistingData: false,
//     hashPasswords: true,
//     mockConfig: {
//         defaultCount: 5,
//         includeInvalidData: true,
//         includePartialData: true,
//         includeTestData: true
//     },
//     loggingConfig: {
//         enabled: false,
//         level: 'error',
//         showProgress: false,
//         showTiming: false
//     }
// };

// /**
//  * Configuration spécifique pour l'environnement de production
//  */
// export const productionSeedingConfig: SeedingConfig = {
//     ...defaultSeedingConfig,
//     autoSeed: false,
//     allowProductionSeeding: false,
//     checkExistingData: true,
//     hashPasswords: true,
//     mockConfig: {
//         defaultCount: 0,
//         includeInvalidData: false,
//         includePartialData: false,
//         includeTestData: false
//     },
//     loggingConfig: {
//         enabled: true,
//         level: 'warn',
//         showProgress: false,
//         showTiming: false
//     }
// };

// /**
//  * Obtenir la configuration selon l'environnement
//  */
// export const getEnvironmentSeedingConfig = (): SeedingConfig => {
//     const env = process.env.NODE_ENV || 'development';
    
//     switch (env) {
//         case 'production':
//             return productionSeedingConfig;
//         case 'test':
//             return testSeedingConfig;
//         case 'development':
//         default:
//             return developmentSeedingConfig;
//     }
// };

// /**
//  * Valider la configuration de seeding
//  */
// export const validateSeedingConfig = (config: SeedingConfig): string[] => {
//     const errors: string[] = [];
    
//     // Vérifier la configuration de production
//     if (config.allowProductionSeeding && process.env.NODE_ENV === 'production') {
//         errors.push('⚠️ ATTENTION: Le seeding en production est activé !');
//     }
    
//     // Vérifier l'ordre de seeding MySQL
//     if (config.mysqlSeedingOrder.length === 0) {
//         errors.push('❌ L\'ordre de seeding MySQL ne peut pas être vide');
//     }
    
//     // Vérifier l'ordre de seeding MongoDB
//     if (config.mongoSeedingOrder.length === 0) {
//         errors.push('❌ L\'ordre de seeding MongoDB ne peut pas être vide');
//     }
    
//     // Vérifier la configuration des mots de passe
//     if (config.passwordConfig.saltRounds < 8) {
//         errors.push('⚠️ Le nombre de rounds de sel est trop faible (minimum 8)');
//     }
    
//     // Vérifier la configuration des mocks
//     if (config.mockConfig.defaultCount < 0) {
//         errors.push('❌ Le nombre par défaut de mocks ne peut pas être négatif');
//     }
    
//     return errors;
// };

// export default getSeedingConfig;