#!/bin/bash

# Script d'aide pour les scripts Docker
# Usage: ./help.sh

echo "🐳 Aide - Scripts Docker pour le développement"
echo "=============================================="
echo ""

# Charger les utilitaires pour afficher la config
source "$(dirname "$0")/docker-utils.sh"

echo "📋 Configuration détectée:"
show_detected_config

echo "🚀 Ordre d'utilisation recommandé:"
echo ""
echo "1️⃣  PREMIÈRE FOIS / NOUVEAU PROJET:"
echo "   ./build-and-start.sh                    # Build complet + démarrage"
echo "   # ou"
echo "   ./build-docker.dev.sh && ./start-docker.dev.sh"
echo ""
echo "2️⃣  DÉVELOPPEMENT QUOTIDIEN:"
echo "   ./start-docker.dev.sh                   # Démarrage (build auto si nécessaire)"
echo "   # ou si vous voulez forcer le rebuild:"
echo "   ./build-and-start.sh --force-rebuild"
echo ""
echo "3️⃣  MAINTENANCE:"
echo "   ./restart-docker.dev.sh                      # Redémarrage simple"
echo "   ./restart-docker.dev.sh $MAIN_SERVICE --rebuild   # Redémarrage avec rebuild"
echo "   ./update-docker.dev.sh                       # Mise à jour du service"
echo ""
echo "4️⃣  DEBUGGING:"
echo "   ./logs-docker.dev.sh                         # Voir tous les logs"
echo "   ./logs-docker.dev.sh $MAIN_SERVICE -f        # Suivre les logs en temps réel"
echo "   ./exec-docker.dev.sh $MAIN_SERVICE bash      # Accéder au conteneur"
echo ""
echo "5️⃣  SAUVEGARDE:"
echo "   ./backup_volume.sh                      # Sauvegarder les volumes"
echo "   ./restore_volume.sh                     # Restaurer une sauvegarde"
echo ""
echo "6️⃣  NETTOYAGE:"
echo "   ./clean-docker.dev.sh                   # Nettoyage léger"
echo "   ./clean-docker.dev.sh --all             # Nettoyage complet"
echo "   ./delete_volume-docker.sh               # Supprimer les volumes"
echo ""
echo "📝 Scripts disponibles:"
echo ""

# Lister tous les scripts avec leur description
scripts_info=(
    "create-env-dev.sh:Créer le fichier .env.dev pour le développement"
    "build-and-start.sh:Build complet + démarrage (recommandé pour la première fois)"
    "start-docker.dev.sh:Démarrage avec build auto si nécessaire"
    "build-docker.dev.sh:Build uniquement"
    "restart-docker.dev.sh:Redémarrage des services"
    "update-docker.dev.sh:Mise à jour du service"
    "logs-docker.dev.sh:Affichage des logs"
    "exec-docker.dev.sh:Exécution de commandes dans le conteneur"
    "show-ports.sh:Afficher les ports et informations de connexion"
    "backup_volume.sh:Sauvegarde des volumes"
    "restore_volume.sh:Restauration des volumes"
    "clean-docker.dev.sh:Nettoyage des ressources Docker"
    "delete_volume-docker.sh:Suppression des volumes"
    "test-auto-detection.sh:Test de l'auto-détection"
    "help.sh:Ce script d'aide"
)

for script_info in "${scripts_info[@]}"; do
    script_name=$(echo "$script_info" | cut -d: -f1)
    description=$(echo "$script_info" | cut -d: -f2)
    
    if [ -f "$script_name" ]; then
        echo "   ✅ $script_name - $description"
    else
        echo "   ❌ $script_name - $description (non trouvé)"
    fi
done

echo ""
echo "💡 Conseils:"
echo "   • Utilisez ./build-and-start.sh pour la première fois"
echo "   • Utilisez ./start-docker.dev.sh pour le développement quotidien"
echo "   • Tous les scripts détectent automatiquement votre configuration"
echo "   • Ajoutez --help à n'importe quel script pour plus d'infos"
echo ""
echo "🔧 Configuration actuelle:"
echo "   📄 Fichier compose: $COMPOSE_FILE"
echo "   🌐 Réseau: $NETWORK_NAME"
echo "   🚀 Service principal: $MAIN_SERVICE"
echo ""
echo "📋 Services disponibles dans le docker-compose:"
show_available_services "$COMPOSE_FILE"
echo ""
echo "🔌 Informations de connexion:"
show_connection_info "$COMPOSE_FILE"
