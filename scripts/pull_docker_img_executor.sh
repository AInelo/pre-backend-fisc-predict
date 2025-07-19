#!/bin/bash
set -e

# Secrets
VPS_USER="${USER_SERVEUR:?}"
VPS_HOST="${IP_SERVEUR:?}"
VPS_SSH_KEY="${SSH_SERVEUR:?}"
DOCKER_USERNAME="${DOCKERHUB_USERNAME:?}"
DOCKER_TOKEN="${DOCKERHUB_TOKEN:?}"

# Créer un fichier temporaire contenant la clé SSH
TMP_KEY_FILE=$(mktemp)
echo "$VPS_SSH_KEY" > "$TMP_KEY_FILE"
chmod 600 "$TMP_KEY_FILE"

REMOTE_FILE="/home/$VPS_USER/pull_docker_img.sh"

echo "⏳ Test de connexion SSH..."
timeout 10s ssh -i "$TMP_KEY_FILE" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VPS_USER@$VPS_HOST" "echo '✅ Connexion SSH OK'"

echo "🔍 Vérification de l'existence du fichier distant..."

ssh -i "$TMP_KEY_FILE" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VPS_USER@$VPS_HOST" "
  if [ -f '$REMOTE_FILE' ]; then
    echo '⚠️ Le fichier $REMOTE_FILE existe déjà et sera remplacé.'
    rm -f '$REMOTE_FILE'
  else
    echo '✅ Aucun fichier $REMOTE_FILE détecté. Prêt à copier.'
  fi
"

echo "📤 Copie du script vers le serveur distant..."

scp -i "$TMP_KEY_FILE" \
  -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/dev/null \
  ./scripts/pull_docker_img.sh \
  "$VPS_USER@$VPS_HOST:$REMOTE_FILE"

echo "🔐 Exécution du script distant..."

ssh -i "$TMP_KEY_FILE" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" <<EOF
  export DOCKERHUB_USERNAME="$DOCKER_USERNAME"
  export DOCKERHUB_TOKEN="$DOCKER_TOKEN"
  cd /home/$VPS_USER
  chmod +x pull_docker_img.sh
  ./pull_docker_img.sh
EOF

echo "🧹 Nettoyage du fichier clé SSH temporaire..."
rm -f "$TMP_KEY_FILE"

echo "✅ Déploiement terminé."
















# #!/bin/bash
# set -e

# # Secrets
# VPS_USER="${USER_SERVEUR:?}"
# VPS_HOST="${IP_SERVEUR:?}"
# VPS_SSH_KEY="${SSH_SERVEUR:?}"
# DOCKER_USERNAME="${DOCKERHUB_USERNAME:?}"
# DOCKER_TOKEN="${DOCKERHUB_TOKEN:?}"

# # Créer un fichier temporaire contenant la clé SSH
# TMP_KEY_FILE=$(mktemp)
# echo "$VPS_SSH_KEY" > "$TMP_KEY_FILE"
# chmod 600 "$TMP_KEY_FILE"

# # Copier le script distant
# echo "📤 Envoi du script pull_docker_img.sh au serveur distant..."
# # scp -i "$TMP_KEY_FILE" -o StrictHostKeyChecking=no scripts/pull_docker_img.sh $VPS_USER@$VPS_HOST:/home/$VPS_USER/


# timeout 10s ssh -i "$TMP_KEY_FILE" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VPS_USER@$VPS_HOST" "echo '✅ Connexion SSH OK'"



# scp -i "$TMP_KEY_FILE" \
#   -o StrictHostKeyChecking=no \
#   -o UserKnownHostsFile=/dev/null \
#   ./scripts/pull_docker_img.sh \
#   "$VPS_USER@$VPS_HOST:/home/$VPS_USER/"
# # Assurez-vous que le script distant est exécutable

# # Exécuter le script distant
# echo "🔐 Connexion SSH et exécution du script sur le serveur distant..."
# ssh -i "$TMP_KEY_FILE" -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST <<EOF
#   export DOCKERHUB_USERNAME="$DOCKER_USERNAME"
#   export DOCKERHUB_TOKEN="$DOCKER_TOKEN"
#   cd /home/$VPS_USER
#   bash pull_docker_img.sh
# EOF

# # Nettoyage
# rm -f "$TMP_KEY_FILE"
