const fs = require('fs');
const path = require('path');
const oracledb = require('oracledb');

const sqlDir = path.join(__dirname, '..', 'docs', 'sommaire-depot');
const sql = (name) => fs.readFileSync(path.join(sqlDir, name), 'utf8').trim().replace(/;\s*$/, '');

async function getLieux(connection) {
  const result = await connection.execute(sql('liste_lieux_depot.sql'), {}, { outFormat: oracledb.OUT_FORMAT_OBJECT });
  return result.rows;
}

async function getSommaire(connection, date_recu, endroit) {
  const result = await connection.execute(sql('sommaire_depot.sql'), {
    date_recu: { val: date_recu, type: oracledb.STRING },
    endroit: { val: endroit, type: oracledb.STRING }
  }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
  return result.rows;
}

module.exports = { getLieux, getSommaire };
