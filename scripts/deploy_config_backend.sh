#!/bin/bash

KEY=$1

scp -i $KEY -o StrictHostKeyChecking=no nginx/bucket.urmaphalab.com.conf $USER_SERVEUR@$IP_SERVEUR:/etc/nginx/sites-available/bucket.urmaphalab.com.conf

ssh -i $KEY -o StrictHostKeyChecking=no $USER_SERVEUR@$IP_SERVEUR << 'EOF'
  echo "🔧 Deploying NGINX config..."
  sudo ln -sf /etc/nginx/sites-available/bucket.urmaphalab.com.conf /etc/nginx/sites-enabled/
  sudo nginx -t
EOF
