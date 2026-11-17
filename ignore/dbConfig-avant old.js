
module.exports = {
  user: "djez01",
  password: "Bonjour123!",
  // PROD1.MSP
  connectString: `(DESCRIPTION =
      (LOAD_BALANCE = off)
      (FAILOVER = on)
      (ADDRESS = (PROTOCOL = TCP)(HOST = SPSSODL46.sso.msp.gouv.qc.ca)(PORT = 1521))
      (ADDRESS = (PROTOCOL = TCP)(HOST = SPSSODL146.sso.msp.gouv.qc.ca)(PORT = 1521))
      (CONNECT_DATA =
        (SERVER = DEDICATED)
        (SERVICE_NAME = pro1_primaire)
        (FAILOVER_MODE =
          (TYPE = SELECT)
          (METHOD = BASIC)
          (RETRIES = 180)
          (DELAY = 5)
        )
      )
    )`
};