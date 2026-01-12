#!/bin/bash

# Script de suppression des volumes Docker
# Usage: ./delete_volume-docker.sh

# Charger les utilitaires Docker avec auto-détection
source "$(dirname "$0")/docker-utils.sh"

# Afficher la configuration détectée
show_detected_config

echo "🗑️ Suppression des volumes Docker..."

cd ..

echo "⏹️ Arrêt et suppression des conteneurs avec volumes..."
docker compose -f "$COMPOSE_FILE" down -v

echo "✅ Volumes supprimés avec succès!"
