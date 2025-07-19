
#!/bin/bash
set -e

KEY=$1  # Clé SSH passée en argument
USER_SERVEUR=${USER_SERVEUR}
IP_SERVEUR=${IP_SERVEUR}

DOMAIN="startax-backend.totonlionel.com"
EMAIL="totonlionel@gmail.com"

echo "Vérification du certificat SSL pour $DOMAIN sur le serveur..."

ssh -i $KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${USER_SERVEUR}@${IP_SERVEUR} bash -c "'
# Vérifier si le certificat existe déjà
if sudo test -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem; then
  echo \"Certificat SSL présent pour $DOMAIN. Pas de création nécessaire.\"
else
  echo \"Pas de certificat SSL détecté pour $DOMAIN. Lancement de certbot...\"
  
  # Utiliser certbot standalone au lieu de --nginx pour éviter les problèmes de config
  sudo systemctl stop nginx
  sudo certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos -m $EMAIL
  sudo systemctl start nginx
fi
'"

echo "Script SSL terminé pour $DOMAIN."
