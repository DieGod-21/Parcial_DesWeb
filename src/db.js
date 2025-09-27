// src/db.js
require("dotenv").config();
const sql = require("mssql");

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,      // ej: localhost
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 1433,
  options: {
    encrypt: true,                  // Azure: true; local: true con trustServerCertificate
    trustServerCertificate: true,   // local SQL Server
  },
  pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
};

let pool;
async function getPool() {
  if (pool) return pool;
  pool = await sql.connect(config);
  return pool;
}

module.exports = { sql, getPool };