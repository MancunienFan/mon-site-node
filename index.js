const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Sert les fichiers HTML/CSS/JS du dossier public
app.use(express.static('public'));

// Route principale
app.get('/', (req, res) => {
  res.send('<h1>Bienvenue sur mon site Node.js !</h1><p><a href="/camera.html">📷 Utiliser la webcam</a></p>');
});

app.listen(PORT, () => {
  console.log(`Serveur en ligne sur http://localhost:${PORT}`);
});
