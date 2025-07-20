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

