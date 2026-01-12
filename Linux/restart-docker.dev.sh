#!/bin/bash

# Script de redémarrage des services Docker
# Usage: ./restart-docker.dev.sh [service_name] [--rebuild]
# Exemples:
#   ./restart-docker.dev.sh                    # Redémarre tous les services
#   ./restart-docker.dev.sh <service_name>     # Redémarre un service spécifique
#   ./restart-docker.dev.sh <service_name> --rebuild # Redémarre avec rebuild

# Charger les utilitaires Docker avec auto-détection
source "$(dirname "$0")/docker-utils.sh"

# Afficher la configuration détectée
show_detected_config

SERVICE_NAME=${1:-""}
REBUILD=false

# Parse des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --rebuild)
            REBUILD=true
            shift
            ;;
        *)
            if [ -z "$SERVICE_NAME" ]; then
                SERVICE_NAME=$1
            fi
            shift
            ;;
    esac
done

cd ..

echo "🔄 Redémarrage des services Docker..."

# Si un service spécifique est demandé
if [ -n "$SERVICE_NAME" ]; then
    # Vérifier si le service existe dans le compose
    if ! validate_service "$COMPOSE_FILE" "$SERVICE_NAME"; then
        echo "❌ Service '$SERVICE_NAME' non trouvé dans $COMPOSE_FILE"
        show_available_services "$COMPOSE_FILE"
        exit 1
    fi
    
    echo "🎯 Redémarrage du service: $SERVICE_NAME"
    
    if [ "$REBUILD" = true ]; then
        echo "🔨 Redémarrage avec rebuild..."
        docker compose -f "$COMPOSE_FILE" up -d --build --force-recreate "$SERVICE_NAME"
    else
        echo "⚡ Redémarrage simple..."
        docker compose -f "$COMPOSE_FILE" restart "$SERVICE_NAME"
    fi
    
    # Vérifier le statut du service
    echo "📊 Statut du service après redémarrage:"
    docker compose -f "$COMPOSE_FILE" ps "$SERVICE_NAME"
    
else
    echo "🎯 Redémarrage de tous les services"
    
    if [ "$REBUILD" = true ]; then
        echo "🔨 Redémarrage avec rebuild..."
        docker compose -f "$COMPOSE_FILE" up -d --build --force-recreate
    else
        echo "⚡ Redémarrage simple..."
        docker compose -f "$COMPOSE_FILE" restart
    fi
    
    # Vérifier le statut de tous les services
    echo "📊 Statut de tous les services après redémarrage:"
        docker compose -f "$COMPOSE_FILE" ps
fi

echo ""
echo "✅ Redémarrage terminé!"

# Afficher les informations de connexion si tous les services ou le service principal
if [ -z "$SERVICE_NAME" ] || [ "$SERVICE_NAME" = "$MAIN_SERVICE" ] || [ "$SERVICE_NAME" = "app" ]; then
    echo ""
    echo "🔌 Informations de connexion:"
    show_connection_info "$COMPOSE_FILE"
fi

# Afficher les logs récents pour vérifier que tout fonctionne
echo "📋 Logs récents (5 dernières lignes):"
if [ -n "$SERVICE_NAME" ]; then
    docker compose -f "$COMPOSE_FILE" logs --tail=5 "$SERVICE_NAME"
else
    docker compose -f "$COMPOSE_FILE" logs --tail=5
fi

echo ""
echo "💡 Pour voir les logs en temps réel: ./logs-docker.dev.sh ${SERVICE_NAME:-''} -f"
echo "💡 Pour voir tous les ports: ./show-ports.sh"
