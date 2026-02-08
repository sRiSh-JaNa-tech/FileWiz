const jwt = require('jsonwebtoken');

const JWT_SECRET = "super_secret_jwt_key";

exports.signToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn : "15m"
    });
};

exports.verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
}

