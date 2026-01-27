module.exports = function isAuthenticated(req,res,next){
    if(!req.user){
        return res.redirect('/login');
    }
    next();
}