# API — Paramètres Fiscaux

Ce document décrit comment consulter, créer et mettre à jour les paramètres fiscaux stockés en base de données,
et détaille l'ensemble des champs persistés pour chaque impôt.

---

## Architecture de stockage

Chaque impôt est stocké dans MongoDB sous forme d'un document identifié par le triplet unique :

```
(code_impot, type_contribuable, annee)
```

La collection s'appelle `parametres_fiscaux` (configurable via `MONGO_FISCAL_PARAMETERS_COLLECTION`).

Structure commune à tous les documents :

```json
{
  "code_impot":        "TPS",
  "type_contribuable": "ENTREPRISE",
  "annee":             2025,
  "actif":             true,
  "parametres":        { ... },
  "meta": {
    "label":     "TPS - Entreprise",
    "updatedAt": "2025-01-01T00:00:00.000Z",
    "updatedBy": "system-seed"
  }
}
```

| Champ              | Type    | Description                                        |
|--------------------|---------|----------------------------------------------------|
| `code_impot`       | string  | Identifiant de l'impôt (`TPS`, `ITS`, `IRF`, etc.) |
| `type_contribuable`| string  | `ENTREPRISE` ou `PARTICULIER`                      |
| `annee`            | number  | Année fiscale (ex. `2025`, `2026`)                 |
| `actif`            | boolean | `false` = document ignoré par le système           |
| `parametres`       | object  | Corps des paramètres — voir détail par impôt       |
| `meta`             | object  | Métadonnées d'audit                                |

---

## Routes disponibles

### 1. Lister les années disponibles

```
GET /api/fiscal/annees-disponibles
```

Ne requiert pas d'authentification. Accessible librement par le Frontend.

**Ce que fait cette route :**
Interroge directement MongoDB et retourne la liste de toutes les années pour lesquelles
au moins un document fiscal existe avec `actif: true`. Les années sont triées par ordre croissant.

Cette route est le point d'entrée recommandé pour le Frontend : elle permet de savoir quelles
années proposer dans un sélecteur avant d'appeler `POST /api/fiscal/impots` ou les routes d'estimation.

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "annees": [2025, 2026],
    "total": 2
  }
}
```

| Champ         | Type     | Description                                            |
|---------------|----------|--------------------------------------------------------|
| `annees`      | number[] | Liste des années disponibles, triées croissant         |
| `total`       | number   | Nombre d'années disponibles                            |

**Comportement :**
- Une année apparaît dans la liste dès qu'**au moins un** document `actif: true` existe pour cette année,
  peu importe le `code_impot` ou le `type_contribuable`.
- Si aucun document actif n'existe en base, `annees` est un tableau vide `[]` et `total` vaut `0`.
- Ajouter une nouvelle année via `POST /api/fiscal/impots/create` la fait apparaître immédiatement
  dans cette liste au prochain appel.

**Exemple d'utilisation Frontend :**
```bash
curl http://localhost:5400/api/fiscal/annees-disponibles
```

---

### 2. Consulter tous les impôts d'une année

```
POST /api/fiscal/impots
Content-Type: application/json
```

Ne requiert pas d'authentification.

**Corps de la requête :**
```json
{
  "annee": 2025,
  "typeContribuable": "ENTREPRISE"
}
```

| Champ             | Type   | Valeurs acceptées              |
|-------------------|--------|-------------------------------|
| `annee`           | number | Entier (ex. `2025`, `2026`)   |
| `typeContribuable`| string | `"ENTREPRISE"` ou `"PARTICULIER"` |

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "annee": 2025,
    "typeContribuable": "ENTREPRISE",
    "total": 9,
    "impots": [
      {
        "code_impot": "AIB",
        "type_contribuable": "ENTREPRISE",
        "annee": 2025,
        "actif": true,
        "parametres": { ... },
        "meta": { ... }
      }
    ]
  }
}
```

Les documents sont triés par `code_impot` (ordre alphabétique).
Seuls les documents `actif: true` sont retournés.

---

### 3. Créer les paramètres d'un impôt pour une nouvelle année

