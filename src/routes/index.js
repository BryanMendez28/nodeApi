const express = require("express");
const route = express.Router();
const { getTabla, getTotal} = require("../controllers/index")



route.get("/consulta", getTabla);
route.get("/", getTotal);


module.exports = route;