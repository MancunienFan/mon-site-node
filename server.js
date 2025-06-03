/*const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Sert les fichiers statiques de "public"
app.use(express.static(path.join(__dirname, 'public')));

// Exemple route API (clients)
const { getDerniersClients } = require('./public/oracle/clientDB');

app.get('/clients', async (req, res) => {
  try {
    const data = await getDerniersClients();
    res.json(data);
  } catch (err) {
    res.status(500).send('Erreur serveur');
  }
});

app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});
///////////// 
*/
const express = require('express');
const session = require('express-session');
const oracledb = require('oracledb');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json({ limit: '20mb' }));
app.use(express.static('public'));

const { enregistrerPhotoDansCOUTCLI } = require('.//oracle//clientDB');

app.post('/envoyer-photo', async (req, res) => {
  const { id, image,userName } = req.body;

  try {
    await enregistrerPhotoDansCOUTCLI(id, image, userName);
    res.send("✅ Photo insérée dans COUT_CLI !");
  } catch (error) {
    res.status(500).send("❌ Erreur : " + error.message);
  }
});
const { getNomPrenomClient } = require('./oracle/clientDB');


app.get('/clients/:id', async (req, res) => {
  const clientId = req.params.id;
  try {
    const data = await getNomPrenomClient(clientId);
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





app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
  secret: 'ma_clé_secrète',
  resave: false,
  saveUninitialized: false
}));

app.use(express.static('public')); // sert login.html et index.html


app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = await oracledb.getConnection({
      user: 'fcou01',
      password: 'fcou011',
      connectString: '10.102.109.105:1521/acc1'
    });

    const result = await connection.execute(
      `SELECT * FROM users WHERE username = :username AND password = :password`,
      [username, password]
    );

    await connection.close();

    if (result.rows.length > 0) {
      req.session.user = username;
      return res.redirect('/');
    } else {
      return res.send('Identifiants incorrects.');
    }
  } catch (err) {
    console.error('Erreur Oracle :', err);
    res.status(500).send('Erreur serveur.');
  }
});


const os = require('os');


// Activer EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Fichiers statiques (style.css, script.js)
app.use(express.static(path.join(__dirname, 'public')));

// Route principale
app.get('/', (req, res) => {
  const userName = os.userInfo().username;
  res.render('index', { userName });
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});


