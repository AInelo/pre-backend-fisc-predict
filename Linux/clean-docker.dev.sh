#!/bin/bash

# Script de nettoyage des ressources Docker
# Usage: ./clean-docker.dev.sh [--force] [--all]

# Charger les utilitaires Docker avec auto-détection
source "$(dirname "$0")/docker-utils.sh"

# Afficher la configuration détectée
show_detected_config

FORCE=false
CLEAN_ALL=false

# Parse des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE=true
            shift
            ;;
        --all)
            CLEAN_ALL=true
            shift
            ;;
        *)
            echo "❌ Argument inconnu: $1"
            echo "Usage: $0 [--force] [--all]"
            exit 1
            ;;
    esac
done

cd ..

echo "🧹 Nettoyage des ressources Docker..."

if [ "$FORCE" = false ] && [ "$CLEAN_ALL" = false ]; then
    echo "⚠️ Ce script va nettoyer les ressources Docker."
    echo "   Utilisez --force pour éviter cette confirmation"
    echo "   Utilisez --all pour nettoyer TOUT (images, volumes, réseaux)"
    read -p "Continuer? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Nettoyage annulé."
        exit 0
    fi
fi

echo "⏹️ Arrêt et suppression des conteneurs..."
docker compose -f "$COMPOSE_FILE" down

if [ "$CLEAN_ALL" = true ]; then
    echo "🗑️ Suppression des volumes..."
    docker compose -f "$COMPOSE_FILE" down -v
    
    echo "🗑️ Suppression des images non utilisées..."
    docker image prune -f
    
    echo "🗑️ Suppression des réseaux non utilisés..."
    docker network prune -f
    
    echo "🗑️ Suppression des volumes non utilisés..."
    docker volume prune -f
    
    echo "🗑️ Nettoyage complet du système..."
    docker system prune -f
else
    echo "🗑️ Suppression des conteneurs arrêtés..."
    docker container prune -f
    
    echo "🗑️ Suppression des images non utilisées..."
    docker image prune -f
fi

echo "📊 État actuel du système Docker:"
echo "🐳 Conteneurs:"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📦 Images:"
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | head -10

echo ""
echo "💾 Volumes:"
docker volume ls --format "table {{.Name}}\t{{.Driver}}"

echo ""
echo "🌐 Réseaux:"
docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"

echo ""
echo "✅ Nettoyage terminé!"
