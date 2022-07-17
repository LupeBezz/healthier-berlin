/* eslint-disable no-unused-vars */

const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:postgres:postgres@localhost:5432/signatures");

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - functions to export

module.exports.getSignature = () => {
    return db.query(`SELECT * FROM signatures`);
};

module.exports.addSignature = (first, last, signature, time) => {
    return db.query(
        `INSERT INTO signatures(first, last, signature, time) VALUES ($1, $2, $3, $4)`,
        [first, last, signature, time]
    );
};

module.exports.countSignatures = () => {
    return db.query(`SELECT COUNT(*) FROM signatures`);
};
