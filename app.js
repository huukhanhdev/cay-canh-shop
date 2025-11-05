require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();

const PORT = process.env.PORT || 4000;

// ----- VIEW ENGINE -----
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ----- BODY PARSER -----
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ----- STATIC FILES -----
app.use(express.static(path.join(__dirname, "public")));

// =================== 404 ===================
app.use((req, res) => {
  res.status(404).send("Không tìm thấy trang 😢");
});

app.listen(PORT, () => {
  console.log(`🌿 Cây Cảnh Shop chạy tại http://localhost:${PORT}`);
});
