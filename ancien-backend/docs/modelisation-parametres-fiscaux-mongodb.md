# Modélisation MongoDB — Paramètres Fiscaux Évolutifs par Année

> **Contexte** : Ce document décrit la stratégie de persistance des constantes fiscales
> (taux, seuils, tranches, frais fixes) pour le système de prédiction fiscale du Bénin.
> L'objectif est de rendre ces constantes **administrables chaque année** sans toucher au code,
> tout en préservant les règles de calcul dans les services TypeScript.

---

## 1. Le problème

Aujourd'hui, chaque service hardcode ses constantes fiscales :

```typescript
// src/services/impots/single/reel/IRF.ts
export const CONSTANTES_IRF = {
  TAUX_NORMAL: 0.12,
  TAUX_REDUIT: 0.10,
  RSRTB: 4000,
  JOUR_ECHEANCE: 10
} as const;

// src/services/impots/single/tps/TPS.ts
private static readonly TAUX_TPS = 0.05;
private static readonly REDEVANCE_RTB = 4_000;
private static readonly SEUIL_REGIME_REEL = 50_000_000;
```

**Conséquences** :
- Un changement de taux en 2026 oblige un déploiement de code
- Les simulations historiques (2024 vs 2025) sont impossibles
- Aucune traçabilité des modifications

---

## 2. Nuance fondamentale — Particulier vs Entreprise

Le code est structuré autour de deux contextes de contribuable :

```
src/services/impots/
├── single/          ← PARTICULIER
│   ├── reel/        (IRF, ITS, TVA, AIB, IBA, PATENTE, IRCM, VPS, IS)
│   ├── tps/         (TPS)
│   └── other/       (CDL, PVO, TBF, TEE, TFU, TP, TPP, TPSP, TPUB, TSJ, TVM, TVT)
│
└── general/         ← ENTREPRISE
    ├── reel/        (IS, IRF, ITS, IBA, AIB, PATENTE, TFU, TVA, TVM)
    └── tps/         (TPS)
```

### Pourquoi cette distinction est critique pour la modélisation

Certains impôts existent dans les **deux contextes mais avec des paramètres différents**.

L'exemple le plus frappant est la **TFU** :

| | TFU Particulier (`single/other/TFU.ts`) | TFU Entreprise (`general/reel/TFU.general.entreprise.ts`) |
|---|---|---|
| Calcul | Tarif au m² par catégorie de bâtiment | Taux appliqué à la valeur locative par ville |
| Paramètre clé | `tfu_par_m2`, `tfu_minimum` par catégorie | `tauxTfu` par ville |
| Shape `parametres` | Tableau de catégories avec tarifs | Taux fixe appliqué par propriété |

→ **Même `code_impot = "TFU"`, mais deux documents avec des shapes totalement différentes.**

D'autres impôts n'existent que dans **un seul contexte** :

| Impôt | Particulier | Entreprise |
|-------|:-----------:|:----------:|
| CDL, PVO, TBF, TEE, TP, TPP, TPUB, TSJ, TVT | ✅ | ❌ |
| IRCM, VPS | ✅ | ❌ |
| IS | ✅ (EI) | ✅ (Sociétés) |
| IRF, ITS, TVA, AIB, IBA, PATENTE, TFU, TPS | ✅ | ✅ |

---

## 3. Solution retenue — Triplet `(code_impot, type_contribuable, annee)`

> **Un document MongoDB par triplet `(code_impot, type_contribuable, annee)`**
> avec un sous-document `parametres` dont la forme varie librement.

### Principe fondamental

