const path = require('path');
const express = require('express');
const loginRouter = express.Router();

loginRouter.get("/login", (req, res, next) => {
    res.render('login/login',{error : null,title : 'Login'});
});

loginRouter.post("/login", (req, res, next) => {
    const { email, password } = req.body;
    console.log(email, password);
    console.log(req.body);
    //Database authentication simulation
    if (email === 'user@gmail.com' && password === '34567') {
        req.user = { email };
        return res.redirect('/');
    } else {
        return res.render('login/login',{error : 'Invalid email or password', title : 'Login'});
    }
});

loginRouter.get("/signup", (req, res, next) => {
    res.render('login/signup',{error : null, title : 'Signup'});
});

module.exports = loginRouter;