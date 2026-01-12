#!/bin/bash

# Charger les utilitaires Docker avec auto-détection
source "$(dirname "$0")/docker-utils.sh"

# Afficher la configuration détectée
show_detected_config

# Vérifie si le réseau Docker existe
if ! docker network ls --format '{{.Name}}' | grep -wq "$NETWORK_NAME"; then
  echo "🔧 Réseau '$NETWORK_NAME' non trouvé. Création..."
  docker network create "$NETWORK_NAME"
else
  echo "✅ Réseau '$NETWORK_NAME' déjà existant."
fi

cd ..

# Vérifier si l'image du service principal existe
echo "🔍 Vérification de l'image du service principal: $MAIN_SERVICE"
COMPOSE_PROJECT_NAME=$(basename $(pwd))
if ! docker images | grep -q "$COMPOSE_PROJECT_NAME.*$MAIN_SERVICE\|$MAIN_SERVICE.*$COMPOSE_PROJECT_NAME" && ! docker compose -f "$COMPOSE_FILE" images "$MAIN_SERVICE" 2>/dev/null | grep -q "$MAIN_SERVICE"; then
    echo "⚠️ Image non trouvée. Build automatique en cours..."
    echo "🔨 Build de l'image..."
     docker compose -f "$COMPOSE_FILE" build "$MAIN_SERVICE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Build réussi!"
    else
        echo "❌ Erreur lors du build. Arrêt du processus."
        exit 1
    fi
else
    echo "✅ Image déjà existante."
fi

# Lancement du  docker compose
echo "🚀 Lancement du  docker compose ($COMPOSE_FILE)..."
 docker compose -f "$COMPOSE_FILE" up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Services démarrés avec succès!"
    echo ""
    echo "📊 Statut des services:"
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    echo "🔌 Informations de connexion:"
    show_connection_info "$COMPOSE_FILE"
    echo ""
    echo "💡 Pour voir les logs: ./logs-docker.dev.sh [service_name] -f"
    echo "💡 Pour voir les ports: ./show-ports.sh"
else
    echo "❌ Erreur lors du démarrage des services"
    exit 1
fi
