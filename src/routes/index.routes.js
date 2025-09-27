const { Router } = require("express");
const demo = require("./demo.routes");
const cartelera = require("./cartelera.routes");

const router = Router();

router.get("/", (req, res) =>
  res.json({ ok: true, msg: "API Examen – Node+SQL+Swagger" })
);

router.use("/demo", demo);
router.use("/cartelera", cartelera);  // ← aquí

module.exports = router;