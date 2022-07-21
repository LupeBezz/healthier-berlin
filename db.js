/* eslint-disable no-unused-vars */

const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/signatures");
const bcrypt = require("bcryptjs");

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - functions to export

module.exports.getSignature = () => {
    return db.query(`SELECT * FROM signatures`);
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - functions used in the login page

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

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - function used in the profile-edit page to retrieve the user information

module.exports.getInfoForEdit = (id) => {
    return db.query(
        `SELECT * FROM signatures FULL OUTER JOIN users ON signatures.id = users.id FULL OUTER JOIN profiles ON signatures.id = profiles.id WHERE signatures.id = ${id}`
    );
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - function used to erase signature

module.exports.deleteUserSignature = (id) => {
    return db.query(`DELETE FROM signatures WHERE id = ${id}`);
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - functions used to edit the user info (users table)

module.exports.editUserPass = (first, last, password, id) => {
    return hashPassword(password).then((hashedPassword) => {
        return db.query(
            `UPDATE users SET first=$1, last=$2, password=$3 WHERE users.id = ${id}`,
            [first, last, hashedPassword]
        );
    });
};

module.exports.editUserNoPass = (first, last, id) => {
    return db.query(
        `UPDATE users SET first=$1, last=$2 WHERE users.id = ${id}`,
        [first, last]
    );
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - function used to edit the user info (profiles table)

module.exports.upsertUser = (url, city, age, id) => {
    return db.query(
        `INSERT INTO profiles(url, city, age) VALUES ($1, $2, $3) ON CONFLICT (url, city, age) DO UPDATE SET url=$1, city=$2, age=$3 WHERE profiles.id = ${id}`,
        [url || null, city, age || null]
    );
};
