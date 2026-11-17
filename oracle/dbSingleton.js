const oracledb = require('oracledb');
const connectionConfig = require('../dbConfig');

let connection;

async function getConnection() {
  if (!connection) {
    connection = await oracledb.getConnection({
      user: 'djez01',
      password: 'Bonjour123!',
      connectString: connectionConfig.connectString
    });
    console.log('🔌 Connexion Oracle établie (singleton)');
  }
  return connection;
}

async function closeConnection() {
  if (connection) {
    await connection.close();
    connection = null;
    console.log('🔌 Connexion Oracle fermée');
  }
}

module.exports = {
  getConnection,
  closeConnection
};
