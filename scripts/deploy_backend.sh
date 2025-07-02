#!/bin/bash

KEY=$1

ssh -i $KEY -o StrictHostKeyChecking=no $USER_SERVEUR@$IP_SERVEUR << 'EOF'
  echo "🚀 Restarting backend container..."
  docker stop urmapha-backend || true
  docker rm urmapha-backend || true
  docker run -d --name urmapha-backend -p 3000:3000 urmapha-backend
EOF
