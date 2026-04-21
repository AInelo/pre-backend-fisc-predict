# Backend STARTAX — FISC Predict (API)

API Node.js/Express (TypeScript) pour les calculs et estimations fiscales. Le projet suit une architecture MVC claire et est livré avec une pipeline de déploiement Docker/Compose, des scripts d’automatisation et une configuration NGINX/SSL prête pour la prod.

---

## Sommaire
- Présentation rapide
- Architecture (MVC + couches)
- Démarrage local (Node / Docker Compose)
- Environnements et variables
- Pipeline de build & déploiement (Docker & Compose)
- Scripts d’automatisation (`scripts/`)
- Configuration NGINX (`nginx/`) et SSL
- Arborescence utile

---

## Présentation rapide
- Langage: TypeScript (Node 20)
- Framework: Express
- Port API: `5001`
- Entrée: `src/server.ts`
- Endpoints clés:
  - `GET /apiAlive` (healthcheck)
  - `POST /api/general/entreprise/estimation-globale`
  - `GET /api/general/entreprise/impots-disponibles`
  - `GET /api/general/entreprise/impot/:code`

En développement via Docker Compose, l'API s'exécute avec MongoDB (pour stockage/expansion future).

---

## Architecture (MVC + couches)
Le projet suit une organisation en couches, inspirée de MVC.

- `src/server.ts`: point d’entrée Express, middlewares de base, montage des routes sous `/api`.
- `src/routes/`: couche « routes » (Express `Router`) – mapping HTTP -> contrôleurs.
  - Exemple: `src/routes/impots/general/entreprise.general.estimation.route.ts` mappe vers les méthodes du contrôleur d’estimation globale.
- `src/controllers/`: couche « contrôleurs » – logique d’orchestration HTTP, validation d’entrée, formatage de réponse.
  - Exemple: `src/controllers/impots/general/entreprise.general.estimation.controller.ts` appelle le service de calcul et gère les erreurs.
- `src/services/`: couche « services » – logique métier et calculs.
  - Exemple: `src/services/impots/general/entreprise.general.estimation.ts`
  - `src/services/impots/general/impot.general.calculation.state.ts` centralise l’état/disponibilité des impôts (`available`/`not_available`).
- `src/models/`: modèles de données (WIP) – structures liées à la persistance/DTO.
- `src/middleware/`: middlewares Express (auth, validation, etc.).
- `src/utils/`, `src/constants/`, `src/types/`: utilitaires, constantes, typages partagés.

Flux MVC typique:
HTTP Request -> `routes/*` -> `controllers/*` -> `services/*` -> (modèles/bases si nécessaire) -> Réponse HTTP

---

## Démarrage local

### Option 1 — Node (sans Docker)
Prérequis: Node 20+

```bash
npm install
npm run dev
# L’API écoute sur http://localhost:5001
```

### Option 2 — Docker Compose (dev)
Le fichier `backend-startax-docker-compose.dev.yml` lance:
- `startax-api`: image Node basée sur `Dockerfile.dev`, volume monté `.:/app`, port `5001:5001`
- `startax-mongodb`: MongoDB 6 (`27018:27017`), DB `startax_db`

```bash
# Build & up
docker compose -f backend-startax-docker-compose.dev.yml up --build -d

# Logs
docker compose -f backend-startax-docker-compose.dev.yml logs -f startax-api

# Stop
docker compose -f backend-startax-docker-compose.dev.yml down
```

Endpoints de test:
```bash
curl http://localhost:5001/apiAlive
curl -X POST http://localhost:5001/api/general/entreprise/estimation-globale -H 'Content-Type: application/json' -d '{"dataImpot": {"IS": {"chiffreAffaire": 50000000, "charges": 30000000, "secteur": "general", "periodeFiscale": "2025"}}}'
```

---

## Environnements et variables

### Dev (Compose)
Injectées via `backend-startax-docker-compose.dev.yml` pour l'API:
- `MONGO_URL`

### Prod
Variables requises par les scripts de build/deploy:
- `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`
- `USER_SERVEUR`, `IP_SERVEUR`, `SSH_SERVEUR` (clé privée SSH au format texte pour connexion au VPS)

Variables applicatives (exemples typiques à préparer côté infra):
- MongoDB: `PROD_MONGO_URL`, `PROD_MONGO_DB_NAME`
- Auth: `PROD_JWT_SECRET`
- Mail: `PROD_EMAIL_HOST`, `PROD_EMAIL_USER`, `PROD_EMAIL_PASS`
- Frontend: `FRONTEND_URL`

Le script `scripts/creation_env_prod.sh` contient un gabarit (commenté) pour générer `.env.prod` à partir de ces variables.

---

## Pipeline de build & déploiement (Docker & Compose)

### Images Docker
- `Dockerfile`: image de production
  - Build TypeScript: `npm run build && npm run postbuild`
  - Démarrage: `node dist/server.js`
- `Dockerfile.dev`: image de développement
  - Démarrage: `npm run dev` (ex: `nodemon`/`ts-node-dev`)

