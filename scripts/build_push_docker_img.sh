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

# 📦 Build de l'image avec le Dockerfile
echo "🔨 Build de l'image Docker depuis Dockerfile..."
# docker build -t "$IMAGE_NAME:$TAG" .
# docker compose -f ../bucket-urmapha-compose.yml build
cd "$(dirname "$0")/.."
docker compose -f bucket-urmapha-compose.yml build


# 🏷️ Tag avec l’identifiant Docker Hub
FULL_IMAGE_NAME="$DOCKER_USERNAME/$IMAGE_NAME:$TAG"
docker tag "$IMAGE_NAME:$TAG" "$FULL_IMAGE_NAME"

# 🔐 Connexion Docker Hub (non interactive)
echo "🔐 Connexion à Docker Hub..."
echo "$DOCKER_TOKEN" | docker login -u "$DOCKER_USERNAME" --password-stdin

# 🚀 Push de l'image
echo "📤 Push de l’image Docker : $FULL_IMAGE_NAME"
docker push "$FULL_IMAGE_NAME"
