const {FREE_USAGE_LIMIT} = require('../utils/constants');

module.exports = function usageLimit(req, res, next) {
    if(req.user){
        return next();
    }

    const currentUsage = Number(req.cookies.usageCount) || 0;
    console.log(currentUsage);
    
    if(currentUsage >= FREE_USAGE_LIMIT){
        return res.redirect('/signup?reason=limit');
    }

    res.cookie('usageCount', currentUsage + 1, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    next();
}