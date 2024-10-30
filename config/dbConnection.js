const mysql = require("mysql");
const dotenv = require("dotenv").config();

const dbCon = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

dbCon.connect(function (err) {
  if (err) throw err;
  console.log("DB is Connected!");
});

module.exports = { dbCon, mysql };