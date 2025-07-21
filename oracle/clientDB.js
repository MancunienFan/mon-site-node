const oracledb = require('oracledb');
const { getDbConfig } = require('./dbConfig');


async function getConnection(session) {
  const dbConfig = getDbConfig(session); // <- session contient { user, password }
  return await oracledb.getConnection(dbConfig);
}



async function enregistrerPhotoDansCOUTCLI(id, base64Image, session) {

  let connection;
  if (!session.user || !session.user.username || !session.user.password) {
    throw new Error("Session invalide : informations utilisateur manquantes");
  }

  connection = await oracledb.getConnection({
    user: session.user.username,
    password: session.user.password,
    connectString: '10.102.109.105:1521/acc1'
  });

  if (!connection) throw new Error("Connexion Oracle échouée");

  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
  const imageBuffer = Buffer.from(base64Data, 'base64');

  try {
    await connection.execute(
      `UPDATE COUT_CLI
   SET PHOTO = :photo,
       DT_PHOTO_PRISE = SYSDATE,
       CO_EMPLO = :co_employe,
       DTM = SYSDATE

   WHERE NO_DOSS = :id`,
      {
        photo: { val: imageBuffer, type: oracledb.BLOB },
        id: parseInt(id),
        co_employe: session.user.username
      },
      { autoCommit: true }
    );

    console.log("✅ Photo insérée");
  } catch (err) {
    console.error("❌ Erreur SQL :", err);
    throw err;
  } finally {
    await connection.close();
  }
}


async function getNomPrenomClient(id, session) {
  let connection;

  if (!session.user || !session.user.username || !session.user.password) {
    throw new Error("Session invalide : informations utilisateur manquantes");
  }

  connection = await oracledb.getConnection({
    user: session.user.username,
    password: session.user.password,
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

}

module.exports = {
  getConnection,
  enregistrerPhotoDansCOUTCLI,
  getNomPrenomClient
};
