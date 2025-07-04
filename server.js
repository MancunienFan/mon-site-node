
const express = require('express');
const oracledb = require('oracledb');
const os = require('os');
const bodyParser = require('body-parser');
const path = require('path');
const { getNomPrenomClient } = require('.//oracle//clientDB');
const fs = require('fs');
const cors = require('cors');
const { closeConnection } = require('./oracle/dbSingleton');
const app = express();

const session = require('express-session');

app.use(session({
  secret: 'monSecretSuperSecurise',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // ✅ important si tu n’utilises pas HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 // 1h par exemple
  }
}));



app.use(cors());
app.use(bodyParser.json({ limit: '20mb' }));
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
const { enregistrerPhotoDansCOUTCLI } = require('./oracle/clientDB');

// Activer EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Fichiers statiques (style.css, script.js)
app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


app.get('/index', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login.html');
  }
   res.render('index', { userName: req.session.user })
});


app.post('/envoyer-photo', async (req, res) => {
  const { id, image, userName } = req.body;
 console.log("Session complète : ", req.session);

 // 
 /* if (!req.session.user || !req.session.user.username) {
    return res.status(401).json({ error: 'Utilisateur non connecté' });
  }*/
  
 console.log("cod emplo  connecté :", userName);

  try {
    await enregistrerPhotoDansCOUTCLI(id, image, userName);
    res.send("✅ Photo insérée dans COUT_CLI !");
  } catch (error) {
    res.status(500).send("❌ Erreur : " + error.message);
  }
});



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



app.get('/test-session', (req, res) => {
  console.log("Session reçue dans /test-session :", session);
  res.json(req.session);
});



process.on('SIGINT', async () => {
  console.log('🛑 Fermeture du serveur...');
  await closeConnection();
  process.exit();
});


// Route POST /connect
app.post('/connect', async (req, res) => {
  const { user, password, host, port, sid } = req.body;

  console.log("Données de connexion reçues :", { user, password, host, port, sid });

  const config = {
    user,
    password,
    connectString: `${host}:${port}/${sid}`
  };

  try {
    const connection = await oracledb.getConnection(config);
        
        req.session.user = user; // Stocker le nom d'utilisateur dans la session

console.log("Session après login :", req.session);
    await connection.close();

    // Écrire dans dbConfig.js
    const configContent = `
module.exports = {
  user: "${user}",
  password: "${password}",
  connectString: "${host}:${port}/${sid}"
};`;

    fs.writeFileSync(path.join(__dirname, 'dbConfig.js'), configContent);

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur de connexion Oracle :', error);
    res.json({ success: false, message: error.message });
  }
});



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});


