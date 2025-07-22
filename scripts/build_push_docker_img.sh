#!/bin/bash
set -e

# 💡 Infos de l'image
IMAGE_NAME="backend-startax"
TAG="latest"
DOCKER_USERNAME="${DOCKERHUB_USERNAME:?VARIABLE DOCKERHUB_USERNAME NON DEFINIE}"
DOCKER_TOKEN="${DOCKERHUB_TOKEN:?VARIABLE DOCKERHUB_TOKEN NON DEFINIE}"

# 🌐 Infos de déploiement (non utilisées ici mais préparées si besoin pour SSH plus tard)
VPS_USER="${USER_SERVEUR:?VARIABLE USER_SERVEUR NON DEFINIE}"
VPS_HOST="${IP_SERVEUR:?VARIABLE IP_SERVEUR NON DEFINIE}"
VPS_SSH_KEY="${SSH_SERVEUR:?VARIABLE SSH_SERVEUR NON DEFINIE}"

# 🌐 Nom du réseau Docker externe
NETWORK_NAME="startax-network"

# 📄 Nom du fichier docker-compose de production
BUILD_COMPOSE_FILE="backend-startax-docker-compose.build.yml"


# 🔧 Création du réseau externe s’il n’existe pas
if ! docker network ls | grep -q "$NETWORK_NAME"; then
  echo "🌐 Création du réseau Docker externe '$NETWORK_NAME'..."
  docker network create "$NETWORK_NAME"
else
  echo "🌐 Réseau '$NETWORK_NAME' déjà existant."
fi


# 📦 Build de l'image avec le Dockerfile
echo "🔨 Build de l'image Docker depuis Dockerfile..."
# docker build -t "$IMAGE_NAME:$TAG" .
# docker compose -f ../backend-startax-docker-compose.dev.yml build
cd "$(dirname "$0")/.."
docker compose -f "$BUILD_COMPOSE_FILE" build


# 🏷️ Tag avec l’identifiant Docker Hub
FULL_IMAGE_NAME="$DOCKER_USERNAME/$IMAGE_NAME:$TAG"
docker tag "$IMAGE_NAME:$TAG" "$FULL_IMAGE_NAME"

# 🔐 Connexion Docker Hub (non interactive)
echo "🔐 Connexion à Docker Hub..."
echo "$DOCKER_TOKEN" | docker login -u "$DOCKER_USERNAME" --password-stdin

# 🚀 Push de l'image
echo "📤 Push de l’image Docker : $FULL_IMAGE_NAME"
docker push "$FULL_IMAGE_NAME"
