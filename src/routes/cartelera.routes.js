// src/routes/cartelera.routes.js
const express = require("express");
const router = express.Router();
const { sql, getPool } = require("../db");

const TABLE = "dbo.Cartelera_1890_22_3155";

// ====== Fallback en memoria ======
let FAKE_DATA = [];                 // almacenamiento temporal
const useFake = () =>
  process.env.USE_FAKE_DB === "true" || globalThis.USE_FAKE_DB_RUNTIME === true;

// Normaliza booleano para SQL Bit (soporta true/1/"true"/"1")
const toBit = (v) => {
  if (typeof v === "boolean") return v ? 1 : 0;
  if (typeof v === "number") return v === 1 ? 1 : 0;
  if (typeof v === "string") return v.trim().toLowerCase() === "true" || v.trim() === "1" ? 1 : 0;
  return 0;
};

/**
 * @swagger
 * tags:
 *   - name: Cartelera
 *     description: Endpoints de películas
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CarteleraItem:
 *       type: object
 *       required: [Title, Year, Type, Poster, Estado, description, Ubicacion]
 *       properties:
 *         imdbID: { type: string, example: "80000" }
 *         Title: { type: string, example: "Titanes del Atlantico" }
 *         Year: { type: string, example: "2013" }
 *         Type: { type: string, example: "Ciencia Ficcion" }
 *         Poster: { type: string, example: "https://demo/demoimages.png" }
 *         Estado: { type: boolean, example: true }
 *         description:
 *           type: string
 *           example: "La humanidad se transforma en robots gigantes…"
 *         Ubicacion: { type: string, example: "POPCINEMA" }
 */

/**
 * @swagger
 * /api/cartelera:
 *   get:
 *     summary: Serie III – Lista completa de películas
 *     tags: [Cartelera]
 *     responses:
 *       200: { description: Arreglo de películas }
 */
router.get("/", async (_req, res) => {
  try {
    if (useFake()) return res.json(FAKE_DATA);

    // Si getPool falla, trabajamos en memoria sin 500
    const pool = await getPool().catch((e) => {
      console.error("❌ Conexión SQL falló (GET):", e.message);
      globalThis.USE_FAKE_DB_RUNTIME = true;
      return null;
    });
    if (!pool) return res.json(FAKE_DATA);

    const q = `
      SELECT imdbID, Title, Year, Type, Poster, Estado, description, Ubicacion
      FROM ${TABLE}
      ORDER BY Title ASC;
    `;
    const { recordset } = await pool.request().query(q);
    res.json(recordset ?? []);
  } catch (err) {
    console.error("GET /cartelera error:", err);
    res.status(500).json({ codError: "500", msgRespuesta: "Error del servidor" });
  }
});

/**
 * @swagger
 * /api/cartelera:
 *   post:
 *     summary: Serie I – Inserta una película
 *     tags: [Cartelera]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CarteleraItem' }
 *           example:
 *             imdbID: "80000"
 *             Title: "Titanes del Atlantico"
 *             Year: "2013"
 *             Type: "Ciencia Ficcion"
 *             Poster: "https://demo/demoimages.png"
 *             Estado: true
 *             description: "La humanidad se transforma en robots gigantes…"
 *             Ubicacion: "POPCINEMA"
 *     responses:
 *       200: { description: '{"codError":"200","msgRespuesta":"Registro Insertado"}' }
 */
router.post("/", async (req, res) => {
  const b = req.body || {};
  const required = ["imdbID", "Title", "Year", "Type", "Poster", "Estado", "description", "Ubicacion"];
  const missing = required.filter((k) => b[k] === undefined);
  if (missing.length) {
    return res
      .status(400)
      .json({ codError: "400", msgRespuesta: "Solicitud inválida", camposFaltantes: missing });
  }

  try {
    if (useFake()) {
      if (FAKE_DATA.some((x) => x.imdbID == b.imdbID)) {
        return res.status(409).json({ codError: "409", msgRespuesta: "Registro duplicado" });
      }
      FAKE_DATA.push({ ...b, Estado: toBit(b.Estado) === 1 });
      return res.status(200).json({ codError: "200", msgRespuesta: "Registro Insertado" });
    }

    const pool = await getPool().catch((e) => {
      console.error("❌ Conexión SQL falló (POST):", e.message);
      globalThis.USE_FAKE_DB_RUNTIME = true;
      return null;
    });
    if (!pool) {
      // Inserta en memoria si no hay BD
      if (FAKE_DATA.some((x) => x.imdbID == b.imdbID)) {
        return res.status(409).json({ codError: "409", msgRespuesta: "Registro duplicado" });
      }
      FAKE_DATA.push({ ...b, Estado: toBit(b.Estado) === 1 });
      return res.status(200).json({ codError: "200", msgRespuesta: "Registro Insertado", modo: "memoria" });
    }

    await pool
      .request()
      .input("imdbID", sql.VarChar(20), String(b.imdbID))
      .input("Title", sql.NVarChar(200), b.Title)
      .input("Year", sql.VarChar(10), String(b.Year))
      .input("Type", sql.NVarChar(50), b.Type)
      .input("Poster", sql.NVarChar(500), b.Poster)
      .input("Estado", sql.Bit, toBit(b.Estado))
      .input("description", sql.NVarChar(sql.MAX), b.description)
      .input("Ubicacion", sql.NVarChar(100), b.Ubicacion)
      .query(
        `INSERT INTO ${TABLE}
         (imdbID, Title, Year, Type, Poster, Estado, description, Ubicacion)
         VALUES (@imdbID, @Title, @Year, @Type, @Poster, @Estado, @description, @Ubicacion);`
      );

    res.status(200).json({ codError: "200", msgRespuesta: "Registro Insertado" });
  } catch (err) {
    console.error("POST /cartelera error:", err);
    res.status(500).json({ codError: "500", msgRespuesta: "Error del servidor" });
  }
});

