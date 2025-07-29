#!/bin/bash
set -e

# Secrets
VPS_USER="${USER_SERVEUR:?}"
VPS_HOST="${IP_SERVEUR:?}"
VPS_SSH_KEY="${SSH_SERVEUR:?}"
DOCKER_USERNAME="${DOCKERHUB_USERNAME:?}"
DOCKER_TOKEN="${DOCKERHUB_TOKEN:?}"
IMAGE_NAME="backend-startax"


# Créer un fichier temporaire contenant la clé SSH
TMP_KEY_FILE=$(mktemp)
echo "$VPS_SSH_KEY" > "$TMP_KEY_FILE"
chmod 600 "$TMP_KEY_FILE"
REMOTE_FILE_TO_EXECUTE="pull_docker_img_"$IMAGE_NAME".sh"
REMOTE_FILE_PATH="/home/$VPS_USER/pull_docker_img_$IMAGE_NAME.sh"

echo "⏳ Test de connexion SSH..."
timeout 10s ssh -i "$TMP_KEY_FILE" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VPS_USER@$VPS_HOST" "echo '✅ Connexion SSH OK'"

echo "🔍 Vérification de l'existence du fichier distant..."

ssh -i "$TMP_KEY_FILE" -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VPS_USER@$VPS_HOST" "
  if [ -f '$REMOTE_FILE_PATH' ]; then
    echo '⚠️ Le fichier $REMOTE_FILE_PATH existe déjà et sera remplacé.'
    rm -f '$REMOTE_FILE_PATH'
  else
    echo '✅ Aucun fichier $REMOTE_FILE_PATH détecté. Prêt à copier.'
  fi
"



echo "📤 Copie du script de création d'environnement vers le serveur distant..."

scp -i "$TMP_KEY_FILE" \
  -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/dev/null \
  ./scripts/creation_env_prod.sh \
  "$VPS_USER@$VPS_HOST:/home/$VPS_USER/creation_env_prod.sh"





echo "📤 Copie du script vers le serveur distant..."

scp -i "$TMP_KEY_FILE" \
  -o StrictHostKeyChecking=no \
  -o UserKnownHostsFile=/dev/null \
  ./scripts/pull_docker_img.sh \
  "$VPS_USER@$VPS_HOST:$REMOTE_FILE_PATH"






echo "🔐 Exécution du script distant..."

ssh -i "$TMP_KEY_FILE" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" <<EOF
  export DOCKERHUB_USERNAME="$DOCKER_USERNAME"
  export DOCKERHUB_TOKEN="$DOCKER_TOKEN"
  cd /home/$VPS_USER

  chmod +x creation_env_prod.sh
  ./creation_env_prod.sh

  chmod +x $REMOTE_FILE_TO_EXECUTE
  ./$REMOTE_FILE_TO_EXECUTE
EOF



echo "🧹 Nettoyage du fichier clé SSH temporaire..."
rm -f "$TMP_KEY_FILE"
rm -f "$REMOTE_FILE_TO_EXECUTE"

echo "✅ Déploiement terminé."

