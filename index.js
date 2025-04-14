const express = require('express');
const app = express();
const path = require('path');
const port = 3000;

// Sert les fichiers statiques (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Route pour afficher la page web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Lancer le serveur sur le port 3000
app.listen(port, () => {
  console.log(`Serveur en écoute sur http://localhost:${port}`);
});
