const path = require('path');
const rootDir = require('./utils/pathUtils');
const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(rootDir, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(rootDir, '/views'));

module.exports = app;