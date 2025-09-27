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

// Swagger
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.3",
    info: { title: "API Parcial – UMG", version: "1.0.0" },
    servers: [{ url: "http://localhost:" + (process.env.PORT || 3000) }],
  },
  apis: [path.join(__dirname, "routes/**/*.js")],
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/docs.json", (_req, res) => res.json(swaggerSpec));

// 👉 Redirección por defecto a Swagger
app.get("/", (_req, res) => res.redirect(302, "/docs"));

// Rutas API
app.use("/api", routes);

// Arranque
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 http://localhost:${port}`);
  console.log(`📘 Swagger UI: http://localhost:${port}/docs`);
  console.log(`📄 Swagger JSON: http://localhost:${port}/docs.json`);
});