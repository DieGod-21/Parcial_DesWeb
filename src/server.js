// src/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");

const routes = require("./routes/index.routes");

const app = express();
app.disable("x-powered-by");
app.use(cors());
app.use(express.json());

// ===== Swagger =====
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: { title: "API Parcial – UMG", version: "1.0.0" },
    // URL relativa para que funcione en localhost y en Render
    servers: [{ url: "/" }],
  },
  // Busca comentarios JSDoc en todas tus rutas
  apis: [path.join(__dirname, "routes/**/*.js")],
});

// UI y spec JSON
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/docs.json", (_req, res) => res.json(swaggerSpec));

// Health explícito (para monitores)
app.get("/healthz", (_req, res) => {
  res.json({
    ok: true,
    name: "API Parcial – Node+SQL+Swagger",
    ts: new Date().toISOString(),
  });
});

// Redirige la raíz al Swagger UI (útil en Render)
app.get("/", (_req, res) => res.redirect("/docs"));

// ===== Rutas de tu API =====
app.use("/api", routes);

// 404
app.use((_req, res) =>
  res.status(404).json({ codError: "404", msgRespuesta: "Recurso no encontrado" })
);

// Manejador de errores
app.use((err, _req, res, _next) => {
  console.error("❌ [ERROR]", err?.message, err?.stack);
  const isProd = process.env.NODE_ENV === "production";
  res.status(500).json({
    codError: "500",
    msgRespuesta: "Error del servidor",
    ...(isProd ? {} : { detalle: err?.message }),
  });
});

// Arranque
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ API escuchando en ${port}`));