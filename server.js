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
const { enregistrerPhoto } = require('./public/oracle/clientDB');

const app = express();
app.use(bodyParser.json({ limit: '20mb' }));
app.use(express.static('public'));

const { enregistrerPhotoDansCOUTCLI } = require('./public/oracle/clientDB');

app.post('/envoyer-photo', async (req, res) => {
  const { id, image } = req.body;

  try {
    await enregistrerPhotoDansCOUTCLI(id, image);
    res.send("✅ Photo insérée dans COUT_CLI !");
  } catch (error) {
    res.status(500).send("❌ Erreur : " + error.message);
  }
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});






