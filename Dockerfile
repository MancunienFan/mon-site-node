# Étape 1 : image de base officielle Node.js
FROM node:18

# Étape 2 : définir le répertoire de travail
WORKDIR /app

# Étape 3 : copier les fichiers de ton projet
COPY package*.json ./

# Étape 4 : installer les dépendances
RUN npm install

# Étape 5 : copier tout le reste
COPY . .

# Étape 6 : exposer le port (3000 si ton app écoute dessus)
EXPOSE 3000

# Étape 7 : lancer ton application
CMD ["npm", "start"]
