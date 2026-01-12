#!/bin/bash

# Utilitaires Docker pour les scripts Linux/
# Ce fichier peut être sourcé par d'autres scripts

# Fonction pour auto-détecter le fichier compose .dev.yml
detect_compose_file() {
    local compose_file=""
    
    # Chercher le fichier compose .dev.yml dans le répertoire parent
    if [ -f "../backend-startax-docker-compose.dev.yml" ]; then
        compose_file="backend-startax-docker-compose.dev.yml"
    elif [ -f "../backend-pci-app-docker-compose.dev.yml" ]; then
        compose_file="backend-pci-app-docker-compose.dev.yml"
    elif [ -f "../backend-agbaza-docker-compose.dev.yml" ]; then
        compose_file="backend-agbaza-docker-compose.dev.yml"
    elif [ -f "../backend-urmapha-docker-compose.dev.yml" ]; then
        compose_file="backend-urmapha-docker-compose.dev.yml"
    else
        # Fallback: chercher n'importe quel fichier *-docker-compose.dev.yml
        compose_file=$(find .. -maxdepth 1 -name "*-docker-compose.dev.yml" | head -1 | xargs basename)
    fi
    
    if [ -z "$compose_file" ]; then
        echo "❌ Aucun fichier *-docker-compose.dev.yml trouvé dans le répertoire parent"
        exit 1
    fi
    
    echo "$compose_file"
}

# Fonction pour auto-détecter le nom du réseau
detect_network_name() {
    local compose_file="$1"
    local network_name=""
    local compose_path=$(get_compose_file_path "$compose_file")
    
    # Extraire le nom du réseau depuis le fichier compose (section networks)
    if [ -n "$compose_path" ] && [ -f "$compose_path" ]; then
        # Chercher dans la section networks: après "networks:" trouver la première clé (ignorer "networks:" lui-même)
        network_name=$(grep -A 10 "^networks:" "$compose_path" | grep -E "^\s+[a-zA-Z0-9_-]+:" | grep -v "^networks:" | head -1 | sed 's/://g' | xargs | tr -d ' ')
    fi
    
    # Fallback spécifique selon le projet
    if [ -z "$network_name" ] || [ "$network_name" = "networks" ]; then
        if echo "$compose_file" | grep -q "startax"; then
            network_name="startax-network"
        elif echo "$compose_file" | grep -q "pci-app"; then
            network_name="urmapha-network"
        elif echo "$compose_file" | grep -q "agbaza"; then
            network_name="agbaza-network"
        else
            local base_name=$(echo "$compose_file" | sed 's/-docker-compose.dev.yml//' | sed 's/backend-//')
            network_name="${base_name}-network"
        fi
    fi
    
    echo "$network_name"
}

# Fonction pour obtenir le chemin absolu du fichier compose
get_compose_file_path() {
    local compose_file="$1"
    local script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # Essayer depuis le répertoire Linux
    if [ -f "$script_dir/../$compose_file" ]; then
        echo "$script_dir/../$compose_file"
    # Essayer depuis le répertoire courant
    elif [ -f "$compose_file" ]; then
        echo "$(cd "$(dirname "$compose_file")" && pwd)/$(basename "$compose_file")"
    # Essayer depuis le répertoire parent
    elif [ -f "../$compose_file" ]; then
        echo "$(cd .. && pwd)/$compose_file"
    else
        echo ""
    fi
}

# Fonction pour obtenir la liste des services depuis le docker-compose
get_services_list() {
    local compose_file="$1"
    local compose_path=$(get_compose_file_path "$compose_file")
    
    if [ -n "$compose_path" ] && [ -f "$compose_path" ]; then
        docker compose -f "$compose_path" config --services 2>/dev/null | grep -v "^$"
    fi
}

# Fonction pour valider qu'un service existe dans le docker-compose
validate_service() {
    local compose_file="$1"
    local service_name="$2"
    
    if [ -z "$service_name" ]; then
        return 1
    fi
    
    local services=$(get_services_list "$compose_file")
    echo "$services" | grep -q "^${service_name}$"
}

