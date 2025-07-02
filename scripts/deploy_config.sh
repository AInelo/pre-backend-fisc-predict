#!/bin/bash
set -e

KEY=$1
USER_SERVEUR=${USER_SERVEUR}
IP_SERVEUR=${IP_SERVEUR}

# Définir ici le domaine à utiliser (sans .conf)
DOMAIN="victoriendougnon.com"

echo "Suppression de l'ancienne config NGINX pour $DOMAIN si elle existe..."
ssh -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${USER_SERVEUR}@${IP_SERVEUR} "sudo rm -f /etc/nginx/sites-available/${DOMAIN}.conf /etc/nginx/sites-enabled/${DOMAIN}.conf"

echo "Copie du fichier de config NGINX pour $DOMAIN..."
scp -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ./nginx/${DOMAIN}.conf ${USER_SERVEUR}@${IP_SERVEUR}:/tmp/${DOMAIN}.conf

echo "Déplacement et création du lien symbolique sur le serveur pour $DOMAIN..."
ssh -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${USER_SERVEUR}@${IP_SERVEUR} << EOF
sudo mv /tmp/${DOMAIN}.conf /etc/nginx/sites-available/${DOMAIN}.conf
sudo ln -sf /etc/nginx/sites-available/${DOMAIN}.conf /etc/nginx/sites-enabled/${DOMAIN}.conf
EOF

echo "Configuration NGINX copiée et activée pour $DOMAIN."
