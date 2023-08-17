const express = require("express");
const route = express.Router();
const {get, getTabla, getTotal, getTablaTotal} = require("../controllers/index")


route.get("/prueba", get);
route.get("/consulta", getTabla);
route.get("/", getTotal);
route.get("/total", getTablaTotal);

module.exports = route;