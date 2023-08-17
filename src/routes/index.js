const express = require("express");
const route = express.Router();
const {get, getTabla, getTotal} = require("../controllers/index")


route.get("/prueba", get);
route.get("/consulta", getTabla);
route.get("/", getTotal);

module.exports = route;