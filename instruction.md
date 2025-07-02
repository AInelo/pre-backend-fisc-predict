# Documentation de l'API de gestion de fichiers

Cette API permet de gérer l'upload, la recherche et la récupération de fichiers via des endpoints REST. Toutes les routes sont préfixées par `/api`.

## Authentification
Chaque requête doit inclure une clé secrète (`secret_key`) dans le body (POST) ou en query (GET).

---

## 1. Upload d'un fichier

**POST** `/api/upload-file`

- **FormData** :
  - `file` : le fichier à uploader (champ unique)
  - `secret_key` : la clé secrète

**Réponse :**
```json
{
  "success": true,
  "message": "Fichier uploadé avec succès",
  "data": { ... }
}
```

---

## 2. Upload de plusieurs fichiers

**POST** `/api/upload-files`

- **FormData** :
  - `files` : les fichiers à uploader (plusieurs fichiers)
  - `secret_key` : la clé secrète

**Réponse :**
```json
{
  "success": true,
  "message": "Fichiers uploadés avec succès",
  "data": [ ... ]
}
```

---

## 3. Rechercher un fichier

**GET** `/api/find-file?filename=nom.txt&secret_key=...`

- **Query params** :
  - `filename` : nom du fichier à rechercher
  - `secret_key` : la clé secrète

**Réponse :**
```json
{
  "success": true,
  "data": { ... }
}
```

---

## 4. Lister tous les fichiers

**GET** `/api/find-files?secret_key=...`

- **Query params** :
  - `secret_key` : la clé secrète

**Réponse :**
```json
{
  "success": true,
  "data": [ ... ]
}
```

---

## Exemples d'utilisation avec curl

### Upload d'un fichier
```bash
curl -X POST http://localhost:5000/api/upload-file \
  -F "file=@/chemin/vers/fichier.txt" \
  -F "secret_key=VOTRE_CLE"
```

### Upload de plusieurs fichiers
```bash
curl -X POST http://localhost:5000/api/upload-files \
  -F "files=@/chemin/vers/fichier1.txt" \
  -F "files=@/chemin/vers/fichier2.txt" \
  -F "secret_key=VOTRE_CLE"
```

### Rechercher un fichier
```bash
curl "http://localhost:5000/api/find-file?filename=fichier.txt&secret_key=VOTRE_CLE"
```

### Lister tous les fichiers
```bash
curl "http://localhost:5000/api/find-files?secret_key=VOTRE_CLE"
```

---

## Codes d'erreur possibles
- 401 : Clé secrète manquante
- 403 : Clé secrète invalide
- 404 : Fichier non trouvé
- 500 : Erreur serveur

---

Pour toute question, contactez l'administrateur de l'API.
