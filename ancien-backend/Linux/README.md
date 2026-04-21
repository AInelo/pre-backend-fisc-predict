# 🐳 Scripts Docker - Backend Startax (Fisc Predict)

Ce dossier contient tous les scripts nécessaires pour gérer votre environnement Docker de développement pour le projet **Backend Startax** (Prédiction fiscale et estimation d'impôts).

## 📦 Architecture du Projet

Le projet utilise :
- **Service principal** : `startax-api` (Node.js/Express avec TypeScript)
- **Base de données MongoDB** : `startax-mongodb` (données NoSQL)
- **Réseau Docker** : `startax-network` (réseau bridge)

## 📋 Configuration auto-détectée

Tous les scripts détectent automatiquement votre configuration :
- **Fichier compose** : `backend-startax-docker-compose.dev.yml`
- **Réseau** : `startax-network`
- **Service principal** : `startax-api`
- **Services disponibles** : `startax-api`, `startax-mongodb`

> 💡 **Important** : Tous les scripts utilisent directement les **noms de services** définis dans le fichier `docker-compose.dev.yml`, pas les noms de conteneurs (`container_name`). Vous pouvez utiliser n'importe quel nom de service directement dans les scripts.

## 🚀 Ordre d'utilisation recommandé

### 1️⃣ **PREMIÈRE FOIS / NOUVEAU PROJET**

```bash
# Étape 1 : Créer le fichier .env.dev (si pas déjà fait)
./create-env-dev.sh

# Étape 2 : Build complet + démarrage (recommandé)
./build-and-start.sh

# Option alternative : Build puis start séparément
./build-docker.dev.sh && ./start-docker.dev.sh
```

### 2️⃣ **DÉVELOPPEMENT QUOTIDIEN**

```bash
# Démarrage simple (build auto si nécessaire)
./start-docker.dev.sh

# Ou si vous voulez forcer le rebuild
./build-and-start.sh --force-rebuild
```

### 3️⃣ **MAINTENANCE**

```bash
# Redémarrage simple (tous les services)
./restart-docker.dev.sh

# Redémarrage d'un service spécifique
./restart-docker.dev.sh startax-api
./restart-docker.dev.sh startax-mongodb

# Redémarrage avec rebuild
./restart-docker.dev.sh startax-api --rebuild

# Mise à jour d'un service spécifique
./update-docker.dev.sh startax-api
```

### 4️⃣ **DEBUGGING**

```bash
# Voir tous les logs
./logs-docker.dev.sh

# Logs d'un service spécifique (utilisez les noms de services du docker-compose)
./logs-docker.dev.sh startax-api -f
./logs-docker.dev.sh startax-mongodb -f

# Accéder au conteneur d'un service spécifique
./exec-docker.dev.sh startax-api bash
./exec-docker.dev.sh startax-mongodb bash

# Exécuter une commande dans un service
./exec-docker.dev.sh startax-api npm install
./exec-docker.dev.sh startax-api ls -la
```

### 5️⃣ **SAUVEGARDE**

```bash
# Sauvegarder les volumes
./backup_volume.sh

# Restaurer une sauvegarde
./restore_volume.sh
```

### 6️⃣ **NETTOYAGE**

```bash
# Nettoyage léger
./clean-docker.dev.sh

# Nettoyage complet
./clean-docker.dev.sh --all

# Supprimer les volumes
./delete_volume-docker.sh
```

## 📝 Scripts disponibles

| Script | Description | Usage |
|--------|-------------|-------|
| `build-and-start.sh` | Build complet + démarrage (recommandé pour la première fois) | `./build-and-start.sh [service] [--force-rebuild]` |
| `start-docker.dev.sh` | Démarrage avec build auto si nécessaire | `./start-docker.dev.sh` |
| `build-docker.dev.sh` | Build uniquement | `./build-docker.dev.sh [service]` |
| `restart-docker.dev.sh` | Redémarrage des services | `./restart-docker.dev.sh [service] [--rebuild]` |
| `update-docker.dev.sh` | Mise à jour du service | `./update-docker.dev.sh [service]` |
| `logs-docker.dev.sh` | Affichage des logs | `./logs-docker.dev.sh [service] [options]` |
| `exec-docker.dev.sh` | Exécution de commandes dans le conteneur | `./exec-docker.dev.sh [service] [command]` |
| `show-ports.sh` | Afficher les ports et informations de connexion | `./show-ports.sh` |
| `backup_volume.sh` | Sauvegarde des volumes | `./backup_volume.sh [backup_name]` |
| `restore_volume.sh` | Restauration des volumes | `./restore_volume.sh [backup_name]` |
| `clean-docker.dev.sh` | Nettoyage des ressources Docker | `./clean-docker.dev.sh [--force] [--all]` |
| `delete_volume-docker.sh` | Suppression des volumes | `./delete_volume-docker.sh` |
| `test-auto-detection.sh` | Test de l'auto-détection | `./test-auto-detection.sh` |
| `help.sh` | Script d'aide | `./help.sh` |

## 🔧 Détails des scripts

### Build et Démarrage

#### `build-and-start.sh`
Script principal pour build + start en une commande.

```bash
# Build et start du service principal
./build-and-start.sh

# Build et start d'un service spécifique
./build-and-start.sh startax-api

# Force le rebuild même si l'image existe
./build-and-start.sh startax-api --force-rebuild
```

#### `start-docker.dev.sh`
Démarrage intelligent avec build automatique si nécessaire.

```bash
# Démarrage simple
./start-docker.dev.sh
```

#### `build-docker.dev.sh`
Build uniquement d'un service.

```bash
# Build du service principal
./build-docker.dev.sh

# Build d'un service spécifique
./build-docker.dev.sh startax-api
```

### Maintenance

#### `restart-docker.dev.sh`
Redémarrage des services avec options.

```bash
# Redémarrage de tous les services
./restart-docker.dev.sh

# Redémarrage d'un service spécifique
./restart-docker.dev.sh startax-api

# Redémarrage avec rebuild
./restart-docker.dev.sh startax-api --rebuild
```

#### `update-docker.dev.sh`
Mise à jour d'un service.

```bash
# Mise à jour du service principal
./update-docker.dev.sh

# Mise à jour d'un service spécifique
./update-docker.dev.sh startax-api
```

### Debugging

#### `logs-docker.dev.sh`
Affichage des logs avec options avancées.

```bash
# Logs de tous les services
./logs-docker.dev.sh

# Logs d'un service spécifique
./logs-docker.dev.sh startax-api

# Suivi des logs en temps réel
./logs-docker.dev.sh startax-api -f

# 100 dernières lignes
./logs-docker.dev.sh startax-api --tail=100

# Logs depuis un timestamp
./logs-docker.dev.sh startax-api --since=2024-01-01T10:00:00
```

#### `exec-docker.dev.sh`
Exécution de commandes dans le conteneur.

```bash
# Accéder au shell du service principal
./exec-docker.dev.sh

# Accéder au shell d'un service spécifique
./exec-docker.dev.sh startax-api bash

# Exécuter une commande
./exec-docker.dev.sh startax-api npm install

# Lister les fichiers
./exec-docker.dev.sh startax-api ls -la
```

### Sauvegarde et Restauration

#### `backup_volume.sh`
Sauvegarde des volumes Docker.

```bash
# Sauvegarde avec nom automatique
./backup_volume.sh

# Sauvegarde avec nom personnalisé
./backup_volume.sh ma_sauvegarde
```

#### `restore_volume.sh`
Restauration des volumes depuis une sauvegarde.

```bash
# Lister les sauvegardes disponibles
./restore_volume.sh

# Restaurer une sauvegarde spécifique
./restore_volume.sh backup_20241201_143022
```

### Nettoyage

#### `clean-docker.dev.sh`
Nettoyage des ressources Docker.

```bash
# Nettoyage avec confirmation
./clean-docker.dev.sh

# Nettoyage sans confirmation
./clean-docker.dev.sh --force

# Nettoyage complet (images, volumes, réseaux)
./clean-docker.dev.sh --all
```

#### `delete_volume-docker.sh`
Suppression des volumes Docker.

```bash
# Supprimer tous les volumes
./delete_volume-docker.sh
```

## 🛠️ Utilitaires

### `docker-utils.sh`
Script utilitaire central qui fournit :
- Auto-détection du fichier compose
- Auto-détection du réseau
- Auto-détection du service principal
- **Nouvelles fonctions pour utiliser les noms de services** :
  - `get_services_list()` : Obtenir la liste des services depuis docker-compose
  - `validate_service()` : Valider qu'un service existe dans le docker-compose
  - `show_available_services()` : Afficher les services disponibles avec leurs détails
- Fonctions d'affichage de configuration améliorées

### `test-auto-detection.sh`
Script de test pour vérifier que l'auto-détection fonctionne correctement.

```bash
# Tester l'auto-détection
./test-auto-detection.sh
```

### `show-ports.sh`
Script pour afficher les ports et informations de connexion de tous les services.

```bash
# Afficher les ports et informations de connexion
./show-ports.sh
```

Affiche :
- Les ports host et container de chaque service
- Les URLs de connexion (API, MongoDB)
- Le statut actuel des services

### `help.sh`
Script d'aide interactif.

```bash
# Afficher l'aide
./help.sh
```

## 🎯 Services Disponibles

> ⚠️ **Important** : Utilisez toujours les **noms de services** (colonne "Service") dans les scripts, pas les noms de conteneurs (colonne "Container").

| Service | Description | Port | Container |
|---------|-------------|------|-----------|
| `startax-api` | Application backend Node.js/Express | 5001 | startax-backend-container |
| `startax-mongodb` | Base de données MongoDB | 27018 | startax-mongo-container |

### Exemples d'utilisation avec les noms de services :

```bash
# ✅ CORRECT - Utiliser le nom de service
./restart-docker.dev.sh startax-api
./logs-docker.dev.sh startax-mongodb -f
./exec-docker.dev.sh startax-mongodb bash

# ❌ INCORRECT - Ne pas utiliser le nom de conteneur
./restart-docker.dev.sh startax-backend-container  # ❌ Ne fonctionnera pas
```

Pour voir la liste complète des services disponibles :
```bash
docker compose -f backend-startax-docker-compose.dev.yml config --services
```

## 💾 Volumes Docker

Les volumes créés pour ce projet :
- `./mongo-data` : Données MongoDB persistantes (montage local)

## 💡 Conseils d'utilisation

### Workflow de développement typique

1. **Première fois** :
   ```bash
   ./build-and-start.sh
   ```

2. **Développement quotidien** :
   ```bash
   ./start-docker.dev.sh
   ```

3. **Après modification du code** :
   ```bash
   ./restart-docker.dev.sh startax-api --rebuild
   ```

4. **Debugging** :
   ```bash
   # Logs de l'application
   ./logs-docker.dev.sh startax-api -f
   
   # Logs de MongoDB
   ./logs-docker.dev.sh startax-mongodb -f
   
   # Accéder au shell de l'application
   ./exec-docker.dev.sh startax-api bash
   
   # Exécuter une commande dans l'app
   ./exec-docker.dev.sh startax-api npm install
   ```

5. **Sauvegarde avant changement important** :
   ```bash
   # Sauvegarder les bases de données (MongoDB)
   ./backup_volume.sh
   
   # Restaurer une sauvegarde
   ./restore_volume.sh backup_20241201_143022
   ```

### Gestion des erreurs

- Si un script échoue, vérifiez les logs avec `./logs-docker.dev.sh`
- Pour un reset complet : `./clean-docker.dev.sh --all` puis `./build-and-start.sh`
- Pour restaurer une sauvegarde : `./restore_volume.sh`

### Performance

- Utilisez `./start-docker.dev.sh` pour le développement quotidien (plus rapide)
- Utilisez `./build-and-start.sh --force-rebuild` seulement quand nécessaire
- Nettoyez régulièrement avec `./clean-docker.dev.sh`

## 🔍 Auto-détection

Tous les scripts utilisent l'auto-détection pour :
- Trouver automatiquement le fichier `*-docker-compose.dev.yml`
- Détecter le nom du réseau Docker
- Identifier le service principal
- S'adapter aux changements de nom de projet

Cette fonctionnalité élimine le besoin de modifier manuellement les scripts lors des changements de configuration.

## 📞 Support

Pour toute question ou problème :
1. Vérifiez l'aide avec `./help.sh`
2. Testez l'auto-détection avec `./test-auto-detection.sh`
3. Consultez les logs avec `./logs-docker.dev.sh`

---

## 🔧 Configuration Requise

### Prérequis
- Docker et Docker Compose installés
- Réseau `urmapha-network` créé (les scripts le créent automatiquement si absent)
- Fichier `.env.dev` configuré dans le répertoire racine

### Création du réseau (si nécessaire)

Si le réseau `startax-network` n'existe pas, les scripts le créent automatiquement. Sinon, vous pouvez le créer manuellement :

```bash
docker network create startax-network
```

### Variables d'environnement

Assurez-vous d'avoir un fichier `.env.dev` avec les variables nécessaires (base de données, JWT secrets, etc.)

**Création automatique du fichier .env.dev :**

```bash
# Créer le fichier .env.dev depuis le template
./create-env-dev.sh
```

Ce script créera automatiquement le fichier `.env.dev` avec les valeurs par défaut pour le développement :
- **MongoDB** : Connexion via le service Docker `mongo_backend_pci_app:27017`
- **Port** : `5002`
- **JWT_SECRET** : Secret par défaut (à changer pour la production)

⚠️ **Important** : Après la création, modifiez les valeurs suivantes selon vos besoins :
- `EMAIL_USER`, `EMAIL_PASS` : Vos identifiants email
- `JWT_SECRET` : Changez pour un secret plus sécurisé
- `FRONTEND_URL` : URL de votre frontend

---

**Note** : Tous les scripts sont conçus pour fonctionner de manière autonome et détecter automatiquement votre configuration. Aucune modification manuelle n'est nécessaire lors des changements de nom de projet ou de structure.

## 📚 Liens Utiles

- **API Backend** : `http://localhost:5001`
- **MongoDB** : `localhost:27018`
