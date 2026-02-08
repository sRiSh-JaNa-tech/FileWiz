const path = require('path');
const express = require('express');
const router = express.Router();

const User = require('../models/User');

router.get("/login", (req, res, next) => {
    res.render('login/login', { error: null, title: 'Login' });
});

router.post("/login", async (req, res, next) => {
    const { email, password } = req.body;

    const user = User.findByEmail(email);
    if (!user) {
        return res.render("login/login", {
            error: "Invalid email or password",
            title: "Login"
        });
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
        return res.render("login/login", {
            error: "Invalid email or password",
            title: "Login"
        });
    }

    req.session.user = {
        email: user.email
    }

    res.redirect("/");
});

router.get("/signup", (req, res, next) => {
    res.render('login/signup', { error: null, title: 'Signup' });
});

router.post('/signup', async (req, res) => {
    const { email, password } = req.body;

    if (User.findByEmail(email)) {
        return res.render("login/signup", {
            error: "user already exists",
            title: "Signup"
        });
    }

    await User.create(email, password);
    res.redirect("/auth/login");
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect("/auth/login");
    })
});

module.exports = router;