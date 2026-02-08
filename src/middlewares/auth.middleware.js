module.exports = function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/signup');
    }
    req.user = req.session.user;
    next();
}