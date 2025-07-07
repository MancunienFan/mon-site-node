
const express = require('express');
const session = require('express-session');
const oracledb = require('oracledb');
const bodyParser = require('body-parser');
const path = require('path');
const { getNomPrenomClient } = require('./oracle/clientDB');
const app = express();

app.use(session({
  secret: 'clé-secrète',
  resave: false,
  saveUninitialized: false
}));

app.use(bodyParser.json({ limit: '20mb' }));
app.use(express.static('public'));
const { enregistrerPhotoDansCOUTCLI } = require('./oracle/clientDB');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use(express.static('public')); // sert login.html et index.html


app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ✅ Route POST pour connexion
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = await oracledb.getConnection({
      user: username,
      password: password,
      connectString: '10.102.109.105:1521/acc1'
    });

    await connection.close();

    // Stocker l'objet complet
    req.session.user = {
      username: username.toUpperCase(),
      password
    };

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Erreur login Oracle :", err);
    res.status(401).json({ error: "Échec de connexion Oracle" });
  }
});


app.post('/envoyer-photo', async (req, res) => {
  const { id, image } = req.body;
 
  try {
    await enregistrerPhotoDansCOUTCLI(id, image, req.session);
     res.send("✅ Photo insérée dans COUT_CLI !");
  } catch (err) {
    res.status(500).json({ error: 'Erreur insertion photo' });
  }
});



app.get('/clients/:id', async (req, res) => {
  const clientId = req.params.id;
  
  try {
    const data = await getNomPrenomClient(clientId, req.session);
    req.session.id = clientId; // Stocker l'ID du client dans la session
    if (!data) return res.status(404).send('Client non trouvé');

    res.json({
      nom: data.NM_CLI,
      prenom: data.PN_CLI,
      photo: data.PHOTO ? Buffer.from(data.PHOTO).toString('base64') : null,
      date: data.DT_PHOTO_PRISE
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});




// Activer EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Fichiers statiques (style.css, script.js)
app.use(express.static(path.join(__dirname, 'public')));

// Route principale
app.get('/', (req, res) => {
  const userName = req.session.user.username;
  res.render('index', { userName });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});


