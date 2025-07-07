function getDbConfig(session) {
  if (!session || !session.user || !session.password) {
    throw new Error("Session invalide. Utilisateur non connecté.");
  }

  return {
    user: session.user,
    password: session.password,
    connectString: '10.102.109.105:1521/acc1'
  };
}

module.exports = { getDbConfig };
