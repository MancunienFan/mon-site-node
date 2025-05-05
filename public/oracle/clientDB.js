const oracledb = require('oracledb');

async function enregistrerPhotoDansCOUTCLI(id, base64Image) {
  const connection = await oracledb.getConnection({
    user: 'fcou01',
    password: 'fcou011',
    connectString: '10.102.109.105:1521/acc1',
  });

  // Retirer le préfixe base64
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');

  try {
   /* await connection.execute(
      `INSERT INTO COUT_CLI (NO_DOSS, CO_TYP_CLI, , PHOTO) VALUES (:id, :type,:photo)`,
      { id: parseInt(id), type: 'I' ,photo: imageBuffer },
      { autoCommit: true }
    );*/
    await connection.execute(
      `UPDATE COUT_CLI
       SET PHOTO = :photo,
       DT_PHOTO_PRISE = SYSDATE
       WHERE NO_DOSS = :id`,
      { photo: imageBuffer, id: parseInt(id) },
      { autoCommit: true }
    );
    console.log("✅ Photo insérée dans la table COUT_CLI");
  } catch (err) {
    console.error("❌ Erreur lors de l'insertion dans COUT_CLI :", err);
    throw err;
  } finally {
    await connection.close();
  }
}

module.exports = { enregistrerPhotoDansCOUTCLI };
