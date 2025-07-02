# AuthController - Documentation

## Vue d'ensemble

Le `AuthController` gère toutes les opérations d'authentification de l'application. Il étend `BaseController` et utilise `AuthService` pour implémenter un système d'authentification sécurisé avec tokens par email et JWT.

## Endpoints disponibles

### 🔐 Authentification

#### POST `/auth/request`
Demande d'authentification par email (envoie un token).

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Un email d'authentification a été envoyé à votre adresse",
  "meta": {
    "expiresIn": 86400
  }
}
```

#### POST `/auth/verify`
Authentification avec token reçu par email.

**Body:**
```json
{
  "token": "abc123def456..."
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Authentification réussie",
  "data": {
    "token": "jwt-token-here",
    "acteur": {
      "id": 1,
      "nom": "Dr. Martin",
      "email": "martin@hopital.fr",
      "typeActeur": "hygieniste",
      "hopitalId": 1,
      "hopital": {
        "id": 1,
        "nom": "Hôpital Central",
        "adresse": "123 Rue de la Santé",
        "emailContact": "contact@hopital.fr"
      }
    },
    "expiresIn": 604800
  }
}
```

#### POST `/auth/login`
Authentification avec email et mot de passe (pour les administrateurs).

**Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

#### POST `/auth/verify-jwt`
Vérification d'un JWT token.

**Body:**
```json
{
  "token": "jwt-token-here"
}
```

#### POST `/auth/logout`
Déconnexion (révoquer tous les tokens d'un acteur).

**Headers:**
```
Authorization: Bearer jwt-token-here
```

### 🔄 Gestion des tokens

#### POST `/auth/refresh`
Renouveler un token d'authentification.

**Headers:**
```
Authorization: Bearer jwt-token-here
```

#### GET `/auth/tokens/valid`
Vérifier si un acteur a des tokens valides.

**Headers:**
```
Authorization: Bearer jwt-token-here
```

#### POST `/auth/tokens/cleanup`
Nettoyer les tokens expirés (admin seulement).

**Headers:**
```
Authorization: Bearer admin-jwt-token
```

### 🔒 Sécurité

#### GET `/auth/permissions/check`
Vérifier les permissions d'un acteur.

**Headers:**
```
Authorization: Bearer jwt-token-here
```

**Query Parameters:**
- `requiredType`: Type d'acteur requis (optionnel)

#### GET `/auth/hopital/access/:hopitalId`
Vérifier si un acteur peut accéder à un hôpital spécifique.

**Headers:**
```
Authorization: Bearer jwt-token-here
```

### 📊 Utilitaires

#### GET `/auth/profile`
Récupérer le profil de l'acteur connecté.

**Headers:**
```
Authorization: Bearer jwt-token-here
```

#### GET `/auth/stats`
Obtenir les statistiques d'authentification (admin seulement).

**Headers:**
```
Authorization: Bearer admin-jwt-token
```

**Réponse:**
```json
{
  "success": true,
  "message": "Statistiques d'authentification récupérées",
  "data": {
    "totalTokens": 150,
    "validTokens": 120,
    "expiredTokens": 30,
    "totalActeurs": 45
  }
}
```

#### POST `/auth/extract-token-info`
Extraire les informations d'un JWT token (pour debug/admin).

**Body:**
```json
{
  "token": "jwt-token-here"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Informations du token extraites",
  "data": {
    "acteurId": 1,
    "acteurType": "hygieniste",
    "hopitalId": 1,
    "isValid": true
  }
}
```

## Middlewares disponibles

### `requireAuth`
Vérifie que l'utilisateur est authentifié avec un JWT token valide.

```typescript
router.get('/protected-route', authController.requireAuth, (req, res) => {
  // Route protégée
});
```

### `requireActeurType`
Vérifie que l'utilisateur a le type d'acteur requis.

```typescript
router.get('/admin-only', 
  authController.requireAuth,
  authController.requireActeurType(TypeActeur.ADMINISTRATEUR_LOCAL),
  (req, res) => {
    // Route accessible seulement aux administrateurs
  }
);
```

### `requireHopitalAccess`
Vérifie que l'utilisateur peut accéder à l'hôpital spécifié.

```typescript
router.get('/hopital/:hopitalId/data',
  authController.requireAuth,
  authController.requireHopitalAccess,
  (req, res) => {
    // Route accessible seulement si l'utilisateur peut accéder à cet hôpital
  }
);
```

## Gestion des erreurs

Le contrôleur utilise les méthodes d'erreur héritées de `BaseController` :

- `unauthorized()` - 401 : Authentification requise
- `forbidden()` - 403 : Permissions insuffisantes
- `validationError()` - 422 : Erreurs de validation
- `notFound()` - 404 : Ressource non trouvée
- `error()` - 500 : Erreur serveur

## Types d'acteurs

Les types d'acteurs disponibles sont définis dans `types.acteur.ts` :

- `ADMINISTRATEUR_LOCAL` : Administrateur local
- `HYGIENISTE` : Hygiéniste
- `GYNECOLOGUE` : Gynécologue
- `SAGE_FEMME` : Sage-femme

## Sécurité

### Tokens d'authentification
- Durée de vie : 24 heures par défaut
- Génération : Cryptographiquement sécurisée
- Stockage : Base de données avec expiration

### JWT Tokens
- Durée de vie : 7 jours par défaut (configurable via `JWT_EXPIRES_IN`)
- Secret : Configuré via `JWT_SECRET`
- Contenu : ID acteur, email, type acteur, ID hôpital

### Validation
- Validation des emails avec regex
- Validation des types d'acteurs
- Validation des IDs d'hôpitaux
- Sanitisation des entrées

## Configuration requise

### Variables d'environnement
```env
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
EMAIL_HOST=smtp.example.com
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
EMAIL_FROM=noreply@example.com
```

### Base de données
Le contrôleur nécessite les tables suivantes :
- `acteur` : Informations des utilisateurs
- `token_auth` : Tokens d'authentification
- `hopital` : Informations des hôpitaux

## Exemples d'utilisation

### Flux d'authentification complet

1. **Demande d'authentification**
```bash
curl -X POST http://localhost:3000/api/auth/request \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

2. **Vérification du token reçu par email**
```bash
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token": "token-from-email"}'
```

3. **Utilisation du JWT pour les requêtes protégées**
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer jwt-token-here"
```

### Protection de routes

```typescript
// Route accessible à tous les utilisateurs authentifiés
router.get('/public-data', authController.requireAuth, (req, res) => {
  res.json({ data: 'Données publiques' });
});

// Route accessible seulement aux hygiénistes
router.get('/hygiene-data', 
  authController.requireAuth,
  authController.requireActeurType(TypeActeur.HYGIENISTE),
  (req, res) => {
    res.json({ data: 'Données d\'hygiène' });
  }
);

// Route accessible seulement aux administrateurs d'un hôpital spécifique
router.get('/hopital/:hopitalId/admin-data',
  authController.requireAuth,
  authController.requireActeurType(TypeActeur.ADMINISTRATEUR_LOCAL),
  authController.requireHopitalAccess,
  (req, res) => {
    res.json({ data: 'Données administratives' });
  }
);
```

## Tests

Le contrôleur inclut une suite de tests complète couvrant :
- Validation des entrées
- Gestion des erreurs
- Middlewares d'authentification
- Tous les endpoints
- Cas d'erreur et de succès

Pour exécuter les tests :
```bash
npm test -- src/controllers/__test__/AuthController.test.ts
``` 