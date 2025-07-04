const oracledb = require('oracledb');

let connection;

async function getConnection() {
  if (!connection) {
    connection = await oracledb.getConnection({
      user: 'fcou01',
      password: 'fcou011',
      connectString: '10.102.109.105:1521/acc1'
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
