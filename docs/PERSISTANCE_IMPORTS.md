# Persistance des Impôts et Constantes Fiscales

Ce document décrit l'architecture de persistance mise en place pour gérer les impôts et leurs constantes fiscales dans MongoDB.

## Architecture

### 1. Modèles (`src/models/impot.ts`)

Définit les interfaces TypeScript pour les impôts et leurs constantes :

- `Impot` : Structure principale d'un impôt avec ses constantes
- `ConstanteFiscale` : Structure d'une constante fiscale
- `ImpotDocument` : Document MongoDB avec `_id` et dates

### 2. Connexion MongoDB (`src/config/databases/MongoConnection.ts`)

Gestionnaire singleton pour la connexion MongoDB avec le driver natif.

**Utilisation :**
```typescript
import { MongoConnection } from './config/databases/MongoConnection';

const mongo = MongoConnection.getInstance();
await mongo.connect();
const db = mongo.getDb();
```

### 3. Repository (`src/repositories/impot.repository.ts`)

Couche d'abstraction pour les opérations CRUD sur les impôts.

**Fonctionnalités :**
- Recherche par code et année fiscale
- Gestion des constantes (ajout, mise à jour, récupération)
- Index automatiques pour optimiser les recherches

### 4. Service (`src/services/impots/constantes-fiscales.service.ts`)

Service de haut niveau pour récupérer les constantes avec cache.

**Fonctionnalités :**
- Cache en mémoire (TTL: 5 minutes)
- Récupération typée des constantes
- Valeurs par défaut en cas d'erreur

### 5. Seeding (`src/config/seeding/impots.seed.ts`)

Script d'initialisation des données pour les années 2025 et 2026.

**Impôts initialisés :**
- IBA (Impôt sur les Bénéfices des Artisans)
- IS (Impôt sur les Sociétés)
- PATENTE
- IRF (Impôt sur le Revenu Foncier)
- ITS (Impôt sur les Traitements et Salaires)
- TVA (Taxe sur la Valeur Ajoutée)

## Utilisation dans les Classes de Calcul

### Avant (Constantes hardcodées)

```typescript
const CONSTANTES = {
  TAUX_GENERAL: 0.30,
  MINIMUM_GENERAL: 0.015,
  // ...
} as const;
```

### Après (Constantes depuis MongoDB)

```typescript
import { ConstantesFiscalesService } from '../constantes-fiscales.service';

class CalculateurIBA {
  private static constantesService = new ConstantesFiscalesService();
  
  public static async calculerIBA(donnees: DonneesIBA, anneeFiscale: number) {
    // Charger les constantes depuis MongoDB
    const constantes = await this.constantesService.getConstantesCached('IBA', anneeFiscale);
    
    // Utiliser les constantes
    const tauxNominal = donnees.beneficeImposable * constantes.TAUX_GENERAL;
    // ...
  }
}
```

Voir `src/services/impots/single/reel/IBA.with-persistence.ts` pour un exemple complet.

## Migration des Classes Existantes

Pour migrer une classe de calcul existante :

1. **Remplacer les constantes hardcodées** par un appel au service
2. **Rendre la méthode async** si elle ne l'est pas déjà
3. **Ajouter le paramètre `anneeFiscale`** pour charger les bonnes constantes
4. **Gérer les erreurs** avec des valeurs par défaut si nécessaire

### Exemple de Migration

**Avant :**
```typescript
export class CalculateurIS {
  private static readonly CONSTANTES_FISCALES = {
    TAUX_GENERAL: 0.30,
    TAUX_REDUIT: 0.25,
    // ...
  } as const;
  
  public calculerIS() {
    const taux = CalculateurIS.CONSTANTES_FISCALES.TAUX_GENERAL;
    // ...
  }
}
```

**Après :**
```typescript
import { ConstantesFiscalesService } from '../constantes-fiscales.service';

export class CalculateurIS {
  private static constantesService = new ConstantesFiscalesService();
  
  public async calculerIS(anneeFiscale: number = new Date().getFullYear()) {
    const constantes = await this.constantesService.getConstantesCached('IS', anneeFiscale);
    const taux = constantes.TAUX_GENERAL;
    // ...
  }
}
```

## Gestion des Années Fiscales

### Année 2025
- Tous les impôts sont **actifs** (`actif: true`)
- Les constantes sont disponibles pour les calculs

### Année 2026
- Tous les impôts sont **inactifs** (`actif: false`) par défaut
- Le code existant vérifie `annee >= 2026` et retourne une erreur au frontend
- Pour activer les calculs pour 2026, mettre à jour les constantes dans MongoDB et changer `actif: true`

## API de Gestion (Futur)

Des routes API peuvent être ajoutées pour :

- `GET /api/admin/impots` - Lister tous les impôts
- `GET /api/admin/impots/:code/:annee` - Récupérer un impôt
- `PUT /api/admin/impots/:code/:annee/constantes` - Mettre à jour les constantes
- `POST /api/admin/impots` - Créer un nouvel impôt

## Avantages de cette Architecture

1. **Flexibilité** : Les constantes peuvent être modifiées sans redéployer le code
2. **Traçabilité** : Historique des modifications avec `dateModification` et `version`
3. **Multi-année** : Gestion facile de plusieurs années fiscales
4. **Performance** : Cache en mémoire pour éviter les appels répétés
5. **Séparation des responsabilités** : Repository, Service, Modèle bien séparés

## Prochaines Étapes

1. Migrer progressivement les classes de calcul existantes
2. Ajouter des routes API pour la gestion administrative
3. Créer une interface d'administration pour modifier les constantes
4. Ajouter des tests unitaires pour le repository et le service
5. Implémenter un système de validation des constantes

