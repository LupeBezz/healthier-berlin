/* eslint-disable no-unused-vars */

const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/signatures");
const bcrypt = require("bcryptjs");

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - functions to export

module.exports.getSignature = () => {
    return db.query(`SELECT * FROM signatures`);
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - functions used in the login page

module.exports.hashPassword = (password) => {
    bcrypt
        .genSalt()
        .then((salt) => {
            return bcrypt.hash(password, salt);
        })
        .then((result) => {
            result; //extra return here??
        });
};

module.exports.addUser = (first, last, email, password, time) => {
    return db.query(
        `INSERT INTO users(first, last, email, password, time) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [first, last, email, password, time]
    );
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - function used in the petition page (id comes from table "Users")

module.exports.addSignature = (signature, time, id) => {
    return db.query(
        `INSERT INTO signatures(signature, time, id) VALUES ($1, $2, $3)`,
        [signature, time, id]
    );
};

module.exports.countSignatures = () => {
    return db.query(`SELECT COUNT(*) FROM signatures`);
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - function used in the login page to check if the user signed

module.exports.getUserSignature = (id) => {
    return db.query(`SELECT signature FROM signatures WHERE id = ${id}`);
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - function used in the login page to check the registered information

module.exports.getUserInfo = (email) => {
    return db.query(`SELECT * FROM users WHERE email='${email}'`);
    //return db.query(`SELECT * FROM users WHERE email = "${email}"`);
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - function used in the profile page to insert info to table "profiles"

module.exports.addUserInfo = (url, city, age, id) => {
    return db.query(
        `INSERT INTO profiles(url, city, age, id) VALUES ($1, $2, $3, $4)`,
        [url || null, city, age || null, id]
    );
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - function used in the signers page to retrieve the signers

module.exports.getSignersInfo = () => {
    return db.query(
        `SELECT * FROM signatures LEFT JOIN users ON signatures.id = users.id LEFT JOIN profiles ON signatures.id = profiles.id`
    );
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - function used in the signers page to retrieve the signers from the same city

module.exports.getCitySigners = (city) => {
    return db.query(
        `SELECT * FROM signatures LEFT JOIN users ON signatures.id = users.id LEFT JOIN profiles ON signatures.id = profiles.id WHERE city= '${city}'`
    );
};
