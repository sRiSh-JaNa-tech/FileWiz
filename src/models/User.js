const bcrypt = require('bcrypt');

const users = [] // Temporary DataBase

class User {
    constructor(email, hashedPassword) {
        this.email = email;
        this.password = hashedPassword;
    }

    static async create(email, plainPassword) {
        const hashed = await bcrypt.hash(plainPassword, 10);
        const user = new User(email, hashed);
        users.push(user);
        return user;
    }

    static findByEmail(email) {
        return users.find(u => u.email === email);
    }

    async comparePassword(plainPassword) {
        return bcrypt.compare(plainPassword, this.password);
    }
}

module.exports = User;

