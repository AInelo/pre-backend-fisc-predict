## Utilisation de l'endpoint TFU

### Endpoint
- `POST /impots/general/reel/tfu/calcul`

### Headers
- `Content-Type: application/json`

### Schéma d'entrée attendu

```json
{
  "periodeFiscale": "AAAA" ou "libellé contenant AAAA",
  "parcelles": [
    {
      "departement": "slug-departement",
      "commune": "slug-commune",
      "arrondissement": "slug-arrondissement",
      "nbrBatiments": nombre_total_batiments, // optionnel, calculé si absent
      "batiments": [
        {
          "categorie": "slug-categorie",
          "squareMeters": surface_en_m2
        }
        // ... autres bâtiments
      ],
      "nbrPiscines": nombre_piscines // optionnel, défaut 0
    }
    // ... autres parcelles
  ]
}
```

- `periodeFiscale` doit contenir l'année (ex: `"2024"`).
- `parcelles` peut être un objet unique ou un tableau d'objets.
- Chaque `batiment` doit indiquer:
  - `categorie`: slug correspondant au tarif (ex: `habitation`, `immeuble-commercial`, etc.).
  - `squareMeters`: surface du bâtiment en m² (nombre positif).
- `nbrBatiments` (optionnel) : si présent, doit correspondre au nombre d'éléments dans `batiments`.
- `nbrPiscines` (optionnel) : nombre entier ≥ 0 (30 000 FCFA par piscine).

### Exemple minimal (1 parcelle, 1 bâtiment, pas de piscine)

```json
{
  "periodeFiscale": "2024",
  "parcelles": {
    "departement": "littoral",
    "commune": "cotonou",
    "arrondissement": "1er-arrondissement",
    "batiments": {
      "categorie": "habitation",
      "squareMeters": 120
    }
  }
}
```

### Exemple complet (2 parcelles, bâtiments multiples et piscines)

```json
{
  "periodeFiscale": "2024",
  "parcelles": [
    {
      "departement": "littoral",
      "commune": "cotonou",
      "arrondissement": "1er-arrondissement",
      "nbrBatiments": 2,
      "batiments": [
        {
          "categorie": "habitation",
          "squareMeters": 150
        },
        {
          "categorie": "immeuble-commercial",
          "squareMeters": 90
        }
      ],
      "nbrPiscines": 1
    },
    {
      "departement": "atlantique",
      "commune": "calavi",
      "arrondissement": "godomey",
      "batiments": [
        {
          "categorie": "habitation",
          "squareMeters": 80
        }
      ],
      "nbrPiscines": 0
    }
  ]
}
```

### Réponse

Retourne `GlobalEstimationInfoData` ou `BackendEstimationFailureResponse`. En succès :
- `totalEstimation`: montant total TFU (bâtiments + piscines) arrondi à l'entier.
- `VariableEnter`: surfaces/piscines déclarées.
- `impotDetailCalcule`: détail par parcelle et par bâtiment, rappel des piscines et du minimum appliqué.
- `obligationEcheance`, `infosSupplementaires`, `impotConfig`: informations règlementaires.

En cas d'erreur, voir `errors` avec `code`, `message`, `details`, etc.

