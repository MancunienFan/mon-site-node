// db.js
const oracledb = require('oracledb');
const connectionConfig = require('../dbConfig');

const dbConfig = {
  user: 'djez01',
  password: 'Bonjour123!',
  connectString: connectionConfig.connectString,
};

let pool;

async function init() {
  if (!pool) {
    pool = await oracledb.createPool(dbConfig);
    console.log("✅ Pool OracleDB créé.");
  }
}

async function getConnection() {
  if (!pool) {
    throw new Error("Le pool OracleDB n'est pas initialisé. Appelle init() d'abord.");
  }
  return await pool.getConnection();
}

async function close() {
  if (pool) {
    await pool.close();
    console.log("🛑 Pool OracleDB fermé.");
  }
}

module.exports = {
  init,
  getConnection,
  close
};
