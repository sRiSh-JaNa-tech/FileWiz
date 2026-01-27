const path = require('path');
const express = require('express');
const userRouter = express.Router();

const registeredHomes = [];

userRouter.get("/", (req, res, next) => {
    console.log(registeredHomes);
    res.render('Home', {registeredHomes});
});

module.exports = userRouter;