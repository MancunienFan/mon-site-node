const oracledb = require('oracledb');
const dbConfig = require('./dbConfig');



async function enregistrerPhotoDansCOUTCLI(id, base64Image, userName) {
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
       DT_PHOTO_PRISE = SYSDATE,
      CO_EMPLO = :co_employe
       WHERE NO_DOSS = :id`,
      { photo: imageBuffer, id: parseInt(id), co_employe: userName },
      { autoCommit: true }, 
    );
    console.log("✅ Photo insérée dans la table COUT_CLI");
  } catch (err) {
    console.error("❌ Erreur lors de l'insertion dans COUT_CLI :", err);
    throw err;
  } finally {
    await connection.close();
  }
}



/*
async function getNomPrenomClient(clientId) {
  let connection;

  try {
    connection = await oracledb.getConnection(dbConfig);

    const result = await connection.execute(
      `SELECT NM_CLI, PN_CLI FROM CLIENTS WHERE NO_DOSS = :id`,
      [clientId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return result.rows[0]; // { NOM: 'Dupont', PRENOM: 'Jean' } par exemple
  } catch (error) {
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}*/
async function getNomPrenomClient(id) {
  let connection;
  
    connection = await oracledb.getConnection({
      user: 'fcou01',
      password: 'fcou011',
      connectString: '10.102.109.105:1521/acc1'
    });
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
    await connection.close();

    return result.rows[0];
   
  /*  const result = await connection.execute(
      `SELECT NM_CLI, PN_CLI, PHOTO FROM COUT_CLI WHERE NO_DOSS = :id`,
      [id],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) return null;
    return result.rows[0];

  } catch (err) {
    console.error('Erreur Oracle (getNomPrenomClient):', err);
    throw err;
  } finally {
    if (connection) await connection.close();
  }*/

  }

module.exports = {
  enregistrerPhotoDansCOUTCLI,
  getNomPrenomClient
};
