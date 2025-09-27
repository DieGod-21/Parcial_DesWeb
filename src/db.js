// src/db.js
require("dotenv").config();
// src/db.js
const sql = require("mssql");

let poolPromise = null;
globalThis.USE_FAKE_DB_RUNTIME = false; // se activa solo si falla la BD

async function getPool() {
  // Si se pidió explícito por env o ya falló antes, trabaja sin BD
  if (process.env.USE_FAKE_DB === "true" || globalThis.USE_FAKE_DB_RUNTIME) {
    return null;
  }

  if (!poolPromise) {
    const config = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER,        // p.ej. xxxx.database.windows.net
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT || 1433),
      options: { encrypt: true, trustServerCertificate: false },
      pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
    };

    poolPromise = sql.connect(config).catch((e) => {
      console.error("❌ Error conectando a SQL:", e.message);
      // Activa fallback en memoria para TODA la app
      globalThis.USE_FAKE_DB_RUNTIME = true;
      poolPromise = null;
      return null; // devolvemos null para que las rutas detecten "sin BD"
    });
  }

  return poolPromise;
}

module.exports = { sql, getPool };