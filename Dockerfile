# Étape 1 : Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copie les fichiers nécessaires à l'installation des dépendances
COPY package*.json ./
RUN npm install

# Copie tout le code
COPY . .

# Build TypeScript + postbuild
RUN npm run build

# Étape 2 : Run (plus léger)
FROM node:20-alpine

WORKDIR /app

# Copie uniquement les fichiers nécessaires à l’exécution
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose port
EXPOSE 3000

# Démarrage
CMD ["node", "dist/server.js"]
