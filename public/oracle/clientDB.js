const oracledb = require("oracledb");
//const { getDerniersClients } = require('./clientDB');

// ⬇️ Configure ton Oracle Instant Client ici
oracledb.initOracleClient({ libDir: "C:\\Oracle\\instantclient_19_26" }); // mets ton bon chemin ici

// Fonction de récupération des 10 derniers dossiers client
async function getDerniersClients() {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: "fcou01",
      password: "fcou011",
      connectString: "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=10.102.109.105)(PORT=1521))(CONNECT_DATA=(SID=acc1)))"
    });

    const result = await connection.execute(
      /*`SELECT * FROM (
         SELECT * FROM COU_DOSS_PHYS ORDER BY DT_EXPD_CDSA DESC
       ) WHERE ROWNUM <= 10`*/
       `select * from Cout_DOSS_PHYS where ROWNUM <=10`
    );

    return result.rows;
  } catch (err) {
    console.error("Erreur Oracle :", err);
    return [];
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("Erreur à la fermeture :", err);
      }
    }
  }
}

module.exports = {
  getDerniersClients
};