```
collection: parametres_fiscaux
─────────────────────────────────────────────────────────────────────────────
│  code_impot  │  type_contribuable  │  annee  │  parametres (forme libre) │
─────────────────────────────────────────────────────────────────────────────
│  "TFU"       │  "PARTICULIER"      │  2025   │  { categories: [...] }    │
│  "TFU"       │  "ENTREPRISE"       │  2025   │  { taux_par_ville: [...] }│  ← shape différente !
│  "IRF"       │  "PARTICULIER"      │  2025   │  { taux_normal, rsrtb }   │
│  "IRF"       │  "ENTREPRISE"       │  2025   │  { taux_normal, rsrtb }   │  ← même shape ici
│  "IS"        │  "ENTREPRISE"       │  2025   │  { taux, minimum, cci }   │
│  "CDL"       │  "PARTICULIER"      │  2025   │  { taux, base_fixe }      │  ← particulier seulement
│  "TFU"       │  "PARTICULIER"      │  2026   │  { categories: [...] }    │  ← nouvel exercice
└──────────────┴─────────────────────┴─────────┴───────────────────────────┘
```

---

## 4. Structure détaillée des documents

### 4.1 IRF — Impôt sur les Revenus Fonciers (même params, deux contextes)

```json
// PARTICULIER
{
  "_id": "ObjectId(...)",
  "code_impot": "IRF",
  "type_contribuable": "PARTICULIER",
  "annee": 2025,
  "actif": true,
  "parametres": {
    "taux_normal": 0.12,
    "taux_reduit": 0.10,
    "rsrtb": 4000,
    "jour_echeance": 10
  },
  "meta": {
    "label": "IRF — Particulier",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "updatedBy": "admin"
  }
}

// ENTREPRISE — même shape, document séparé pour indépendance
{
  "_id": "ObjectId(...)",
  "code_impot": "IRF",
  "type_contribuable": "ENTREPRISE",
  "annee": 2025,
  "actif": true,
  "parametres": {
    "taux_normal": 0.12,
    "taux_reduit": 0.10,
    "rsrtb": 4000,
    "jour_echeance": 10
  },
  "meta": {
    "label": "IRF — Entreprise",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "updatedBy": "admin"
  }
}
```

> Même si les valeurs sont identiques aujourd'hui, les séparer garantit qu'une modification
> future pour les entreprises n'impacte pas les particuliers.

### 4.2 TFU — Taxe Foncière Urbaine (shapes différentes)

```json
// PARTICULIER — tarif au m² par catégorie de bâtiment
{
  "_id": "ObjectId(...)",
  "code_impot": "TFU",
  "type_contribuable": "PARTICULIER",
  "annee": 2025,
  "actif": true,
  "parametres": {
    "categories": [
      { "slug": "villa-standing", "description": "Villa haut standing", "tfu_par_m2": 1200, "tfu_minimum": 15000 },
      { "slug": "maison-moderne", "description": "Maison moderne",      "tfu_par_m2": 800,  "tfu_minimum": 10000 },
      { "slug": "maison-simple",  "description": "Maison simple",       "tfu_par_m2": 400,  "tfu_minimum": 5000  },
      { "slug": "terrain-nu",     "description": "Terrain nu",          "tfu_par_m2": 150,  "tfu_minimum": 2000  }
    ],
    "taux_piscine": 50000
  },
  "meta": {
    "label": "TFU — Particulier",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "updatedBy": "admin"
  }
}

// ENTREPRISE — taux appliqué à la valeur locative par ville
{
  "_id": "ObjectId(...)",
  "code_impot": "TFU",
  "type_contribuable": "ENTREPRISE",
  "annee": 2025,
  "actif": true,
  "parametres": {
    "taux_standard": 0.08,
    "taux_par_ville": [
      { "ville": "Cotonou",        "taux": 0.10 },
      { "ville": "Porto-Novo",     "taux": 0.08 },
      { "ville": "Parakou",        "taux": 0.06 },
      { "ville": "Abomey-Calavi",  "taux": 0.07 }
    ]
  },
  "meta": {
    "label": "TFU — Entreprise",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "updatedBy": "admin"
  }
}
```

### 4.3 ITS — Impôt sur les Traitements et Salaires