### Build local de l’image de prod
```bash
docker compose -f backend-startax-docker-compose.build.yml build
# Produit l’image locale: backend-startax:latest
```

### Publication de l’image sur Docker Hub
Utiliser `scripts/build_push_docker_img.sh` (tag et push sur votre registre):
```bash
export DOCKERHUB_USERNAME=... \
       DOCKERHUB_TOKEN=... \
       USER_SERVEUR=... \
       IP_SERVEUR=... \
       SSH_SERVEUR="$(cat /chemin/vers/id_rsa)"

bash scripts/build_push_docker_img.sh
```

### Déploiement sur le serveur (pull & run Compose prod)
Déploiement automatisé via deux scripts:
- `scripts/pull_docker_img_executor.sh`: s’exécute en local, se connecte au VPS via SSH, copie les scripts, exporte les secrets, exécute le pull & le `docker compose up -d` côté serveur, puis nettoie.
- `scripts/pull_docker_img.sh`: s’exécute sur le VPS (clonage du dépôt infra, login Docker, pull, compose up, nettoyage images).

Exécution:
```bash
export DOCKERHUB_USERNAME=... \
       DOCKERHUB_TOKEN=... \
       USER_SERVEUR=... \
       IP_SERVEUR=... \
       SSH_SERVEUR="$(cat /chemin/vers/id_rsa)"

bash scripts/pull_docker_img_executor.sh
```
Résultat attendu: 
- Pull de l’image `DOCKERHUB_USERNAME/backend-startax:latest`
- Lancement via `backend-startax-docker-compose.prod.yml` (dans le dépôt de déploiement)
- Vérification des conteneurs actifs

---

## Scripts d’automatisation (`scripts/`)
- `build_push_docker_img.sh`:
  - Build l’image via `backend-startax-docker-compose.build.yml`
  - Tag vers `DOCKERHUB_USERNAME/backend-startax:latest`
  - Login & push Docker Hub
  - Assure l’existence d’un réseau Docker externe `startax-network`

- `pull_docker_img.sh` (à exécuter sur le serveur):
  - Crée le réseau `startax-network` si absent
  - Clone/mets à jour le dépôt d’infra `startax-deploy`
  - Login Docker Hub, pull l’image, `docker compose up -d`
  - Nettoyage des images

- `pull_docker_img_executor.sh` (local):
  - Gère la connexion SSH, copie des scripts sur le VPS, exécution distante, nettoyage (y compris `.env.prod` si présent)

- `creation_env_prod.sh`:
  - Gabarit pour générer `.env.prod` à partir des variables `PROD_*` (actuellement commenté)

- `setup_nginx_config.sh`:
  - Copie et active la conf NGINX distante pour le domaine défini (lien symbolique `sites-available` -> `sites-enabled`)

- `configure_ssl.sh`:
  - Provisionne un certificat Let’s Encrypt (mode `standalone`), relance NGINX

- `reload_nginx.sh`:
  - Teste la conf `nginx -t` et reload `systemctl reload nginx`

---

## NGINX (`nginx/`) et SSL
Fichier de site: `nginx/startax-backend.totonlionel.com.conf`
- Redirection HTTP -> HTTPS
- Deux `location` principaux:
  - `/apiAlive` -> `http://localhost:5001/apiAlive`
  - `/api/` -> `http://localhost:5001/api/`
- CORS gérés au niveau NGINX (OPTIONS, en-têtes standards)
- Certificats Let’s Encrypt attendus dans `/etc/letsencrypt/live/<domaine>/...`

Mise en place côté serveur:
```bash
# Variables d’environnement requises: USER_SERVEUR, IP_SERVEUR, (clé SSH)
KEY=/chemin/vers/id_rsa

bash scripts/setup_nginx_config.sh "$KEY"
bash scripts/configure_ssl.sh "$KEY"
bash scripts/reload_nginx.sh "$KEY"
```

---

## Arborescence utile
```
.
├── src/
│   ├── server.ts                     # Entrée Express
│   ├── routes/                       # Routes Express (mapping HTTP)
│   ├── controllers/                  # Contrôleurs (validation/orchestration)
│   ├── services/                     # Logique métier (calculs, états)
│   ├── models/                       # Modèles de données (WIP)
│   ├── middleware/                   # Middlewares Express
│   ├── utils/ | constants/ | types/  # Utilitaires, constantes, types partagés
│
├── Dockerfile                        # Image de production
├── Dockerfile.dev                    # Image de développement
├── backend-startax-docker-compose.dev.yml   # Stack dev (API+Mongo)
├── backend-startax-docker-compose.build.yml # Build image prod locale
├── scripts/                          # Scripts d’automatisation (build/push/deploy, NGINX/SSL)
├── nginx/                            # Conf NGINX prod
└── mongo-data/                       # Volumes de données (dev)
```

---

## Notes
- Le port exposé par l’API est `5001` (voir `src/server.ts`, Dockerfiles et NGINX).
- Les endpoints de calcul évoluent selon l’état des impôts (`impot.general.calculation.state.ts`).
- Adaptez les variables d’environnement prod à votre infrastructure (DB, mail, auth, frontend).
