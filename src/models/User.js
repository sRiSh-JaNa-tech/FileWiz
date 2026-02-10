const bcrypt = require('bcrypt');
const { getDb } = require("../utils/database");

// const users = [] // Temporary DataBase

class User {
    constructor(name, age, email, password) {
        this.name = name;
        this.age = age;
        this.email = email;
        this.password = password;
    }

    async create() {
        try {
            const hashed = await bcrypt.hash(this.password, 10);
            this.password = hashed;
            const db = getDb();
            return await db.collection("users").insertOne(this);
        } catch (err) {
            console.error("User creation failed", err);
            throw err;
        }
    }

    static async findByEmail(email) {
        const db = getDb();
        return await db.collection("users").findOne({ email });
    }

    static async login(email, password) {
        const db = getDb();
        const user = await db.collection("users").findOne({ email: email });
        if (!user) {
            return null;
        }
        const isValid = await bcrypt.compare(password, user.password);
        return isValid ? user : null;
    }
}

module.exports = User;

