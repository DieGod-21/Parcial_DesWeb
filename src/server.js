require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");
const routes = require("./routes/index.routes");

const app = express();
app.use(cors());
app.use(express.json());

// Swagger
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: { title: "API Parcial – UMG", version: "1.0.0" },
    servers: [{ url: "/" }], // URL relativa: sirve en localhost y Render
  },
  apis: [path.join(__dirname, "routes/**/*.js")],
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/docs.json", (_req, res) => res.json(swaggerSpec));

// Health
app.get("/", (_req, res) => {
  res.json({ ok: true, name: "API Parcial – Node+SQL+Swagger", ts: new Date().toISOString() });
});

// Rutas
app.use("/api", routes);

// 404
app.use((_req, res) => res.status(404).json({ codError: "404", msgRespuesta: "Recurso no encontrado" }));

// Error handler global
app.use((err, _req, res, _next) => {
  console.error("❌ [ERROR]", err?.message, err?.stack);
  const isProd = process.env.NODE_ENV === "production";
  res.status(500).json({
    codError: "500",
    msgRespuesta: "Error del servidor",
    ...(isProd ? {} : { detalle: err?.message }),
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ API escuchando en ${port}`));