```json
{
  "_id": "ObjectId(...)",
  "code_impot": "ITS",
  "type_contribuable": "PARTICULIER",
  "annee": 2025,
  "actif": true,
  "parametres": {
    "srtb_mars": 1000,
    "srtb_juin": 3000,
    "seuil_exoneration_srtb_juin": 60000,
    "tranches": [
      { "numero": 1, "borne_inf": 0,      "borne_sup": 60000,  "taux": 0.00, "libelle": "Tranche 1 (0%)"  },
      { "numero": 2, "borne_inf": 60000,  "borne_sup": 150000, "taux": 0.10, "libelle": "Tranche 2 (10%)" },
      { "numero": 3, "borne_inf": 150000, "borne_sup": 250000, "taux": 0.15, "libelle": "Tranche 3 (15%)" },
      { "numero": 4, "borne_inf": 250000, "borne_sup": 500000, "taux": 0.19, "libelle": "Tranche 4 (19%)" },
      { "numero": 5, "borne_inf": 500000, "borne_sup": null,   "taux": 0.30, "libelle": "Tranche 5 (30%)" }
    ]
  },
  "meta": {
    "label": "ITS — Particulier / Salarié",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "updatedBy": "admin"
  }
}
```

### 4.4 IS — Impôt sur les Sociétés (entreprise uniquement)

```json
{
  "_id": "ObjectId(...)",
  "code_impot": "IS",
  "type_contribuable": "ENTREPRISE",
  "annee": 2025,
  "actif": true,
  "parametres": {
    "redevance_srtb": 4000,
    "impot_minimum_absolu": 250000,
    "taux_station_par_litre": 0.6,
    "cci_tranches": [
      { "ca_max": 5000000,    "montant": 20000  },
      { "ca_max": 10000000,   "montant": 30000  },
      { "ca_max": 25000000,   "montant": 50000  },
      { "ca_max": 50000000,   "montant": 150000 },
      { "ca_max": 100000000,  "montant": 250000 },
      { "ca_max": 300000000,  "montant": 300000 },
      { "ca_max": 500000000,  "montant": 400000 },
      { "ca_max": null,       "montant": 800000 }
    ]
  },
  "meta": {
    "label": "IS — Impôt sur les Sociétés",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "updatedBy": "admin"
  }
}
```

### 4.5 TPS — Taxe Professionnelle Synthétique

```json
{
  "_id": "ObjectId(...)",
  "code_impot": "TPS",
  "type_contribuable": "ENTREPRISE",
  "annee": 2025,
  "actif": true,
  "parametres": {
    "taux_tps": 0.05,
    "montant_minimum": 10000,
    "redevance_rtb": 4000,
    "seuil_regime_reel": 50000000,
    "seuil_paiement_bancaire": 100000,
    "amende_especes_taux": 0.05,
    "amende_comptabilite": 1000000
  },
  "meta": {
    "label": "TPS — Entreprise",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "updatedBy": "admin"
  }
}
```

---

## 5. Index et contraintes MongoDB

```javascript
// Index unique — une seule version par (impôt, type contribuable, année)
db.parametres_fiscaux.createIndex(
  { code_impot: 1, type_contribuable: 1, annee: 1 },
  { unique: true, name: "idx_impot_contribuable_annee_unique" }
);

// Index pour récupérer tous les paramètres actifs d'une année
db.parametres_fiscaux.createIndex(
  { annee: 1, actif: 1 },
  { name: "idx_annee_actif" }
);

// Index pour récupérer tous les impôts d'un type de contribuable
db.parametres_fiscaux.createIndex(
  { type_contribuable: 1, annee: 1, actif: 1 },
  { name: "idx_contribuable_annee" }
);
```

---

## 6. Typage TypeScript

### 6.1 Enum du type de contribuable

```typescript
// src/types/parametres-fiscaux.type.ts

export enum TypeContribuable {
  PARTICULIER = 'PARTICULIER',
  ENTREPRISE  = 'ENTREPRISE',
}
```

### 6.2 Type générique racine

```typescript
export interface ParametresFiscaux<T> {
  _id?: string;
  code_impot: string;
  type_contribuable: TypeContribuable;
  annee: number;
  actif: boolean;
  parametres: T;
  meta: {
    label: string;
    updatedAt: Date;
    updatedBy: string;
  };
}
```

### 6.3 Interfaces par impôt et contexte

