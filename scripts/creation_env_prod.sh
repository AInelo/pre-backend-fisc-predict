# #!/bin/bash
# set -e

# echo "📦 Génération du fichier .env.prod à partir des variables d’environnement..."

# cat <<EOL > .env.prod
# # ==== MongoDB ====
# MONGO_URL=${PROD_MONGO_URL:?}
# MONGO_DB_NAME=${PROD_MONGO_DB_NAME:?}

# # ==== Email ====
# EMAIL_HOST=${PROD_EMAIL_HOST:?}
# EMAIL_USER=${PROD_EMAIL_USER:?}
# EMAIL_PASS=${PROD_EMAIL_PASS:?}
# EMAIL_PORT=465
# EMAIL_SECURE=true

# # ==== Auth ====
# JWT_SECRET=${PROD_JWT_SECRET:?}
# JWT_EXPIRES_IN=7d

# # ==== Frontend ====
# FRONTEND_URL=${FRONTEND_URL:?}

# # ==== App ====
# PORT=5400
# EOL

# echo "✅ Fichier .env.prod créé avec succès."

































# #!/bin/bash
# set -e

# echo "📦 Exportation des variables d'environnement pour la prod..."

# export MONGO_URL="${PROD_MONGO_URL:?}"
# export MONGO_DB_NAME="${PROD_MONGO_DB_NAME:?}"

# export EMAIL_HOST="${PROD_EMAIL_HOST:?}"
# export EMAIL_USER="${PROD_EMAIL_USER:?}"
# export EMAIL_PASS="${PROD_EMAIL_PASS:?}"

# export JWT_SECRET="${PROD_JWT_SECRET:?}"
# export FRONTEND_URL="${FRONTEND_URL:?}"

# echo "🛠 Création du fichier .env.prod..."

# cat <<EOL > .env.prod
# # ==== MongoDB ====
# MONGO_URL=$MONGO_URL
# MONGO_DB_NAME=$MONGO_DB_NAME

# # ==== Email ====
# EMAIL_HOST=$EMAIL_HOST
# EMAIL_USER=$EMAIL_USER
# EMAIL_PASS=$EMAIL_PASS
# EMAIL_PORT=465
# EMAIL_SECURE=true

# # ==== Auth ====
# JWT_SECRET=$JWT_SECRET
# JWT_EXPIRES_IN=7d

# # ==== Frontend ====
# FRONTEND_URL=$FRONTEND_URL

# # ==== App ====
# PORT=5400
# EOL

# echo "✅ Fichier .env.prod créé avec succès."