```
POST /api/fiscal/impots/create
Authorization: Bearer <token>
Content-Type: application/json
```

**Requiert une authentification JWT.** Voir section [Authentification](#authentification) ci-dessous.

Utilisée pour ajouter les paramètres d'un impôt sur une année qui n'existe pas encore en base.
Si le triplet `(codeImpot, typeContribuable, annee)` existe déjà, la route retourne **409** — utiliser
`PUT` à la place pour modifier un document existant.

**Corps de la requête :**
```json
{
  "codeImpot": "TPS",
  "annee": 2027,
  "typeContribuable": "ENTREPRISE",
  "label": "TPS - Entreprise 2027",
  "parametres": {
    "taux_tps": 0.05,
    "montant_minimum": 10000,
    ...
  }
}
```

| Champ             | Type   | Requis | Description                                                          |
|-------------------|--------|--------|----------------------------------------------------------------------|
| `codeImpot`       | string | Oui    | Code de l'impôt (`TPS`, `ITS`, `IRF`, etc.)                         |
| `annee`           | number | Oui    | Année fiscale (entier)                                               |
| `typeContribuable`| string | Oui    | `"ENTREPRISE"` ou `"PARTICULIER"`                                    |
| `parametres`      | object | Oui    | Objet JSON complet des paramètres (voir détail par impôt)            |
| `label`           | string | Non    | Libellé du document dans `meta`. Généré automatiquement si absent (`TPS - ENTREPRISE 2027`) |

**Réponse 201 :**
```json
{
  "success": true,
  "message": "Paramètres TPS (ENTREPRISE) 2027 créés.",
  "data": {
    "codeImpot": "TPS",
    "typeContribuable": "ENTREPRISE",
    "annee": 2027
  }
}
```

**Réponse 409 :** Le triplet existe déjà — utiliser `PUT /api/fiscal/impots/:codeImpot` pour modifier.

**Réponse 401 :** Token absent ou invalide.

> Le document est créé avec `actif: true` d'emblée.
> `meta.updatedAt` est positionné à la date de création, `meta.updatedBy` à `"admin"`.

---

### 4. Mettre à jour les paramètres d'un impôt

```
PUT /api/fiscal/impots/:codeImpot
Authorization: Bearer <token>
Content-Type: application/json
```

**Requiert une authentification JWT.** Voir section [Authentification](#authentification) ci-dessous.

**Paramètre URL :** `codeImpot` — code de l'impôt en majuscules (ex. `TPS`, `ITS`).

**Corps de la requête :**
```json
{
  "annee": 2025,
  "typeContribuable": "ENTREPRISE",
  "parametres": {
    "taux_tps": 0.05,
    "montant_minimum": 10000,
    ...
  }
}
```

| Champ             | Type   | Valeurs acceptées                    |
|-------------------|--------|--------------------------------------|
| `annee`           | number | Entier                               |
| `typeContribuable`| string | `"ENTREPRISE"` ou `"PARTICULIER"`    |
| `parametres`      | object | Objet JSON complet (voir par impôt)  |

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Paramètres de TPS (ENTREPRISE) 2025 mis à jour.",
  "data": {
    "codeImpot": "TPS",
    "typeContribuable": "ENTREPRISE",
    "annee": 2025
  }
}
```

**Réponse 404 :** Le triplet `(codeImpot, typeContribuable, annee)` n'existe pas en base.

**Réponse 401 :** Token absent ou invalide.

> La mise à jour remplace uniquement le champ `parametres`. Le document existant
> (code_impot, type_contribuable, annee, actif, meta) est conservé ;
> seuls `meta.updatedAt` et `meta.updatedBy` sont mis à jour automatiquement.

---

## Authentification

Pour les routes protégées, obtenir un token via :

```
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "username": "fiscpredict@impot.bj",
  "password": "fiscpredict@2026"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-fiscpredict-001",
    "username": "fiscpredict@impot.bj"
  }
}
```

Utiliser le token dans le header : `Authorization: Bearer <token>`

---

## Détail des paramètres par impôt

---

### TPS — Taxe Professionnelle Synthétique

Codes : `TPS` · Types : `ENTREPRISE`, `PARTICULIER`

```json
{
  "taux_tps": 0.05,
  "montant_minimum": 10000,
  "redevance_rtb": 4000,
  "seuil_regime_reel": 50000000,
  "cci_rates": [
    { "maxRevenue": 5000000, "amount": 20000 },
    { "maxRevenue": null,    "amount": 2000000 }
  ],
  "title": "Taxe Professionnelle Synthétique",
  "label": "TPS",
  "description": "...",
  "competent_center": "...",
  "echeances": {
    "solde":      "30 avril N+1",
    "acompte_1":  "10 février",
    "acompte_2":  "10 juin"
  },
  "textes": {
    "solde_title":                      "TPS - Solde à payer",
    "solde_echeance_description":       "...",
    "solde_description_premiere_annee": "...",
    "solde_description_standard":       "...",
    "acomptes_title":                   "TPS - Acomptes provisionnels",
    "acompte_1_description":            "...",
    "acompte_2_description":            "...",
    "acomptes_description":             "...",
    "info_acomptes_title":              "Acomptes et Solde",
    "info_acomptes_premiere_annee":     ["...", "..."],
    "info_acomptes_standard":           ["...", "..."],
    "variable_ca_label":                "Chiffre d'affaires annuel",
    "variable_ca_description":          "...",
    "variable_type_label":              "Type d'entreprise",
    "variable_type_description":        "...",
    "variable_type_individuelle":       "Entreprise Individuelle",
    "variable_type_societe":            "Société"
  }
}
```

| Champ               | Type   | Description                                                   |
|---------------------|--------|---------------------------------------------------------------|
| `taux_tps`          | number | Taux TPS (ex. `0.05` = 5%)                                    |
| `montant_minimum`   | number | Montant minimum en FCFA                                       |
| `redevance_rtb`     | number | Redevance SRTB fixe en FCFA                                   |
| `seuil_regime_reel` | number | Seuil CA au-delà duquel le régime réel s'impose               |
| `cci_rates`         | array  | Barème CCI — tableau `{ maxRevenue, amount }` trié croissant (`null` = dernier seuil) |
| `echeances`         | object | Dates d'échéance affichées dans les obligations               |
| `textes`            | object | Tous les libellés statiques affichés dans les résultats       |

---

### ITS — Impôt sur les Traitements et Salaires

Codes : `ITS` · Types : `ENTREPRISE`, `PARTICULIER`

```json
{
  "seuil_exoneration": 60000,
  "redevance_srtb_mars": 1000,
  "redevance_srtb_juin": 3000,
  "redevance_srtb_cumulee": 4000,
  "bareme": [
    { "borneInf": 0,      "borneSup": 60000,  "taux": 0,    "montantFixe": 0 },
    { "borneInf": 60000,  "borneSup": 150000, "taux": 0.10, "montantFixe": 0 },
    { "borneInf": 150000, "borneSup": 250000, "taux": 0.15, "montantFixe": 9000 },
    { "borneInf": 250000, "borneSup": 500000, "taux": 0.19, "montantFixe": 24000 },
    { "borneInf": 500000, "borneSup": null,   "taux": 0.30, "montantFixe": 71500 }
  ],
  "title": "...",
  "label": "ITS",
  "description": "...",
  "competent_center": "..."
}
```

| Champ                    | Type   | Description                                              |
|--------------------------|--------|----------------------------------------------------------|
| `seuil_exoneration`      | number | Salaire mensuel en-dessous duquel l'ITS est nul          |
| `redevance_srtb_mars`    | number | Redevance SRTB prélevée en mars (FCFA)                   |
| `redevance_srtb_juin`    | number | Redevance SRTB prélevée en juin (FCFA)                   |
| `redevance_srtb_cumulee` | number | Total annuel SRTB (somme des deux)                       |
| `bareme`                 | array  | Tranches progressives — `borneInf`, `borneSup` (null = illimité), `taux`, `montantFixe` |

---

### IRF — Impôt sur les Revenus Fonciers

Codes : `IRF` · Types : `ENTREPRISE`, `PARTICULIER`

```json
{
  "redevance_srtb": 4000,
  "taux_standard": 0.12,
  "taux_reduit": 0.10,
  "title": "...",
  "label": "IRF",
  "description": "...",
  "competent_center": "..."
}
```

| Champ            | Type   | Description                                         |
|------------------|--------|-----------------------------------------------------|
| `redevance_srtb` | number | Redevance SRTB annuelle fixe (FCFA)                 |
| `taux_standard`  | number | Taux IRF standard (ex. `0.12` = 12%)                |
| `taux_reduit`    | number | Taux réduit applicable selon conditions (ex. `0.10` = 10%) |

---

### AIB — Acompte sur l'Impôt sur les Bénéfices

Codes : `AIB` · Types : `ENTREPRISE`, `PARTICULIER`

```json
{
  "redevance_srtb": 4000,
  "title": "...",
  "label": "AIB",
  "description": "...",
  "competent_center": "..."
}
```

| Champ            | Type   | Description                         |
|------------------|--------|-------------------------------------|
| `redevance_srtb` | number | Redevance SRTB mensuelle fixe (FCFA)|

---

### IBA — Impôt sur le Bénéfice d'Affaire

Codes : `IBA` · Types : `ENTREPRISE`, `PARTICULIER`

```json
{
  "taux_general": 0.30,
  "minimum_general_pourcent": 0.015,
  "minimum_absolu_general": 500000,
  "redevance_srtb": 4000,
  "facteur_reduction_artisanale": 0.5,
  "regles_secteur": {
    "enseignement-prive":             { "taux": 0.25, "min": 500000 },
    "industrie":                      { "taux": 0.25, "min": 500000 },
    "batiment-travaux-publics":       { "taux": 0.30, "minPourcent": 0.03 },
    "immobilier":                     { "taux": 0.30, "minPourcent": 0.10 },
    "stations-services":              { "tauxParLitre": 0.60, "min": 250000 },
    "artisanat":                      { "taux": 0.30, "reductionArtisanale": 0.5 },
    "agriculture":                    { "taux": 0.30, "min": 500000 },
    "peche":                          { "taux": 0.30, "min": 500000 },
    "elevage":                        { "taux": 0.30, "min": 500000 },
    "chercheur-variete-vegetale":     { "taux": 0.30, "min": 500000 },
    "profession-liberale":            { "taux": 0.30, "min": 500000 },
    "charges-offices":                { "taux": 0.30, "min": 500000 },
    "propriete-intellectuelle":       { "taux": 0.30, "min": 500000 },
    "location-etablissement-commercial": { "taux": 0.30, "min": 500000 },
    "intermediaire-immobilier":       { "taux": 0.30, "min": 500000 },
    "achat-revente-immobilier":       { "taux": 0.30, "min": 500000 },
    "lotissement-terrain":            { "taux": 0.30, "min": 500000 },
    "autre":                          { "taux": 0.30, "min": 500000 }
  },
  "title": "...",
  "label": "IBA",
  "description": "...",
  "competent_center": "..."
}
```

| Champ                         | Type   | Description                                                           |
|-------------------------------|--------|-----------------------------------------------------------------------|
| `taux_general`                | number | Taux IBA par défaut (ex. `0.30` = 30%)                               |
| `minimum_general_pourcent`    | number | Minimum en % du CA (ex. `0.015` = 1,5%)                              |
| `minimum_absolu_general`      | number | Minimum absolu en FCFA                                               |
| `redevance_srtb`              | number | Redevance SRTB annuelle fixe (FCFA)                                  |
| `facteur_reduction_artisanale`| number | Facteur de réduction pour artisans (ex. `0.5` = 50%)                 |
| `regles_secteur`              | object | Clé = slug du secteur, valeur = règles spécifiques                   |
| — `taux`                      | number | Taux applicable au secteur                                           |
| — `min`                       | number | Minimum absolu en FCFA pour ce secteur                              |
| — `minPourcent`               | number | Minimum en % du CA (remplace `min` pour certains secteurs)           |
| — `tauxParLitre`              | number | Taxe par litre (stations-services uniquement)                        |
| — `reductionArtisanale`       | number | Facteur de réduction artisanale du secteur                           |

---

### IS — Impôt sur les Sociétés

Codes : `IS` · Types : `ENTREPRISE` uniquement

```json
{
  "redevance_srtb": 4000,
  "impot_minimum_absolu_entreprise": 250000,
  "taux_taxe_station_par_litre": 0.6,
  "cci_rates": [
    { "maxRevenue": 5000000, "amount": 20000 },
    { "maxRevenue": null,    "amount": 2000000 }
  ],
  "taux_principal_par_secteur": {
    "education":    0.25,
    "industry":     0.25,
    "real-estate":  0.30,
    "construction": 0.30,
    "gas-station":  0.30,
    "general":      0.30
  },
  "taux_minimum_par_secteur": {
    "education":    0.01,
    "industry":     0.01,
    "real-estate":  0.10,
    "construction": 0.03,
    "gas-station":  0.01,
    "general":      0.01
  },
  "title": "...",
  "label": "IS",
  "description": "...",
  "competent_center": "..."
}
```

| Champ                               | Type   | Description                                          |
|-------------------------------------|--------|------------------------------------------------------|
| `redevance_srtb`                    | number | Redevance SRTB annuelle fixe (FCFA)                  |
| `impot_minimum_absolu_entreprise`   | number | Minimum IS absolu pour toute entreprise (FCFA)       |
| `taux_taxe_station_par_litre`       | number | Taxe par litre pour stations-services                |
| `cci_rates`                         | array  | Barème CCI (même structure que TPS)                  |
| `taux_principal_par_secteur`        | object | Taux IS principal par secteur d'activité             |
| `taux_minimum_par_secteur`          | object | Taux minimum IS par secteur (en % du CA)             |

---

### PATENTE — Patente Multi-Établissements

Codes : `PATENTE` · Types : `ENTREPRISE`, `PARTICULIER`

```json
{
  "fixed_rate_zone1": 70000,
  "fixed_rate_zone2": 60000,
  "add_per_billion_ca": 10000,
  "proportional_rates": {
    "cotonou":      17,
    "porto-novo":   17,
    "parakou":      25,
    "littoral":     13.5
  },
  "first_zone_locations": ["cotonou", "porto-novo", "ouidah", "abomey", "..."],
  "import_export_fixed_rates": [
    { "maxAmount": 80000000,    "amount": 150000 },
    { "maxAmount": 200000000,   "amount": 337500 },
    { "maxAmount": null,        "amount": 1125000 }
  ],
  "import_export_over_max_increment_per_billion": 10000,
  "title": "...",
  "label": "Patente",
  "description": "...",
  "competent_center": "..."
}
```

| Champ                                       | Type   | Description                                               |
|---------------------------------------------|--------|-----------------------------------------------------------|
| `fixed_rate_zone1`                          | number | Droit fixe zone 1 (FCFA)                                  |
| `fixed_rate_zone2`                          | number | Droit fixe zone 2 (FCFA)                                  |
| `add_per_billion_ca`                        | number | Supplément par milliard de CA (FCFA)                      |
| `proportional_rates`                        | object | Taux proportionnel par commune/département (en millièmes) |
| `first_zone_locations`                      | array  | Liste des slugs classés en zone 1                         |
| `import_export_fixed_rates`                 | array  | Barème import/export `{ maxAmount, amount }` (`null` = dernier seuil) |
| `import_export_over_max_increment_per_billion` | number | Supplément par milliard au-delà du dernier seuil         |

---

### TFU Entreprise — Taxe Foncière Urbaine

Codes : `TFU` · Type : `ENTREPRISE`

```json
{
  "taux_standard": 0.08,
  "taux_par_ville": [
    { "ville": "Cotonou",       "taux": 0.10 },
    { "ville": "Porto-Novo",    "taux": 0.08 },
    { "ville": "Parakou",       "taux": 0.06 },
    { "ville": "Abomey-Calavi", "taux": 0.07 }
  ],
  "title": "...",
  "label": "TFU Entreprise",
  "description": "...",
  "competent_center": "..."
}
```

| Champ            | Type   | Description                                             |
|------------------|--------|---------------------------------------------------------|
| `taux_standard`  | number | Taux TFU par défaut si la ville n'est pas dans la liste |
| `taux_par_ville` | array  | Liste `{ ville, taux }` des taux communaux spécifiques  |

---

### TFU Particulier — Taxe Foncière Urbaine

Codes : `TFU` · Type : `PARTICULIER`

Structure hiérarchique : **département → commune → arrondissement → catégories de bâtiment**.

```json
{
  "montant_piscine": 30000,
  "departements": [
    {
      "nom": "LITTORAL",
      "slug": "littoral",
      "communes": [
        {
          "nom": "COTONOU",
          "slug": "cotonou",
          "arrondissements": [
            {
              "nom": "Arrondissement 1",
              "slug": "arrondissement_1",
              "tarifs": {
                "Categorie_01": {
                  "description": "Bâtiments à toiture tôle et assimilés",
                  "slug_description": "batiments_a_toiture_tole_et_assimiles",
                  "tfu_par_m2": 311.22,
                  "tfu_minimum": 31122
                },
                "Categorie_02": {
                  "description": "Rez-de-chaussée",
                  "slug_description": "rez_de_chaussee",
                  "tfu_par_m2": 523.38,
                  "tfu_minimum": 52338
                }
              }
            }
          ]
        }
      ]
    }
  ],
  "title": "...",
  "label": "TFU — Particulier",
  "description": "...",
  "competent_center": "..."
}
```

| Champ                    | Type   | Description                                        |
|--------------------------|--------|----------------------------------------------------|
| `montant_piscine`        | number | Supplément TFU pour piscine (FCFA)                 |
| `departements`           | array  | Liste des départements                             |
| — `nom`                  | string | Nom affiché du département                         |
| — `slug`                 | string | Identifiant technique                              |
| — `communes`             | array  | Liste des communes du département                  |
| — — `arrondissements`    | array  | Liste des arrondissements de la commune            |
| — — — `tarifs`           | object | Clé = `Categorie_XX`, valeur = `{ description, slug_description, tfu_par_m2, tfu_minimum }` |
| `tfu_par_m2`             | number | Tarif en FCFA par m² de surface bâtie              |
| `tfu_minimum`            | number | Minimum de perception (FCFA) pour cette catégorie  |

---

### TVM — Taxe sur les Véhicules à Moteur

Codes : `TVM` · Types : `ENTREPRISE`, `PARTICULIER`

```json
{
  "tarifs": {
    "tricycle": 15000,
    "company": [
      { "maxPower": 7,    "amount": 150000 },
      { "maxPower": null, "amount": 200000 }
    ],
    "private": [
      { "maxPower": 7,    "amount": 20000 },
      { "maxPower": 10,   "amount": 30000 },
      { "maxPower": 15,   "amount": 40000 },
      { "maxPower": null, "amount": 60000 }
    ],
    "public_persons": [
      { "maxCapacity": 9,    "amount": 38000 },
      { "maxCapacity": 20,   "amount": 59800 },
      { "maxCapacity": null, "amount": 86800 }
    ],
    "public_goods": [
      { "maxCapacity": 2.5,  "amount": 49500 },
      { "maxCapacity": 5,    "amount": 68200 },
      { "maxCapacity": 10,   "amount": 102300 },
      { "maxCapacity": null, "amount": 136400 }
    ]
  },
  "title": "...",
  "label": "TVM",
  "description": "...",
  "competent_center": "..."
}
```

| Champ                   | Type   | Description                                                            |
|-------------------------|--------|------------------------------------------------------------------------|
| `tarifs.tricycle`       | number | Montant fixe pour tricycles (FCFA)                                     |
| `tarifs.company`        | array  | Véhicules de société — barème `{ maxPower, amount }` par puissance fiscale (CV) |
| `tarifs.private`        | array  | Véhicules particuliers — barème `{ maxPower, amount }` par puissance fiscale    |
| `tarifs.public_persons` | array  | Transport public de personnes — barème `{ maxCapacity, amount }` par capacité (places) |
| `tarifs.public_goods`   | array  | Transport public de marchandises — barème `{ maxCapacity, amount }` par capacité (tonnes) |

Pour tous les barèmes : `null` dans `maxPower` / `maxCapacity` désigne le dernier seuil (illimité).

---

## Champs communs à tous les objets `parametres`

Ces quatre champs sont présents sur chaque impôt :

| Champ             | Type   | Description                                             |
|-------------------|--------|---------------------------------------------------------|
| `title`           | string | Intitulé complet de l'impôt                             |
| `label`           | string | Libellé court (utilisé dans les tableaux récapitulatifs)|
| `description`     | string | Description affichée dans les résultats d'estimation   |
| `competent_center`| string | Centre des impôts compétent à contacter                 |

---

## Exemples complets

### Cas 1 — Modifier un impôt existant (année déjà en base)

#### Étape 1 : s'authentifier

```bash
curl -X POST http://localhost:5400/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "username": "fiscpredict@impot.bj", "password": "fiscpredict@2026" }'
```

Récupérer le champ `token` dans la réponse.

#### Étape 2 : consulter les paramètres actuels

```bash
curl -X POST http://localhost:5400/api/fiscal/impots \
  -H "Content-Type: application/json" \
  -d '{ "annee": 2025, "typeContribuable": "ENTREPRISE" }'