```typescript
// IRF — même shape pour les deux contextes
export interface ParametresIRF {
  taux_normal: number;
  taux_reduit: number;
  rsrtb: number;
  jour_echeance: number;
}

// TFU — shapes divergentes selon le contexte
export interface CategorieTFU {
  slug: string;
  description: string;
  tfu_par_m2: number;
  tfu_minimum: number;
}

export interface ParametresTFUParticulier {
  categories: CategorieTFU[];
  taux_piscine: number;
}

export interface TauxVilleTFU {
  ville: string;
  taux: number;
}

export interface ParametresTFUEntreprise {
  taux_standard: number;
  taux_par_ville: TauxVilleTFU[];
}

// ITS
export interface TrancheITS {
  numero: number;
  borne_inf: number;
  borne_sup: number | null;
  taux: number;
  libelle: string;
}

export interface ParametresITS {
  srtb_mars: number;
  srtb_juin: number;
  seuil_exoneration_srtb_juin: number;
  tranches: TrancheITS[];
}

// IS — entreprise uniquement
export interface CciTranche {
  ca_max: number | null;
  montant: number;
}

export interface ParametresIS {
  redevance_srtb: number;
  impot_minimum_absolu: number;
  taux_station_par_litre: number;
  cci_tranches: CciTranche[];
}

// TPS
export interface ParametresTPS {
  taux_tps: number;
  montant_minimum: number;
  redevance_rtb: number;
  seuil_regime_reel: number;
  seuil_paiement_bancaire: number;
  amende_especes_taux: number;
  amende_comptabilite: number;
}

// Alias finaux
export type DocumentIRFParticulier  = ParametresFiscaux<ParametresIRF>;
export type DocumentIRFEntreprise   = ParametresFiscaux<ParametresIRF>;
export type DocumentTFUParticulier  = ParametresFiscaux<ParametresTFUParticulier>;
export type DocumentTFUEntreprise   = ParametresFiscaux<ParametresTFUEntreprise>;
export type DocumentITS             = ParametresFiscaux<ParametresITS>;
export type DocumentIS              = ParametresFiscaux<ParametresIS>;
export type DocumentTPS             = ParametresFiscaux<ParametresTPS>;
```

---

## 7. Repository — couche d'accès aux données

```typescript
// src/repositories/parametres-fiscaux.repo.ts

import { DatabaseManager } from '../config/databases/DatabaseManager';
import { TypeContribuable } from '../types/parametres-fiscaux.type';

export class ParametresFiscauxRepo {

  private static get collection() {
    return DatabaseManager.getDb().collection('parametres_fiscaux');
  }

  /**
   * Récupère les paramètres d'un impôt pour un type de contribuable et une année.
   */
  static async get<T>(
    codeImpot: string,
    typeContribuable: TypeContribuable,
    annee: number
  ): Promise<T> {
    const doc = await this.collection.findOne(
      { code_impot: codeImpot, type_contribuable: typeContribuable, annee, actif: true }
    );
    if (!doc) {
      throw new Error(
        `Paramètres introuvables : code="${codeImpot}", contribuable="${typeContribuable}", année=${annee}`
      );
    }
    return doc.parametres as T;
  }

  /**
   * Récupère tous les impôts d'un type de contribuable pour une année.
   */
  static async getByContribuableEtAnnee(
    typeContribuable: TypeContribuable,
    annee: number
  ): Promise<unknown[]> {
    return this.collection
      .find({ type_contribuable: typeContribuable, annee, actif: true })
      .toArray();
  }

  /**
   * Upsert idempotent — utilisé lors de la mise à jour annuelle.
   */
  static async upsert<T>(
    codeImpot: string,
    typeContribuable: TypeContribuable,
    annee: number,
    parametres: T,
    updatedBy: string
  ): Promise<void> {
    await this.collection.updateOne(
      { code_impot: codeImpot, type_contribuable: typeContribuable, annee },
      {
        $set: {
          parametres,
          actif: true,
          'meta.updatedAt': new Date(),
          'meta.updatedBy': updatedBy,
        },
        $setOnInsert: {
          code_impot: codeImpot,
          type_contribuable: typeContribuable,
          annee,
        }
      },
      { upsert: true }
    );
  }
}
```

