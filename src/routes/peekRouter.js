const path = require('path');
const express = require('express');
const userRouter = express.Router();

const registeredHomes = [];

userRouter.get("/display", (req, res, next) => {
    res.render('peek/Peek');
});

module.exports = userRouter;