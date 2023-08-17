const express = require("express");
const route = express.Router();
const {get, getTabla} = require("../controllers/index")


route.get("/prueba", get);
route.get("/consulta", getTabla);

module.exports = route;