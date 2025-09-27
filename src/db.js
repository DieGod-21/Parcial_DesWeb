// Conexión MSSQL + modo sin BD (Render)
const sql = require("mssql");
let poolPromise = null;

async function getPool() {
  if (process.env.USE_FAKE_DB === "true") return null; // desactiva BD
  if (!poolPromise) {
    const config = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT || 1433),
      options: { encrypt: true, trustServerCertificate: false },
      pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    };
    poolPromise = sql.connect(config).catch((e) => {
      poolPromise = null;
      throw e;
    });
  }
  return poolPromise;
}

module.exports = { sql, getPool };