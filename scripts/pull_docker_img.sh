#!/bin/bash
set -e

# Variables d'environnement
DOCKER_USERNAME="${DOCKERHUB_USERNAME:?}"
DOCKER_TOKEN="${DOCKERHUB_TOKEN:?}"
DEPLOY_REPO="git@github.com:AInelo/startax-deploy.git"
DEPLOY_DIR="startax-deploy"
IMAGE_NAME="backend-startax"
TAG="latest"
FULL_IMAGE="$DOCKER_USERNAME/$IMAGE_NAME:$TAG"
COMPOSE_FILE="backend-startax.yml"

# 📦 Clonage ou mise à jour du dépôt
if [ ! -d "$DEPLOY_DIR" ]; then
  echo "📦 Clonage du dépôt de déploiement..."
  git clone "$DEPLOY_REPO"
else
  echo "🔄 Le dépôt $DEPLOY_DIR existe déjà. Mise à jour..."
  cd "$DEPLOY_DIR"
  git pull origin main || git pull
  cd ..
fi

cd "$DEPLOY_DIR"

# 🔐 Connexion à Docker Hub
echo "🔐 Connexion à Docker Hub..."
echo "$DOCKER_TOKEN" | docker login -u "$DOCKER_USERNAME" --password-stdin

# 📥 Pull de l’image
echo "📥 Pull de l’image : $FULL_IMAGE"
docker pull "$FULL_IMAGE"

# 🚀 Lancement via docker-compose sans modification du fichier
echo "🚀 Lancement du service avec docker-compose..."
docker compose -f "$COMPOSE_FILE" up -d

echo "✅ Déploiement terminé avec succès."






















# #!/bin/bash
# set -e

# # Variables d'environnement
# DOCKER_USERNAME="${DOCKERHUB_USERNAME:?}"
# DOCKER_TOKEN="${DOCKERHUB_TOKEN:?}"
# DEPLOY_REPO="git@github.com:AInelo/startax-deploy.git"
# DEPLOY_DIR="startax-deploy"
# IMAGE_NAME="backend-startax"
# TAG="latest"
# FULL_IMAGE="$DOCKER_USERNAME/$IMAGE_NAME:$TAG"

# # 📦 Clonage ou mise à jour du dépôt
# if [ ! -d "$DEPLOY_DIR" ]; then
#   echo "📦 Clonage du dépôt de déploiement..."
#   git clone "$DEPLOY_REPO"
# else
#   echo "🔄 Le dépôt $DEPLOY_DIR existe déjà. Mise à jour..."
#   cd "$DEPLOY_DIR"
#   git pull origin main || git pull
#   cd ..
# fi

# cd "$DEPLOY_DIR"

# # 🔐 Connexion à Docker Hub
# echo "🔐 Connexion à Docker Hub..."
# echo "$DOCKER_TOKEN" | docker login -u "$DOCKER_USERNAME" --password-stdin

# # 📥 Pull de l’image
# echo "📥 Pull de l’image : $FULL_IMAGE"
# docker pull "$FULL_IMAGE"

# # 🔧 Correction du docker-compose : forcer image et retirer build s'il existe
# COMPOSE_FILE="backend-startax.yml"

# # ✅ Supprimer le bloc build proprement avec awk
# echo "🧹 Suppression du bloc 'build:' s'il existe..."
# awk '
# /^[[:space:]]*build:/ { in_build = 1; next }
# /^[[:space:]]+.*$/ && in_build { next }
# { in_build = 0; print }
# ' "$COMPOSE_FILE" > tmp.yml && mv tmp.yml "$COMPOSE_FILE"

# # ✅ Remplacer ou insérer la ligne image:
# if grep -q "image:" "$COMPOSE_FILE"; then
#   echo "🔄 Remplacement de la ligne image: par $FULL_IMAGE"
#   sed -i -E "s|image:.*|image: $FULL_IMAGE|" "$COMPOSE_FILE"
# else
#   echo "➕ Ajout de la ligne image: $FULL_IMAGE"
#   sed -i -E "/^[[:space:]]*backend-startax:/a \ \ image: $FULL_IMAGE" "$COMPOSE_FILE"
# fi

# # 🚀 Redémarrage du service via docker-compose
# echo "🚀 Lancement de l’image avec docker-compose..."
# docker compose -f "$COMPOSE_FILE" up -d

# echo "✅ Déploiement terminé avec succès."












































# #!/bin/bash
# set -e

# # Variables d'environnement
# DOCKER_USERNAME="${DOCKERHUB_USERNAME:?}"
# DOCKER_TOKEN="${DOCKERHUB_TOKEN:?}"
# DEPLOY_REPO="git@github.com:AInelo/startax-deploy.git"
# DEPLOY_DIR="startax-deploy"
# IMAGE_NAME="backend-startax"
# TAG="latest"
# FULL_IMAGE="$DOCKER_USERNAME/$IMAGE_NAME:$TAG"

# # 🔍 Vérifie si le dossier existe
# if [ ! -d "$DEPLOY_DIR" ]; then
#   echo "📦 Clonage du dépôt de déploiement..."
#   git clone "$DEPLOY_REPO"
# else
#   echo "✅ Dépôt $DEPLOY_DIR déjà présent."
# fi

# cd "$DEPLOY_DIR"

# # 🔐 Connexion à Docker Hub
# echo "🔐 Connexion à Docker Hub..."
# echo "$DOCKER_TOKEN" | docker login -u "$DOCKER_USERNAME" --password-stdin

# # 📥 Pull de l’image
# echo "📥 Pull de l’image : $FULL_IMAGE"
# docker pull "$FULL_IMAGE"

# # 🔧 Correction du docker-compose : forcer image et retirer build s'il existe
# COMPOSE_FILE="backend-startax.yml"

# if grep -q "build:" "$COMPOSE_FILE"; then
#   echo "⚠️ Suppression de la section 'build:' dans $COMPOSE_FILE pour éviter le build local"
#   # Supprimer la ligne build: et ses sous-lignes (indentées)
#   # On remplace build: et ses lignes indentées suivantes par rien
#   # On force aussi que l'image soit bien celle du DockerHub
#   sed -i.bak -E '/build:/, /^[^[:space:]]/ s/.*//' "$COMPOSE_FILE"
# fi

# # Forcer que l'image soit bien la bonne dans le compose
# # Remplacer la ligne image: si elle existe, sinon l'ajouter
# if grep -q "image:" "$COMPOSE_FILE"; then
#   sed -i -E "s|image:.*|image: $FULL_IMAGE|" "$COMPOSE_FILE"
# else
#   # Ajouter image: ligne juste après le service (ex: backend-startax:)
#   sed -i -E "/^[[:space:]]*backend-startax:/a \ \ image: $FULL_IMAGE" "$COMPOSE_FILE"
# fi

# # 🚀 Redémarrage du service via docker-compose
# echo "🚀 Lancement de l’image avec docker-compose..."
# docker compose -f "$COMPOSE_FILE" up -d

# echo "✅ Déploiement terminé avec succès."
