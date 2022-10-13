/* eslint-disable no-unused-vars */

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - database info

let dbUrl;

if (process.env.NODE_ENV === "production") {
    dbUrl = process.env.DATABASE_URL;
} else {
    const {
        DB_USER,
        DB_PASSWORD,
        DB_HOST,
        DB_PORT,
        DB_NAME,
    } = require("./secrets.json");
    dbUrl = `postgres:${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - middleware

// to hash passwords
const bcrypt = require("bcryptjs");

// to handle the database
const spicedPg = require("spiced-pg");
const db = spicedPg(dbUrl);

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - secrets middleware

let sessionSecret;

if (process.env.NODE_ENV == "production") {
    sessionSecret = process.env.SESSION_SECRET;
} else {
    sessionSecret = require("./secrets.json").SESSION_SECRET;
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - database functions

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET SIGNATURE

module.exports.getSignature = () => {
    return db.query(`SELECT * FROM signatures`);
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - PETITION PAGE

module.exports.addSignature = (signature, time, id) => {
    return db.query(
        `INSERT INTO signatures(signature, time, id) VALUES ($1, $2, $3)`,
        [signature, time, id]
    );
};

module.exports.countSignatures = () => {
    return db.query(`SELECT COUNT(*) FROM signatures`);
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - LOGIN PAGE

function hashPassword(password) {
    return bcrypt
        .genSalt()
        .then((salt) => {
            return bcrypt.hash(password, salt);
        })
        .then((hashedPassword) => {
            return hashedPassword;
        });
}

module.exports.addUser = (first, last, email, password, time) => {
    return hashPassword(password).then((hashedPassword) => {
        return db.query(
            `INSERT INTO users(first, last, email, password, time) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [first, last, email, hashedPassword, time]
        );
    });
};

module.exports.getUserSignature = (id) => {
    return db.query(`SELECT signature FROM signatures WHERE id = $1`, [id]);
};

module.exports.getUserInfo = (email) => {
    return db.query(`SELECT * FROM users WHERE email = $1`, [email]);
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - PROFILE PAGE

module.exports.addUserInfo = (url, city, age, id) => {
    return db.query(
        `INSERT INTO profiles(url, city, age, id) VALUES ($1, $2, $3, $4)`,
        [url || null, city, age || null, id]
    );
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - SIGNERS PAGE

module.exports.getSignersInfo = () => {
    return db.query(
        `SELECT * FROM signatures LEFT JOIN users ON signatures.id = users.id LEFT JOIN profiles ON signatures.id = profiles.id`
    );
};

module.exports.getCitySigners = (city) => {
    return db.query(
        `SELECT * FROM signatures LEFT JOIN users ON signatures.id = users.id LEFT JOIN profiles ON signatures.id = profiles.id WHERE city= $1`,
        [city]
    );
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - DELETE SIGNATURE

module.exports.deleteUserSignature = (id) => {
    return db.query(`DELETE FROM signatures WHERE id = $1`, [id]);
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - PROFILE-EDIT PAGE

module.exports.getInfoForEdit = (id) => {
    return db.query(
        `SELECT * FROM signatures FULL OUTER JOIN users ON signatures.id = users.id FULL OUTER JOIN profiles ON signatures.id = profiles.id WHERE signatures.id = $1`,
        [id]
    );
};

module.exports.editUserPass = (first, last, password, id) => {
    return hashPassword(password).then((hashedPassword) => {
        return db.query(
            `UPDATE users SET first=$1, last=$2, password=$3 WHERE users.id = $4`,
            [first, last, hashedPassword, id]
        );
    });
};

module.exports.editUserNoPass = (first, last, id) => {
    return db.query(`UPDATE users SET first=$1, last=$2 WHERE users.id = $3`, [
        first,
        last,
        id,
    ]);
};

module.exports.upsertUser = (url, city, age, id) => {
    return db.query(
        `INSERT INTO profiles(url, city, age, id) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO UPDATE SET url=$1, city=$2, age=$3 WHERE profiles.id=$4`,
        [url || null, city, age || null, id]
    );
};
