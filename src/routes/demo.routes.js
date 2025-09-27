const { Router } = require("express");
const { getPool } = require("../db");
const router = Router();

/** @openapi
 * /demo/ping:
 *   get:
 *     summary: Salud del servicio
 *     responses: { 200: { description: OK } }
 */
router.get("/ping", (req, res) => res.json({ ok: true, now: new Date().toISOString() }));

/** @openapi
 * /demo/dbtime:
 *   get:
 *     summary: Hora del servidor SQL (prueba de conexión)
 *     responses: { 200: { description: OK } }
 */
router.get("/dbtime", async (req, res) => {
  try {
    const pool = await getPool();
    const r = await pool.request().query("SELECT GETDATE() AS serverTime");
    res.json({ ok: true, serverTime: r.recordset?.[0]?.serverTime });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

/** @openapi
 * /demo/tablas:
 *   get:
 *     summary: Lista tablas visibles en la base de datos
 *     responses: { 200: { description: OK } }
 */
router.get("/tablas", async (req, res) => {
  try {
    const pool = await getPool();
    const q = `SELECT TABLE_SCHEMA, TABLE_NAME
               FROM INFORMATION_SCHEMA.TABLES
               WHERE TABLE_TYPE='BASE TABLE'
               ORDER BY TABLE_SCHEMA, TABLE_NAME`;
    const r = await pool.request().query(q);
    res.json({ ok: true, count: r.recordset.length, tables: r.recordset });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
