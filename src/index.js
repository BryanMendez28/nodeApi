require("dotenv").config();
const express  = require ("express");
const mysql = require("mysql2");
const conn = require("express-myconnection");
const cors = require("cors");
const route = require("./routes/index")


const app = express()
const PORT = process.env.PORT || 5001;
const dbConfig = {
    host: process.env.DB_HOST || "database-1.c2p2huynj5eb.us-east-2.rds.amazonaws.com",
    port: process.env.DB_PORT || "3306",
    user: process.env.DB_USER || "admin",
    password: process.env.DB_PASSWORD || "jY9cvMAXAiFLaDouKpdV",
    database: process.env.DB_NAME || "cliente16",
}


app.use(cors()); // Configura las políticas de acceso CORS

app.use(conn(mysql, dbConfig, "single"));
app.use(express.json())
app.use("/",route);

app.listen(PORT, () => {
    console.log(`server runing on port ${PORT}`)
})

