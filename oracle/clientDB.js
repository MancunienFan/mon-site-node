const oracledb = require('oracledb');
const dbConfig = require('../dbConfig'); // sera défini après connexion

async function enregistrerPhotoDansCOUTCLI(connection, id, base64Image, userName) {

  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');

  try {
    await connection.execute(
      `UPDATE COUT_CLI
       SET PHOTO = :photo,
           DT_PHOTO_PRISE = SYSDATE,
           CO_EMPLO = :co_employe
       WHERE NO_DOSS = :id`,
      { photo: imageBuffer, id: parseInt(id), co_employe: userName },
      { autoCommit: true }
    );
    console.log("✅ Photo insérée dans la table COUT_CLI");
  } catch (err) {
    throw err;
  }
}

async function getNomPrenomClient(connection, id) {

  try {
    const result = await connection.execute(
      `SELECT NM_CLI, PN_CLI, PHOTO, DT_PHOTO_PRISE
       FROM COUT_CLI
       WHERE NO_DOSS = :id`,
      [id],
      {
        outFormat: require('oracledb').OUT_FORMAT_OBJECT,
        fetchInfo: {
          "PHOTO": { type: require('oracledb').BUFFER }
        }
      }
    );

    return result.rows[0] || null;
  } catch (err) {
    throw err;
  }
}
/*
async function getConnection() {
  try {
    return await oracledb.getConnection(dbConfig);
  } catch (err) {
    console.error('Erreur connexion Oracle:', err);
    throw err;
  }
}
*/

module.exports = {
  enregistrerPhotoDansCOUTCLI,
  getNomPrenomClient
};
