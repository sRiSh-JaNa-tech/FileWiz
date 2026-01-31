const path = require('path');
const rootDir = require('./utils/pathUtils');
const express = require('express');
const cookieparser = require('cookie-parser');


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(rootDir, 'public')));
app.use(cookieparser());
app.set('view engine', 'ejs');
app.set('views', path.join(rootDir, '/views'));

module.exports = app;