```

Localiser le document `code_impot: "TPS"` dans le tableau `impots`, copier le bloc `parametres`.

#### Étape 3 : modifier et mettre à jour

```bash
curl -X PUT http://localhost:5400/api/fiscal/impots/TPS \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "annee": 2025,
    "typeContribuable": "ENTREPRISE",
    "parametres": {
      "taux_tps": 0.05,
      "montant_minimum": 12000,
      "redevance_rtb": 4000,
      "seuil_regime_reel": 50000000,
      "cci_rates": [...],
      "title": "Taxe Professionnelle Synthétique",
      "label": "TPS",
      "description": "...",
      "competent_center": "...",
      "echeances": { "solde": "30 avril N+1", "acompte_1": "10 février", "acompte_2": "10 juin" },
      "textes": { ... }
    }
  }'
```

> Le bloc `parametres` doit être **complet** — il remplace l'intégralité du champ en base.
> Ne pas envoyer uniquement les champs modifiés, cela effacerait les autres.

---

### Cas 2 — Ajouter les paramètres d'un impôt pour une nouvelle année

#### Étape 1 : s'authentifier

```bash
curl -X POST http://localhost:5400/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "username": "fiscpredict@impot.bj", "password": "fiscpredict@2026" }'
```

#### Étape 2 : vérifier que l'année n'existe pas encore (optionnel)

```bash
curl http://localhost:5400/api/fiscal/annees-disponibles
```

Si `2027` n'apparaît pas dans `annees`, le document n'existe pas — utiliser `POST /create`.

#### Étape 3 : créer le document

```bash
curl -X POST http://localhost:5400/api/fiscal/impots/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "codeImpot": "TPS",
    "annee": 2027,
    "typeContribuable": "ENTREPRISE",
    "label": "TPS - Entreprise 2027",
    "parametres": {
      "taux_tps": 0.05,
      "montant_minimum": 10000,
      "redevance_rtb": 4000,
      "seuil_regime_reel": 50000000,
      "cci_rates": [...],
      "title": "Taxe Professionnelle Synthétique",
      "label": "TPS",
      "description": "...",
      "competent_center": "...",
      "echeances": { "solde": "30 avril N+1", "acompte_1": "10 février", "acompte_2": "10 juin" },
      "textes": { ... }
    }
  }'
```

Réponse attendue (201) :
```json
{
  "success": true,
  "message": "Paramètres TPS (ENTREPRISE) 2027 créés.",
  "data": { "codeImpot": "TPS", "typeContribuable": "ENTREPRISE", "annee": 2027 }
}
```

Si le triplet existe déjà, la réponse est **409** avec le message :
```json
{
  "success": false,
  "message": "Les paramètres TPS (ENTREPRISE) 2027 existent déjà. Utilisez PUT pour les modifier."
}
```
