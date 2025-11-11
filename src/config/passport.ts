// import passport from 'passport';
// import { PassportStrategy } from '../services/utils/passportStrategy';

// /**
//  * Configuration et initialisation de Passport.js
//  */
// export class PassportConfig {
//     private static instance: PassportConfig | null = null;
//     private passportStrategy: PassportStrategy | null = null;

//     private constructor() {
//         // Don't initialize passportStrategy here
//         this.initializePassport();
//     }

//     /**
//      * Singleton pattern pour s'assurer qu'une seule instance existe
//      */
//     public static getInstance(): PassportConfig {
//         if (!PassportConfig.instance) {
//             PassportConfig.instance = new PassportConfig();
//         }
//         return PassportConfig.instance;
//     }

//     /**
//      * Lazy initialization of PassportStrategy
//      */
//     private getPassportStrategy(): PassportStrategy {
//         if (!this.passportStrategy) {
//             this.passportStrategy = new PassportStrategy();
//         }
//         return this.passportStrategy;
//     }

//     /**
//      * Initialiser Passport avec les stratégies
//      */
//     private initializePassport(): void {
//         // Les stratégies sont déjà configurées dans PassportStrategy
//         // Passport est maintenant prêt à être utilisé
//         console.log('✅ Passport.js initialisé avec la stratégie JWT');
//     }

//     /**
//      * Obtenir l'instance de Passport
//      */
//     public getPassport() {
//         return passport;
//     }

//     /**
//      * Obtenir les middlewares d'authentification
//      */
//     public getAuthMiddlewares() {
//         return {
//             // Authentification JWT obligatoire
//             jwt: PassportStrategy.authenticateJWT(),
            
//             // Google OAuth désactivé selon les spécifications
            
//             // Authentification optionnelle (pour les routes publiques)
//             optional: PassportStrategy.optionalAuth(),
            
//             // Vérification des rôles
//             requireRole: (roles: string[]) => PassportStrategy.requireRole(roles),
            
//             // Vérification du statut actif
//             requireActive: PassportStrategy.requireActiveStatus()
//         };
//     }

//     /**
//      * Middleware pour ajouter Passport à Express
//      */
//     public getPassportMiddleware() {
//         return passport.initialize();
//     }

//     /**
//      * Middleware pour les sessions (si nécessaire)
//      */
//     public getSessionMiddleware() {
//         return passport.session();
//     }
// }

// // Export a function that returns the instance
// export function getPassportConfig(): PassportConfig {
//     return PassportConfig.getInstance();
// }

// // For backward compatibility, export a default that uses lazy initialization
// export default getPassportConfig;

// // Export the middlewares as functions that will be called when needed
// export const authMiddlewares = getPassportConfig().getAuthMiddlewares();
// export const passportMiddleware = getPassportConfig().getPassportMiddleware();
// export const sessionMiddleware = getPassportConfig().getSessionMiddleware();
