#!/bin/bash

# Script de sauvegarde des volumes Docker
# Usage: ./backup_volume.sh [nom_du_backup]

# Charger les utilitaires Docker avec auto-détection
source "$(dirname "$0")/docker-utils.sh"

# Afficher la configuration détectée
show_detected_config

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME=${1:-"backup_${TIMESTAMP}"}

cd ..

echo "📦 Création de la sauvegarde des volumes..."

# Créer le dossier de sauvegarde s'il n'existe pas
mkdir -p "$BACKUP_DIR"

# Arrêter les conteneurs pour une sauvegarde cohérente
echo "⏹️ Arrêt des conteneurs..."
docker compose -f "$COMPOSE_FILE" stop

# Lister les volumes utilisés par le compose
VOLUMES=$(docker compose -f "$COMPOSE_FILE" config --volumes)

if [ -z "$VOLUMES" ]; then
    echo "⚠️ Aucun volume trouvé dans le fichier compose."
    exit 1
fi

echo "🔍 Volumes détectés: $VOLUMES"

# Créer l'archive de sauvegarde
BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.tar.gz"

echo "💾 Sauvegarde vers: $BACKUP_FILE"

# Sauvegarder chaque volume
for volume in $VOLUMES; do
    echo "📁 Sauvegarde du volume: $volume"
    docker run --rm -v "$volume":/source -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf "/backup/${volume}_${TIMESTAMP}.tar.gz" -C /source .
done

# Créer un fichier de métadonnées
cat > "$BACKUP_DIR/${BACKUP_NAME}_metadata.txt" << EOF
Backup créé le: $(date)
Fichier compose: $COMPOSE_FILE
Volumes sauvegardés: $VOLUMES
Timestamp: $TIMESTAMP
EOF

echo "✅ Sauvegarde terminée: $BACKUP_FILE"
echo "📋 Métadonnées: $BACKUP_DIR/${BACKUP_NAME}_metadata.txt"

# Redémarrer les conteneurs
echo "🚀 Redémarrage des conteneurs..."
docker compose -f "$COMPOSE_FILE" up -d

echo "🎉 Sauvegarde complète terminée!"
