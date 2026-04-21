#!/bin/bash

# Script d'affichage des logs des conteneurs
# Usage: ./logs-docker.dev.sh [service_name] [options]
# Exemples:
#   ./logs-docker.dev.sh                    # Logs de tous les services
#   ./logs-docker.dev.sh <service_name>     # Logs d'un service spécifique
#   ./logs-docker.dev.sh <service_name> -f  # Suivi des logs en temps réel
#   ./logs-docker.dev.sh <service_name> --tail=100 # 100 dernières lignes

# Charger les utilitaires Docker avec auto-détection
source "$(dirname "$0")/docker-utils.sh"

# Afficher la configuration détectée
show_detected_config

SERVICE_NAME=${1:-""}
LOG_OPTIONS=${@:2}

# Permet d'utiliser "app" comme alias du service principal détecté
if [ "$SERVICE_NAME" = "app" ]; then
    SERVICE_NAME="$MAIN_SERVICE"
fi

cd ..

echo "📋 Affichage des logs Docker..."

# Si un service spécifique est demandé
if [ -n "$SERVICE_NAME" ]; then
    # Vérifier si le service existe dans le compose
    if ! validate_service "$COMPOSE_FILE" "$SERVICE_NAME"; then
        echo "❌ Service '$SERVICE_NAME' non trouvé dans $COMPOSE_FILE"
        show_available_services "$COMPOSE_FILE"
        exit 1
    fi
    
    echo "🎯 Logs du service: $SERVICE_NAME"
    echo "⚙️ Options: $LOG_OPTIONS"
    echo ""
    
    # Vérifier si le conteneur existe
    if ! docker compose -f "$COMPOSE_FILE" ps "$SERVICE_NAME" | grep -q "$SERVICE_NAME"; then
        echo "⚠️ Le service '$SERVICE_NAME' n'existe pas ou n'a jamais été démarré."
        echo "🚀 Pour démarrer le service: ./start-docker.dev.sh"
        exit 1
    fi
    
    # Afficher les logs du service spécifique
    docker compose -f "$COMPOSE_FILE" logs $LOG_OPTIONS "$SERVICE_NAME"
else
    echo "🎯 Logs de tous les services"
    echo "⚙️ Options: $LOG_OPTIONS"
    echo ""
    
    # Afficher les logs de tous les services
    docker compose -f "$COMPOSE_FILE" logs $LOG_OPTIONS
fi

echo ""
echo "💡 Conseils d'utilisation:"
echo "   -f, --follow          Suivre les logs en temps réel"
echo "   --tail=N              Afficher les N dernières lignes"
echo "   --since=TIMESTAMP     Logs depuis un timestamp"
echo "   --until=TIMESTAMP     Logs jusqu'à un timestamp"
echo ""
echo "💡 Exemples:"
echo "   ./logs-docker.dev.sh $MAIN_SERVICE -f"
echo "   ./logs-docker.dev.sh $MAIN_SERVICE --tail=50"
echo "   ./logs-docker.dev.sh startax-database --tail=100"
echo ""
echo "📋 Services disponibles:"
show_available_services "$COMPOSE_FILE"
