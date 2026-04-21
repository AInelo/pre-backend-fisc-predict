#!/bin/bash
set -e

KEY=$1  # On récupère la clé passée en argument
USER_SERVEUR=${USER_SERVEUR}
IP_SERVEUR=${IP_SERVEUR}

echo "Test de la configuration NGINX sur le serveur..."
ssh -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  ${USER_SERVEUR}@${IP_SERVEUR} \
  "sudo nginx -t"

echo "Reload de NGINX sur le serveur..."
ssh -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
  ${USER_SERVEUR}@${IP_SERVEUR} \
  "sudo systemctl reload nginx"

echo "NGINX rechargé, le site statique est actif."
