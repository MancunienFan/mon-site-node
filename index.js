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

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const users = require('./users');
const path = require('path');



app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'votre_clé_secrète',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static('public')); // pour servir login.html

// Middleware pour protéger les routes
function authMiddleware(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Page de connexion
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Traitement du login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);
  
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user.id;
    res.redirect('/'); // ou la page principale
  } else {
    res.send('Identifiants incorrects');
  }
});

// Déconnexion
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Page principale (protégée)
app.get('/capture', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'capture.html'));
});

// ... routes API à protéger de la même façon avec authMiddleware ...
/**
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});
 */