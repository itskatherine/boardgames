const express = require("express");
const { getCategories } = require("./controllers/app.controller");

const app = express();

app.get("/api/categories", getCategories);

module.exports = app;