const express = require("express");
const route = express.Router();
const { getTabla, getTotal, getReponer} = require("../controllers/index")



route.get("/consulta", getTabla);
route.get("/", getTotal);
route.get("/reponer", getReponer);



module.exports = route;

