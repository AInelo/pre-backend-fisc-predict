#!/bin/bash

# Script d'exécution de commandes dans le conteneur
# Usage: ./exec-docker.dev.sh [service_name] [command]
# Exemples:
#   ./exec-docker.dev.sh <service_name> bash
#   ./exec-docker.dev.sh <service_name> npm install
#   ./exec-docker.dev.sh <service_name> ls -la

# Charger les utilitaires Docker avec auto-détection
source "$(dirname "$0")/docker-utils.sh"

# Afficher la configuration détectée
show_detected_config

SERVICE_NAME=${1:-"$MAIN_SERVICE"}
COMMAND=${2:-"bash"}

cd ..

echo "🔧 Exécution de commande dans le conteneur: $SERVICE_NAME"

# Vérifier si le service existe dans le compose
if ! validate_service "$COMPOSE_FILE" "$SERVICE_NAME"; then
    echo "❌ Service '$SERVICE_NAME' non trouvé dans $COMPOSE_FILE"
    show_available_services "$COMPOSE_FILE"
    exit 1
fi

# Vérifier si le conteneur est en cours d'exécution
if ! docker compose -f "$COMPOSE_FILE" ps "$SERVICE_NAME" | grep -q "Up"; then
    echo "⚠️ Le service '$SERVICE_NAME' n'est pas en cours d'exécution."
    echo "🚀 Démarrage du service..."
    docker compose -f "$COMPOSE_FILE" up -d "$SERVICE_NAME"
    
    # Attendre que le service soit prêt
    echo "⏳ Attente du démarrage du service..."
    sleep 3
fi

echo "🎯 Commande à exécuter: $COMMAND"
echo "📦 Service: $SERVICE_NAME"
echo ""

# Exécuter la commande
if [ "$COMMAND" = "bash" ] || [ "$COMMAND" = "sh" ]; then
    echo "🐚 Ouverture d'un shell interactif..."
    docker compose -f "$COMPOSE_FILE" exec "$SERVICE_NAME" "$COMMAND"
else
    echo "⚡ Exécution de la commande..."
    docker compose -f "$COMPOSE_FILE" exec "$SERVICE_NAME" "$COMMAND"
fi

echo ""
echo "✅ Commande terminée."
echo ""
echo "💡 Pour voir les services disponibles:"
echo "   docker compose -f $COMPOSE_FILE config --services"