---

## 8. Intégration dans les services

### Avant

```typescript
// src/services/impots/general/reel/TFU.general.entreprise.ts — AVANT
// Les taux par ville sont hardcodés ou lus depuis un fichier JSON local
const tauxVille = ProprieteInformation.tauxTfu; // passé par le client
```

### Après

```typescript
// src/services/impots/general/reel/TFU.general.entreprise.ts — APRÈS
import { ParametresFiscauxRepo } from '../../../../repositories/parametres-fiscaux.repo';
import { ParametresTFUEntreprise, TypeContribuable } from '../../../../types/parametres-fiscaux.type';

export class MoteurTFUEntreprise {

  private params: ParametresTFUEntreprise;

  constructor(params: ParametresTFUEntreprise) {
    this.params = params;
  }

  public calculerTFUPropriete(valeurLocative: number, ville: string): number {
    const tauxVille = this.params.taux_par_ville.find(t => t.ville === ville);
    const taux = tauxVille?.taux ?? this.params.taux_standard;
    return Math.round(valeurLocative * taux);
  }

  static async pourAnnee(annee: number): Promise<MoteurTFUEntreprise> {
    const params = await ParametresFiscauxRepo.get<ParametresTFUEntreprise>(
      'TFU',
      TypeContribuable.ENTREPRISE,
      annee
    );
    return new MoteurTFUEntreprise(params);
  }
}

// Utilisation dans le controller
const moteur = await MoteurTFUEntreprise.pourAnnee(2025);
const tfu = moteur.calculerTFUPropriete(5_000_000, 'Cotonou'); // → 500 000 FCFA
```

---

## 9. Flux de mise à jour annuelle

```
Début d'exercice fiscal (ex: 1er janvier 2026)
              │
              ▼
   Admin — saisit les nouveaux paramètres publiés par le fisc
              │
       ┌──────┴──────┐
       ▼             ▼
  PARTICULIER    ENTREPRISE
       │             │
  upsert(          upsert(
   "TFU",           "TFU",
   PARTICULIER,     ENTREPRISE,
   2026,            2026,
   { categories }   { taux_par_ville }
  )                )
       │             │
       └──────┬──────┘
              ▼
   MongoDB — 2 documents upsertés indépendamment
              │
              ▼
   Les services chargent les bons paramètres
   selon leur contexte (particulier ou entreprise)
```

---

## 10. Tableau de synthèse

| Impôt | Particulier | Entreprise | Params partagés ? |
|-------|:-----------:|:----------:|:-----------------:|
| IRF   | ✅ | ✅ | ✅ (même shape, docs séparés) |
| ITS   | ✅ | ✅ | ✅ |
| TVA   | ✅ | ✅ | ✅ |
| AIB   | ✅ | ✅ | À vérifier |
| TFU   | ✅ | ✅ | ❌ **(shapes différentes)** |
| TPS   | ✅ | ✅ | À vérifier |
| IS    | ✅ (EI) | ✅ (SI) | Partiellement |
| PATENTE | ✅ | ✅ | À vérifier |
| IBA   | ✅ | ✅ | À vérifier |
| IRCM, VPS | ✅ | ❌ | — |
| CDL, PVO, TBF, TEE | ✅ | ❌ | — |
| TP, TPP, TPSP, TPUB, TSJ, TVT | ✅ | ❌ | — |

---

## 11. Ce qui reste dans le code TypeScript

> La distinction clé : **les constantes** vont en base, **les algorithmes** restent dans les services.

```
MongoDB (données)                     TypeScript (logique)
──────────────────────────────        ──────────────────────────────────────
taux TFU par m² (particulier) →       calcul = surface × tfu_par_m2
taux TFU par ville (entreprise) →     calcul = valeurLocative × taux_ville
tranches ITS                  →       calcul progressif par tranche
seuil_exoneration TVA         →       if (ca < seuil) → exonéré
cci_tranches IS               →       lookup CCI selon CA
```

Les services restent des **méthodes pures** qui reçoivent les paramètres en entrée.
MongoDB fournit les valeurs. TypeScript applique les formules.