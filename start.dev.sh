#!/bin/bash

NETWORK_NAME=startax-network
COMPOSE_FILE=backend-startax-docker-compose.dev.yml

# Vérifie si le réseau Docker existe
if ! docker network ls --format '{{.Name}}' | grep -wq "$NETWORK_NAME"; then
  echo "🔧 Réseau '$NETWORK_NAME' non trouvé. Création..."
  docker network create "$NETWORK_NAME"
else
  echo "✅ Réseau '$NETWORK_NAME' déjà existant."
fi

# Lancement du docker-compose
echo "🚀 Lancement du docker-compose ($COMPOSE_FILE)..."
docker-compose -f "$COMPOSE_FILE" up -d
