#!/bin/bash

# Script de restauration des volumes depuis une sauvegarde
# Usage: ./restore_volume.sh [backup_name]
# Exemples:
#   ./restore_volume.sh backup_20241201_143022
#   ./restore_volume.sh                    # Liste les sauvegardes disponibles

# Charger les utilitaires Docker avec auto-détection
source "$(dirname "$0")/docker-utils.sh"

# Afficher la configuration détectée
show_detected_config

BACKUP_DIR="./backups"
BACKUP_NAME=${1:-""}

cd ..

echo "📦 Restauration des volumes Docker..."

# Si aucun nom de sauvegarde n'est fourni, lister les sauvegardes disponibles
if [ -z "$BACKUP_NAME" ]; then
    echo "📋 Sauvegardes disponibles:"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo "❌ Dossier de sauvegarde '$BACKUP_DIR' non trouvé."
        echo "💡 Créez d'abord une sauvegarde avec: ./backup_volume.sh"
        exit 1
    fi
    
    # Lister les métadonnées des sauvegardes
    for metadata_file in "$BACKUP_DIR"/*_metadata.txt; do
        if [ -f "$metadata_file" ]; then
            backup_name=$(basename "$metadata_file" _metadata.txt)
            echo ""
            echo "📁 Sauvegarde: $backup_name"
            cat "$metadata_file"
            echo "---"
        fi
    done
    
    echo ""
    echo "💡 Usage: $0 [nom_de_la_sauvegarde]"
    echo "💡 Exemple: $0 backup_20241201_143022"
    exit 0
fi

# Vérifier que la sauvegarde existe
BACKUP_METADATA="$BACKUP_DIR/${BACKUP_NAME}_metadata.txt"
if [ ! -f "$BACKUP_METADATA" ]; then
    echo "❌ Sauvegarde '$BACKUP_NAME' non trouvée."
    echo "📋 Sauvegardes disponibles:"
    ls -la "$BACKUP_DIR"/*_metadata.txt 2>/dev/null | sed 's/.*\///' | sed 's/_metadata.txt//' || echo "Aucune sauvegarde trouvée."
    exit 1
fi

echo "🔍 Restauration de la sauvegarde: $BACKUP_NAME"
echo "📄 Métadonnées:"
cat "$BACKUP_METADATA"
echo ""

# Confirmation de l'utilisateur
echo "⚠️ ATTENTION: Cette opération va remplacer les volumes actuels!"
read -p "Continuer? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Restauration annulée."
    exit 0
fi

# Arrêter les conteneurs
echo "⏹️ Arrêt des conteneurs..."
 docker compose -f "$COMPOSE_FILE" down

# Extraire les volumes depuis les métadonnées
VOLUMES=$(grep "Volumes sauvegardés:" "$BACKUP_METADATA" | cut -d: -f2 | tr -d ' ')

if [ -z "$VOLUMES" ]; then
    echo "❌ Impossible de déterminer les volumes à restaurer."
    exit 1
fi

echo "🔍 Volumes à restaurer: $VOLUMES"

# Restaurer chaque volume
for volume in $VOLUMES; do
    BACKUP_FILE="$BACKUP_DIR/${volume}_$(grep "Timestamp:" "$BACKUP_METADATA" | cut -d: -f2 | tr -d ' ').tar.gz"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "⚠️ Fichier de sauvegarde non trouvé: $BACKUP_FILE"
        continue
    fi
    
    echo "📁 Restauration du volume: $volume"
    echo "📦 Fichier: $BACKUP_FILE"
    
    # Supprimer le volume existant s'il existe
    docker volume rm "$volume" 2>/dev/null || true
    
    # Créer le volume
    docker volume create "$volume"
    
    # Restaurer le contenu
    docker run --rm -v "$volume":/target -v "$(pwd)/$BACKUP_DIR":/backup alpine tar xzf "/backup/$(basename "$BACKUP_FILE")" -C /target
    
    if [ $? -eq 0 ]; then
        echo "✅ Volume '$volume' restauré avec succès."
    else
        echo "❌ Erreur lors de la restauration du volume '$volume'."
    fi
done

echo ""
echo "🚀 Redémarrage des conteneurs..."
 docker compose -f "$COMPOSE_FILE" up -d

echo ""
echo "✅ Restauration terminée!"
echo "📊 Statut des services:"
 docker compose -f "$COMPOSE_FILE" ps

echo ""
echo "💡 Pour vérifier les logs: ./logs-docker.dev.sh"
