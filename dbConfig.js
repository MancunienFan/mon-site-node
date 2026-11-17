module.exports = {
  "user": "djez01",
  "password": "Bonjour123!",
  "connectString": "(DESCRIPTION =\n      (LOAD_BALANCE = off)\n      (FAILOVER = on)\n      (ADDRESS = (PROTOCOL = TCP)(HOST = SPSSODL46.sso.msp.gouv.qc.ca)(PORT = 1521))\n      (ADDRESS = (PROTOCOL = TCP)(HOST = SPSSODL146.sso.msp.gouv.qc.ca)(PORT = 1521))\n      (CONNECT_DATA =\n        (SERVER = DEDICATED)\n        (SERVICE_NAME = pro1_primaire)\n        (FAILOVER_MODE =\n          (TYPE = SELECT)\n          (METHOD = BASIC)\n          (RETRIES = 180)\n          (DELAY = 5)\n        )\n      )\n    )"
};
