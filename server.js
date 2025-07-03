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

const { closeConnection } = require('./oracle/dbSingleton');

process.on('SIGINT', async () => {
  console.log('🛑 Fermeture du serveur...');
  await closeConnection();
  process.exit();
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});


