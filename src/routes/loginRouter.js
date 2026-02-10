const path = require('path');
const express = require('express');
const router = express.Router();

const User = require('../models/User');

router.get("/login", (req, res, next) => {
    res.render('login/login', { error: null, title: 'Login' });
});

router.post("/login", async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.login(email, password);
    if (!user) {
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
    const { name, age, email, password } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
        return res.render("login/signup", {
            error: "user already exists",
            title: "Signup"
        });
    }
    const user = new User(name, age, email, password);
    await user.create();
    res.redirect("/auth/login");
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect("/auth/login");
    })
});

module.exports = router;