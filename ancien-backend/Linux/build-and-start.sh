#!/bin/bash

# Script de build et démarrage complet
# Usage: ./build-and-start.sh [service_name] [--force-rebuild]
# Exemples:
#   ./build-and-start.sh                    # Build et start du service principal
#   ./build-and-start.sh startax-api        # Build et start du service startax-api
#   ./build-and-start.sh startax-api --force-rebuild # Force le rebuild même si l'image existe

# Charger les utilitaires Docker avec auto-détection
source "$(dirname "$0")/docker-utils.sh"

# Afficher la configuration détectée
show_detected_config

SERVICE_NAME=${1:-"$MAIN_SERVICE"}
FORCE_REBUILD=false

# Parse des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force-rebuild)
            FORCE_REBUILD=true
            shift
            ;;
        *)
            if [ -z "${1#*--}" ]; then
                SERVICE_NAME=$1
            fi
            shift
            ;;
    esac
done

cd ..

echo "🔨 Build et démarrage du service: $SERVICE_NAME"
echo ""

# Vérifier si le service existe dans le compose
if ! validate_service "$COMPOSE_FILE" "$SERVICE_NAME"; then
    echo "❌ Service '$SERVICE_NAME' non trouvé dans $COMPOSE_FILE"
    show_available_services "$COMPOSE_FILE"
    exit 1
fi

# Créer le réseau s'il n'existe pas
if ! docker network ls --format '{{.Name}}' | grep -wq "$NETWORK_NAME"; then
    echo "🔧 Réseau '$NETWORK_NAME' non trouvé. Création..."
    docker network create "$NETWORK_NAME"
else
    echo "✅ Réseau '$NETWORK_NAME' déjà existant."
fi

# Build du service
echo ""
echo "🔨 Build du service: $SERVICE_NAME"
if [ "$FORCE_REBUILD" = true ]; then
    echo "⚡ Force rebuild activé..."
    docker compose -f "$COMPOSE_FILE" build --no-cache "$SERVICE_NAME"
else
    docker compose -f "$COMPOSE_FILE" build "$SERVICE_NAME"
fi

if [ $? -eq 0 ]; then
    echo "✅ Build réussi pour le service: $SERVICE_NAME"
else
    echo "❌ Erreur lors du build du service: $SERVICE_NAME"
    exit 1
fi

# Démarrage du service
echo ""
echo "🚀 Démarrage du service: $SERVICE_NAME"
docker compose -f "$COMPOSE_FILE" up -d "$SERVICE_NAME"

if [ $? -eq 0 ]; then
    echo "✅ Service '$SERVICE_NAME' démarré avec succès!"
    
    # Afficher le statut
    echo ""
    echo "📊 Statut du service:"
    docker compose -f "$COMPOSE_FILE" ps "$SERVICE_NAME"
    
    # Afficher les informations de connexion si c'est le service principal ou tous les services
    if [ "$SERVICE_NAME" = "$MAIN_SERVICE" ] || [ "$SERVICE_NAME" = "app" ]; then
        echo ""
        echo "🔌 Informations de connexion:"
        show_connection_info "$COMPOSE_FILE"
    fi
    
    # Afficher les logs récents
    echo ""
    echo "📋 Logs récents (5 dernières lignes):"
    docker compose -f "$COMPOSE_FILE" logs --tail=5 "$SERVICE_NAME"
    
    echo ""
    echo "💡 Pour voir les logs en temps réel: ./logs-docker.dev.sh $SERVICE_NAME -f"
    echo "💡 Pour redémarrer: ./restart-docker.dev.sh $SERVICE_NAME"
    echo "💡 Pour voir tous les ports: ./show-ports.sh"
else
    echo "❌ Erreur lors du démarrage du service: $SERVICE_NAME"
    exit 1
fi
