import { ImpotRepository } from '../../repositories/impot.repository';
import { ConstanteFiscale } from '../../models/impot';

/**
 * Service pour la gestion des constantes fiscales
 * Fournit une interface simplifiée pour récupérer les constantes depuis la base de données
 */
export class ConstantesFiscalesService {
  private repository: ImpotRepository;

  constructor() {
    this.repository = new ImpotRepository();
  }

  /**
   * Récupère toutes les constantes d'un impôt pour une année donnée
   */
  public async getConstantes(impotCode: string, anneeFiscale: number): Promise<Record<string, any>> {
    const impot = await this.repository.findByCodeAndYear(impotCode, anneeFiscale);
    
    if (!impot) {
      throw new Error(`Impot ${impotCode} pour l'année ${anneeFiscale} introuvable`);
    }

    // Convertit le tableau de constantes en objet pour faciliter l'accès
    const constantes: Record<string, any> = {};
    for (const constante of impot.constantes) {
      constantes[constante.code] = constante.valeur;
    }

    return constantes;
  }

  /**
   * Récupère une constante spécifique
   */
  public async getConstante(
    impotCode: string,
    anneeFiscale: number,
    constanteCode: string
  ): Promise<any> {
    const constante = await this.repository.getConstante(impotCode, anneeFiscale, constanteCode);
    
    if (!constante) {
      throw new Error(
        `Constante ${constanteCode} introuvable pour l'impôt ${impotCode} (année ${anneeFiscale})`
      );
    }

    return constante.valeur;
  }

  /**
   * Récupère une constante avec une valeur par défaut si elle n'existe pas
   */
  public async getConstanteOrDefault(
    impotCode: string,
    anneeFiscale: number,
    constanteCode: string,
    defaultValue: any
  ): Promise<any> {
    try {
      return await this.getConstante(impotCode, anneeFiscale, constanteCode);
    } catch (error) {
      console.warn(
        `Constante ${constanteCode} non trouvée pour ${impotCode} (${anneeFiscale}), utilisation de la valeur par défaut`
      );
      return defaultValue;
    }
  }

  /**
   * Vérifie si un impôt existe pour une année donnée
   */
  public async impotsExists(impotCode: string, anneeFiscale: number): Promise<boolean> {
    const impot = await this.repository.findByCodeAndYear(impotCode, anneeFiscale);
    return impot !== null;
  }

  /**
   * Récupère toutes les constantes d'un impôt sous forme d'objet typé
   * Utile pour les classes de calcul qui attendent un objet de constantes
   */
  public async getConstantesAsObject<T extends Record<string, any>>(
    impotCode: string,
    anneeFiscale: number
  ): Promise<T> {
    const constantes = await this.getConstantes(impotCode, anneeFiscale);
    return constantes as T;
  }

  /**
   * Cache en mémoire pour éviter les appels répétés à la base de données
   * Clé: `${impotCode}_${anneeFiscale}`
   */
  private cache: Map<string, Record<string, any>> = new Map();
  private cacheTimeout: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Récupère les constantes avec cache
   */
  public async getConstantesCached(
    impotCode: string,
    anneeFiscale: number
  ): Promise<Record<string, any>> {
    const cacheKey = `${impotCode}_${anneeFiscale}`;
    const cached = this.cache.get(cacheKey);
    const cachedTime = this.cacheTimeout.get(cacheKey);

    // Vérifier si le cache est valide
    if (cached && cachedTime && Date.now() - cachedTime < this.CACHE_TTL) {
      return cached;
    }

    // Récupérer depuis la base de données
    const constantes = await this.getConstantes(impotCode, anneeFiscale);
    
    // Mettre en cache
    this.cache.set(cacheKey, constantes);
    this.cacheTimeout.set(cacheKey, Date.now());

    return constantes;
  }

  /**
   * Vide le cache
   */
  public clearCache(impotCode?: string, anneeFiscale?: number): void {
    if (impotCode && anneeFiscale) {
      const cacheKey = `${impotCode}_${anneeFiscale}`;
      this.cache.delete(cacheKey);
      this.cacheTimeout.delete(cacheKey);
    } else {
      this.cache.clear();
      this.cacheTimeout.clear();
    }
  }
}

