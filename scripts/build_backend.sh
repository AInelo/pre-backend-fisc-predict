#!/bin/bash

KEY=$1

ssh -i $KEY -o StrictHostKeyChecking=no $USER_SERVEUR@$IP_SERVEUR << 'EOF'
  set -e
  echo "📦 Building Docker image for backend..."
  cd ~/bucket.urmaphalab.com
  git pull origin main
  docker build -t urmapha-backend .
EOF




# #!/bin/bash
# set -e

# KEY=$1
# USER_SERVEUR=${USER_SERVEUR}
# IP_SERVEUR=${IP_SERVEUR}

# # Modifier ici le domaine / dossier distant
# DOMAIN="victoriendougnon.com"

# echo "Build du projet Astro..."
# cd frontend
# npm install
# npm run build
# cd ..

# echo "Création du dossier distant /var/www/$DOMAIN (si pas existant)..."
# ssh -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${USER_SERVEUR}@${IP_SERVEUR} "mkdir -p /var/www/$DOMAIN"

# echo "Upload du contenu buildé vers /var/www/$DOMAIN..."
# rsync -avz --delete \
#   -e "ssh -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" \
#   ./frontend/dist/ \
#   ${USER_SERVEUR}@${IP_SERVEUR}:/var/www/$DOMAIN/