# Fonction pour auto-détecter le nom du service principal
detect_main_service() {
    local compose_file="$1"
    local service_name=""
    local compose_path=$(get_compose_file_path "$compose_file")
    
    # Essayer d'extraire depuis docker-compose config
    if [ -n "$compose_path" ] && [ -f "$compose_path" ]; then
        local all_services=$(docker compose -f "$compose_path" config --services 2>/dev/null)
        
        # Chercher d'abord le service "app" qui est généralement le service principal
        if echo "$all_services" | grep -q "^app$"; then
            service_name="app"
        # Chercher les services avec "-api" dans le nom (ex: startax-api)
        elif echo "$all_services" | grep -qE ".*-api$"; then
            service_name=$(echo "$all_services" | grep -E ".*-api$" | head -1)
        else
            # Sinon, prendre le premier service
            service_name=$(echo "$all_services" | head -1)
        fi
        
        # Fallback: extraire depuis le fichier directement
        if [ -z "$service_name" ]; then
            service_name=$(grep -E "^\s*[a-zA-Z0-9_-]+:" "$compose_path" | grep -v -E "^\s*(version|services|volumes|networks):" | head -1 | sed 's/://g' | xargs)
        fi
    fi
    
    # Fallback: utiliser le nom basé sur le fichier compose
    if [ -z "$service_name" ]; then
        local base_name=$(echo "$compose_file" | sed 's/-docker-compose.dev.yml//')
        service_name="$base_name"
    fi
    
    echo "$service_name"
}

# Variables globales auto-détectées
COMPOSE_FILE=$(detect_compose_file)
NETWORK_NAME=$(detect_network_name "$COMPOSE_FILE")
MAIN_SERVICE=$(detect_main_service "$COMPOSE_FILE")

# Fonction pour afficher les informations détectées
show_detected_config() {
    echo "🔍 Configuration auto-détectée:"
    echo "   📄 Fichier compose: $COMPOSE_FILE"
    echo "   🌐 Réseau: $NETWORK_NAME"
    echo "   🚀 Service principal: $MAIN_SERVICE"
    
    # Afficher la liste des services disponibles
    local services=$(get_services_list "$COMPOSE_FILE")
    if [ -n "$services" ]; then
        echo "   📋 Services disponibles: $(echo "$services" | tr '\n' ' ' | sed 's/ $//')"
    fi
    echo ""
}

# Fonction pour obtenir les ports d'un service depuis le docker-compose
get_service_ports() {
    local compose_file="$1"
    local service_name="$2"
    local compose_path=$(get_compose_file_path "$compose_file")
    
    if [ -n "$compose_path" ] && [ -f "$compose_path" ] && [ -n "$service_name" ]; then
        # Extraire les ports depuis le fichier compose
        # Format attendu: "5002:5002" ou "5003:3306"
        grep -A 20 "^  ${service_name}:" "$compose_path" | grep -E "^\s+- \"[0-9]+:[0-9]+\"" | head -1 | sed 's/.*"\([0-9]*\):\([0-9]*\)".*/\1:\2/'
    fi
}

# Fonction pour obtenir le port host d'un service
get_service_host_port() {
    local compose_file="$1"
    local service_name="$2"
    local ports=$(get_service_ports "$compose_file" "$service_name")
    echo "$ports" | cut -d: -f1
}

# Fonction pour afficher les services disponibles avec leurs détails
show_available_services() {
    local compose_file="$1"
    
    echo "📋 Services disponibles dans $compose_file:"
    echo ""
    
    local services=$(get_services_list "$compose_file")
    if [ -z "$services" ]; then
        echo "❌ Aucun service trouvé ou erreur lors de la lecture du fichier compose."
        return 1
    fi
    
    for service in $services; do
        local ports=$(get_service_ports "$compose_file" "$service")
        if [ -n "$ports" ]; then
            local host_port=$(echo "$ports" | cut -d: -f1)
            local container_port=$(echo "$ports" | cut -d: -f2)
            echo "   • $service (Port: $host_port → $container_port)"
        else
            echo "   • $service (Ports internes uniquement)"
        fi
    done
    echo ""
}

# Fonction pour afficher les informations de connexion pour DEV
show_connection_info() {
    local compose_file="$1"
    
    echo "🔌 Informations de connexion (DEV):"
    echo ""
    
    local services=$(get_services_list "$compose_file")
    
    for service in $services; do
        local ports=$(get_service_ports "$compose_file" "$service")
        if [ -n "$ports" ]; then
            local host_port=$(echo "$ports" | cut -d: -f1)
            local container_port=$(echo "$ports" | cut -d: -f2)
            
            case "$service" in
                app|*-api)
                    echo "   🌐 Application Backend:"
                    echo "      URL: http://localhost:$host_port"
                    echo "      Port: $host_port → $container_port"
                    ;;
                *mongodb|mongo_*)
                    echo "   🍃 MongoDB Database:"
                    echo "      Host: localhost"
                    echo "      Port: $host_port"
                    echo "      Connection: mongodb://localhost:$host_port"
                    ;;
                *)
                    echo "   📦 $service:"
                    echo "      Port: $host_port → $container_port"
                    ;;
            esac
            echo ""
        fi
    done
}
