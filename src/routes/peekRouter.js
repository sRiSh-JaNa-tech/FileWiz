const path = require('path');
const express = require('express');
const peekRouter = express.Router();

peekRouter.get("/display", (req, res, next) => {
    res.render('peek/Peek');
});

module.exports = peekRouter;