/**
 * @swagger
 * /api/cartelera:
 *   put:
 *     summary: Serie II – Actualiza por imdbID en querystring
 *     tags: [Cartelera]
 *     parameters:
 *       - in: query
 *         name: imdbID
 *         required: true
 *         schema: { type: string }
 *         description: id a actualizar (ej. 80000)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/CarteleraItem' }
 *     responses:
 *       200: { description: '{"codError":"200","msgRespuesta":"Registro Actualizado"}' }
 *       404: { description: '{"codError":"404","msgRespuesta":"Registro no encontrado"}' }
 *       400: { description: '{"codError":"400","msgRespuesta":"Solicitud inválida o mal formada"}' }
 */
router.put("/", async (req, res) => {
  const imdbID = String(req.query.imdbID || "").trim();
  if (!imdbID) {
    return res.status(400).json({ codError: "400", msgRespuesta: "Solicitud inválida: falta imdbID" });
  }

  const b = req.body || {};
  const required = ["Title", "Year", "Type", "Poster", "Estado", "description", "Ubicacion"];
  const missing = required.filter((k) => b[k] === undefined);
  if (missing.length) {
    return res
      .status(400)
      .json({ codError: "400", msgRespuesta: "Solicitud inválida o mal formada", camposFaltantes: missing });
  }

  try {
    if (useFake()) {
      const i = FAKE_DATA.findIndex((x) => String(x.imdbID) === imdbID);
      if (i === -1) return res.status(404).json({ codError: "404", msgRespuesta: "Registro no encontrado" });
      FAKE_DATA[i] = { ...FAKE_DATA[i], ...b, Estado: toBit(b.Estado) === 1 };
      return res.json({ codError: "200", msgRespuesta: "Registro Actualizado" });
    }

    const pool = await getPool().catch((e) => {
      console.error("❌ Conexión SQL falló (PUT):", e.message);
      globalThis.USE_FAKE_DB_RUNTIME = true;
      return null;
    });
    if (!pool) {
      const i = FAKE_DATA.findIndex((x) => String(x.imdbID) === imdbID);
      if (i === -1) return res.status(404).json({ codError: "404", msgRespuesta: "Registro no encontrado" });
      FAKE_DATA[i] = { ...FAKE_DATA[i], ...b, Estado: toBit(b.Estado) === 1 };
      return res.json({ codError: "200", msgRespuesta: "Registro Actualizado", modo: "memoria" });
    }

    const r = await pool
      .request()
      .input("imdbID", sql.VarChar(20), imdbID)
      .input("Title", sql.NVarChar(200), b.Title)
      .input("Year", sql.VarChar(10), String(b.Year))
      .input("Type", sql.NVarChar(50), b.Type)
      .input("Poster", sql.NVarChar(500), b.Poster)
      .input("Estado", sql.Bit, toBit(b.Estado))
      .input("description", sql.NVarChar(sql.MAX), b.description)
      .input("Ubicacion", sql.NVarChar(100), b.Ubicacion)
      .query(
        `UPDATE ${TABLE}
           SET Title=@Title, Year=@Year, Type=@Type, Poster=@Poster,
               Estado=@Estado, description=@description, Ubicacion=@Ubicacion
         WHERE imdbID=@imdbID;`
      );

    const rows = r.rowsAffected?.[0] ?? 0;
    if (rows === 0) return res.status(404).json({ codError: "404", msgRespuesta: "Registro no encontrado" });
    res.json({ codError: "200", msgRespuesta: "Registro Actualizado" });
  } catch (err) {
    console.error("PUT /cartelera error:", err);
    res.status(500).json({ codError: "500", msgRespuesta: "Error del servidor" });
  }
});

module.exports = router;