const oracledb = require('oracledb');
const db = require('./oracle./db');

async function enregistrerPhotoDansCOUTCLI(id, base64Image, userName) {
  const connection = await db.getConnection();
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
    console.log("✅ Photo insérée dans COUT_CLI");
  } catch (err) {
    console.error("❌ Erreur insertion COUT_CLI :", err);
    throw err;
  } finally {
    await connection.close();
  }
}

async function getNomPrenomClient(id) {
  const connection = await db.getConnection();
  try {
    const result = await connection.execute(
      `SELECT NM_CLI, PN_CLI, PHOTO, DT_PHOTO_PRISE FROM COUT_CLI WHERE NO_DOSS = :id`,
      [id],
      {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
        fetchInfo: {
          "PHOTO": { type: oracledb.BUFFER }
        }
      }
    );
    return result.rows[0];
  } finally {
    await connection.close();
  }
}

module.exports = {
  enregistrerPhotoDansCOUTCLI,
  getNomPrenomClient
};
