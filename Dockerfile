# Dockerfile
FROM node:20-alpine

# Dossier de travail dans le container
WORKDIR /app

# Copie les fichiers package
COPY package*.json ./

# Installe les dépendances
RUN npm install

# Copie tous les fichiers sources
COPY . .

# Build TypeScript
RUN npm run build && npm run postbuild

# Expose le port que ton app utilise
EXPOSE 5001

# Commande de démarrage
CMD ["node", "dist/server.js"]
