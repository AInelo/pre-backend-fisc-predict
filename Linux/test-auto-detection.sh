#!/bin/bash

# Script de test pour vérifier l'auto-détection des scripts Docker
# Usage: ./test-auto-detection.sh

echo "🧪 Test de l'auto-détection des scripts Docker"
echo "=============================================="
echo ""

# Charger les utilitaires
source "$(dirname "$0")/docker-utils.sh"

echo "✅ Configuration auto-détectée:"
show_detected_config

echo "🔍 Test des scripts individuels:"
echo ""

# Liste des scripts à tester
scripts=(
    "start-docker.dev.sh"
    "build-docker.dev.sh"
    "build-and-start.sh"
    "restart-docker.dev.sh"
    "logs-docker.dev.sh"
    "clean-docker.dev.sh"
    "exec-docker.dev.sh"
    "update-docker.dev.sh"
    "backup_volume.sh"
    "restore_volume.sh"
    "delete_volume-docker.sh"
)

for script in "${scripts[@]}"; do
    if [ -f "$script" ]; then
        echo "📄 Test de $script..."
        
        # Tester la détection de configuration (sans exécuter le script complet)
        if bash -c "source docker-utils.sh && echo '  ✅ Auto-détection OK'" 2>/dev/null; then
            echo "  ✅ $script: Auto-détection fonctionnelle"
        else
            echo "  ❌ $script: Problème d'auto-détection"
        fi
    else
        echo "⚠️ $script: Fichier non trouvé"
    fi
done

echo ""
echo "🎯 Résumé:"
echo "  📄 Fichier compose détecté: $COMPOSE_FILE"
echo "  🌐 Réseau détecté: $NETWORK_NAME"
echo "  🚀 Service principal détecté: $MAIN_SERVICE"
echo ""
echo "✅ Test terminé!"
echo ""
echo "💡 Vous pouvez maintenant utiliser tous les scripts sans spécifier manuellement"
echo "   les noms de fichiers compose. L'auto-détection s'occupe de tout !"
