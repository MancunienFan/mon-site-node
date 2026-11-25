// À placer à côté de server.js, puis lancer : node verifier_connexion.js
// Lecture seule. Définir ORACLE_USER et ORACLE_PASSWORD pour ce processus.
'use strict';

const path = require('path');
const fs = require('fs');

async function main() {
  const projectDir = __dirname;
  const serverPath = path.join(projectDir, 'server.js');
  if (!fs.existsSync(serverPath)) {
    console.error('Place ce fichier dans le même dossier que le server.js que tu lances.');
    process.exitCode = 1;
    return;
  }

  let connection;
  let config;
  try {
    const configPath = require.resolve(path.join(projectDir, 'dbConfig.js'));
    config = require(configPath);
    const user = (process.env.ORACLE_USER || '').trim().toUpperCase();
    const password = process.env.ORACLE_PASSWORD;
    if (!user || !password) throw new Error('Définissez ORACLE_USER et ORACLE_PASSWORD avant le diagnostic.');

    console.log('\n--- DOSSIER ET FICHIERS CONTRÔLÉS ---');
    console.log('Serveur du projet :', serverPath);
    console.log('Configuration :', configPath);

    const target = String(config.connectString || '');
    const descriptorService = target.match(/\(SERVICE_NAME\s*=\s*([^)]+)\)/i);
    const easyConnect = target.match(/^(?:tcps?:\/\/)?([^\s\/:@]+)(?::\d+)?\/([^\s?]+)(?:\?.*)?$/i);
    const hosts = Array.from(target.matchAll(/\(HOST\s*=\s*([^)]+)\)/gi), match => match[1].trim());
    console.log('\n--- DESTINATION CONFIGURÉE ---');
    if (descriptorService) {
      console.log('Service demandé :', descriptorService[1].trim());
      console.log('Hôtes demandés :', hosts.join(', '));
    } else if (easyConnect) {
      console.log('Hôte demandé :', easyConnect[1]);
      console.log('Service demandé :', easyConnect[2]);
    } else {
      console.log('Format de connexion non affiché. La réponse Oracle ci-dessous fait foi.');
    }

    connection = await require('oracledb').getConnection({ user, password, connectString: config.connectString });
    const result = await connection.execute(
      `SELECT
         SYS_CONTEXT('USERENV', 'DB_NAME') AS BASE,
         SYS_CONTEXT('USERENV', 'DB_UNIQUE_NAME') AS BASE_UNIQUE,
         SYS_CONTEXT('USERENV', 'SERVICE_NAME') AS SERVICE,
         SYS_CONTEXT('USERENV', 'SERVER_HOST') AS SERVEUR,
         SYS_CONTEXT('USERENV', 'SESSION_USER') AS COMPTE_ORACLE,
         SYS_CONTEXT('USERENV', 'CURRENT_SCHEMA') AS SCHEMA_ACTIF
       FROM dual`
    );

    const row = result.rows && result.rows[0];
    if (!row) throw new Error('Oracle n’a retourné aucune identité de session.');
    const fields = ['BASE', 'BASE_UNIQUE', 'SERVICE', 'SERVEUR', 'COMPTE_ORACLE', 'SCHEMA_ACTIF'];
    console.log('\n--- RÉPONSE RÉELLE D’ORACLE ---');
    for (let i = 0; i < fields.length; i++) {
      const value = Array.isArray(row) ? row[i] : row[fields[i]];
      console.log(fields[i] + ' :', value == null ? '(non renseigné)' : value);
    }
    console.log('\nCe contrôle utilise un nouveau processus Node dans le dossier indiqué.');
    console.log('Il faut aussi vérifier que le navigateur utilise le serveur lancé depuis ce dossier.');
  } catch (error) {
    console.error('\nDIAGNOSTIC IMPOSSIBLE : vérifiez les identifiants et l’accès Oracle.');
    process.exitCode = 1;
  } finally {
    try {
      if (connection) await connection.close();
    } catch (_) {
      console.error('La connexion de diagnostic n’a pas pu être fermée proprement.');
      process.exitCode = 1;
    }
  }
}

main();
