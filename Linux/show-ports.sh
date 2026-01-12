#!/bin/bash

# Script pour afficher les informations de connexion et ports des services
# Usage: ./show-ports.sh

# Charger les utilitaires Docker avec auto-détection
source "$(dirname "$0")/docker-utils.sh"

# Afficher la configuration détectée
show_detected_config

# Afficher les informations de connexion
show_connection_info "$COMPOSE_FILE"

# Afficher le statut des services
echo "📊 Statut des services:"
cd ..
docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "💡 Pour voir les logs d'un service:"
echo "   ./logs-docker.dev.sh <service_name> -f"
echo ""
echo "💡 Pour accéder à un service:"
echo "   ./exec-docker.dev.sh <service_name> bash"

