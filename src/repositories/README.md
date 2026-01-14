# Repository Layer - Couche de Persistance

Cette couche fournit une abstraction pour interagir avec MongoDB pour les impôts et leurs constantes fiscales.

## Structure

### `impot.repository.ts`
Repository principal pour la gestion des impôts et leurs constantes.

**Méthodes principales :**
- `findByCodeAndYear(code, anneeFiscale)` - Trouve un impôt par code et année
- `findByYear(anneeFiscale)` - Trouve tous les impôts pour une année
- `findActiveByYear(anneeFiscale)` - Trouve les impôts actifs pour une année
- `create(impot)` - Crée un nouvel impôt
- `update(code, anneeFiscale, updates)` - Met à jour un impôt
- `updateConstantes(code, anneeFiscale, constantes)` - Met à jour les constantes
- `upsertConstante(code, anneeFiscale, constante)` - Ajoute ou met à jour une constante
- `getConstante(code, anneeFiscale, constanteCode)` - Récupère une constante spécifique

## Utilisation

```typescript
import { ImpotRepository } from './repositories/impot.repository';

const repository = new ImpotRepository();

// Récupérer un impôt
const iba = await repository.findByCodeAndYear('IBA', 2025);

// Récupérer une constante
const tauxGeneral = await repository.getConstante('IBA', 2025, 'TAUX_GENERAL');

// Mettre à jour une constante
await repository.upsertConstante('IBA', 2025, {
  code: 'TAUX_GENERAL',
  valeur: 0.32,
  type: 'number',
  description: 'Nouveau taux général',
  unite: '%'
});
```

