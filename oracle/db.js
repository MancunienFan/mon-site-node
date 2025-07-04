// db.js
const oracledb = require('oracledb');

const dbConfig = {
  user: 'fcou01',
  password: 'fcou011',
  connectString: '10.102.109.105:1521/acc1',
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
