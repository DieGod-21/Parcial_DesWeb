// src/server.js
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

// Detecta la URL pública (útil en Render)
const PUBLIC_URL = process.env.PUBLIC_URL || "https://parcial-desweb.onrender.com";

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: { title: "API Parcial – UMG", version: "1.0.0" },
    // ⬇️ dos entradas: producción y local
    servers: [
      { url: PUBLIC_URL, description: "Render (prod)" },
      { url: "http://localhost:3000", description: "Local (dev)" },
    ],
  },
  apis: [path.join(__dirname, "routes/**/*.js")],
});

// Swagger UI + JSON sin caché
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/docs.json", (_req, res) => {
  res.setHeader("Cache-Control", "no-store");  // ⬅️ evita cache viejo
  res.json(swaggerSpec);
});

// Redirect raíz
app.get("/", (_req, res) => res.redirect(302, "/docs"));

// Rutas API
app.use("/api", routes);

// Arranque
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 http://localhost:${port}`);
});