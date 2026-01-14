# API de Gestion des Impôts et Constantes

## Endpoints Disponibles

### 1. Lister tous les impôts
```
GET /api/admin/impots
```

**Réponse :**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "code": "IBA",
      "nom": "Impôt sur les Bénéfices des Artisans",
      "anneeFiscale": 2025,
      "actif": true,
      "constantes": [...]
    }
  ]
}
```

### 2. Récupérer un impôt spécifique
```
GET /api/admin/impots/:code/:annee
```

**Exemple :**
```
GET /api/admin/impots/IBA/2025
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "code": "IBA",
    "nom": "Impôt sur les Bénéfices des Artisans",
    "anneeFiscale": 2025,
    "actif": true,
    "constantes": [
      {
        "code": "TAUX_GENERAL",
        "valeur": 0.30,
        "type": "number",
        "description": "Taux général d'imposition",
        "unite": "%"
      }
    ]
  }
}
```

### 3. Récupérer toutes les constantes d'un impôt
```
GET /api/admin/impots/:code/:annee/constantes
```

**Exemple :**
```
GET /api/admin/impots/IBA/2025/constantes
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "TAUX_GENERAL": 0.30,
    "TAUX_ENSEIGNEMENT": 0.25,
    "MINIMUM_GENERAL": 0.015,
    ...
  }
}
```

### 4. Récupérer une constante spécifique
```
GET /api/admin/impots/:code/:annee/constantes/:constanteCode
```

**Exemple :**
```
GET /api/admin/impots/IBA/2025/constantes/TAUX_GENERAL
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "code": "TAUX_GENERAL",
    "valeur": 0.30
  }
}
```

### 5. Mettre à jour une constante
```
PUT /api/admin/impots/:code/:annee/constantes/:constanteCode
```

**Body :**
```json
{
  "valeur": 0.32,
  "description": "Nouveau taux général",
  "unite": "%"
}
```

**Exemple :**
```
PUT /api/admin/impots/IBA/2025/constantes/TAUX_GENERAL
Content-Type: application/json

{
  "valeur": 0.32,
  "description": "Taux général mis à jour pour 2025",
  "unite": "%"
}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "code": "IBA",
    "constantes": [
      {
        "code": "TAUX_GENERAL",
        "valeur": 0.32,
        "type": "number",
        "description": "Taux général mis à jour pour 2025",
        "unite": "%"
      }
    ]
  }
}
```

### 6. Lister les impôts par année
```
GET /api/admin/impots/annee/:annee
```

**Exemple :**
```
GET /api/admin/impots/annee/2025
```

## Exemples d'Utilisation avec cURL

### Récupérer les constantes IBA pour 2025
```bash
curl http://localhost:5001/api/admin/impots/IBA/2025/constantes
```

### Mettre à jour le taux général de l'IBA
```bash
curl -X PUT http://localhost:5001/api/admin/impots/IBA/2025/constantes/TAUX_GENERAL \
  -H "Content-Type: application/json" \
  -d '{
    "valeur": 0.32,
    "description": "Nouveau taux général",
    "unite": "%"
  }'
```

### Lister tous les impôts actifs pour 2025
```bash
curl http://localhost:5001/api/admin/impots/annee/2025
```

## Notes Importantes

1. **Cache** : Après une mise à jour, le cache est automatiquement vidé pour cette année fiscale
2. **Validation** : Les années fiscales doivent être des nombres valides
3. **Codes** : Les codes d'impôts sont automatiquement convertis en majuscules
4. **Types de constantes** : 
   - `number` : Valeur numérique simple
   - `array` : Tableau de valeurs
   - `object` : Objet avec clés/valeurs (ex: taux par commune)

## Gestion des Erreurs

Toutes les réponses d'erreur suivent ce format :

```json
{
  "success": false,
  "error": "Message d'erreur descriptif"
}
```

**Codes HTTP :**
- `200` : Succès
- `400` : Requête invalide (année invalide, paramètres manquants)
- `404` : Ressource introuvable (impôt ou constante)
- `500` : Erreur serveur

