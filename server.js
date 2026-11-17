const express = require('express');
const oracledb = require('oracledb');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const dbConfig = require('./dbConfig');
const { getNomPrenomClient, enregistrerPhotoDansCOUTCLI } = require('./oracle/clientDB');
const { closeConnection } = require('./oracle/dbSingleton');

const app = express();
app.use(session({
  secret: 'monSecretSuperSecurise',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 1000 * 60 * 60 }
}));
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

function afficherLogin(req, res) {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
}

function requireSession(req, res, next) {
  if (req.session.user) return next();
  return res.status(401).json({ error: 'Votre session a expiré. Veuillez vous reconnecter.' });
}

app.get('/', afficherLogin);
app.get('/login', afficherLogin);
app.get('/login.html', afficherLogin);
app.get('/index', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.set('Cache-Control', 'no-store');
  res.render('index', { userName: req.session.user });
});
app.get('/index.html', (req, res) => res.redirect('/index'));

// Seuls les identifiants viennent du formulaire : la destination reste dans dbConfig.js.
app.post('/connect', async (req, res) => {
  const user = typeof req.body.user === 'string' ? req.body.user.trim() : '';
  const password = req.body.password;
  if (!user || typeof password !== 'string' || !password) {
    return res.status(400).json({ success: false, message: 'Saisissez votre nom d’utilisateur et votre mot de passe.' });
  }

  let connection;
  try {
    connection = await oracledb.getConnection({ user, password, connectString: dbConfig.connectString });
    await connection.close();
    connection = null;
    req.session.user = user;
    req.session.save((error) => {
      if (error) {
        return res.status(500).json({ success: false, message: 'Impossible d’ouvrir la session. Veuillez réessayer.' });
      }
      return res.json({ success: true });
    });
  } catch (error) {
    console.error('Connexion Oracle refusée :', error.message);
    return res.status(error.errorNum === 1017 ? 401 : 500).json({ success: false, message: error.message });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (error) { console.error('Fermeture Oracle :', error.message); }
    }
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy((error) => {
    if (error) return res.status(500).send('Impossible de fermer la session.');
    res.clearCookie('connect.sid');
    return res.redirect('/login');
  });
});

app.get('/clients/:id', requireSession, async (req, res) => {
  try {
    const data = await getNomPrenomClient(req.params.id);
    if (!data) return res.status(404).send('Client non trouvé');
    return res.json({
      nom: data.NM_CLI,
      prenom: data.PN_CLI,
      photo: data.PHOTO ? Buffer.from(data.PHOTO).toString('base64') : null,
      date: data.DT_PHOTO_PRISE
    });
  } catch (error) {
    console.error('Lecture du client :', error.message);
    return res.status(500).send('Erreur serveur');
  }
});

app.post('/envoyer-photo', requireSession, async (req, res) => {
  const { id, image } = req.body;
  try {
    await enregistrerPhotoDansCOUTCLI(id, image, req.session.user);
    return res.send('✅ Photo insérée dans COUT_CLI !');
  } catch (error) {
    return res.status(500).send('❌ Erreur : ' + error.message);
  }
});

app.get('/test-session', (req, res) => res.json({ user: req.session.user || null }));
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

function startServer() {
  const explicitPort = Boolean(process.env.PORT);
  let port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error('PORT doit être un entier entre 0 et 65535.');
  }
  const server = require('http').createServer(app);
  server.on('listening', () => {
    const loginUrl = `http://localhost:${server.address().port}/login`;
    console.log(`Serveur lancé sur ${loginUrl}`);
    if (process.argv.includes('--open-login') && process.platform === 'win32') {
      const { exec } = require('child_process');
      exec(`start "" msedge "${loginUrl}"`, { windowsHide: true }, (error) => {
        if (error) console.error(`Ouvre cette adresse dans ton navigateur : ${loginUrl}`);
      });
    }
  });
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE' && !explicitPort && port < 3010) {
      console.log(`Le port ${port} est déjà utilisé. Essai sur le port ${port + 1}...`);
      port += 1;
      server.listen(port);
      return;
    }
    if (error.code === 'EADDRINUSE') {
      console.error(`Le port ${port} est déjà utilisé. Arrête le serveur déjà ouvert avant de relancer photo.bat.`);
    } else {
      console.error('Impossible de démarrer le serveur :', error.message);
    }
    process.exitCode = 1;
  });
  process.once('SIGINT', async () => {
    try { await closeConnection(); } finally { process.exit(0); }
  });
  server.listen(port);
  return server;
}

if (require.main === module) startServer();
module.exports = { app, startServer };
