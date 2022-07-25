-- DROP TABLE signatures and profiles first
-- then drop table users
DROP TABLE signatures IF EXISTS;
DROP TABLE profiles IF EXISTS;
DROP TABLE users IF EXISTS;

-- create users table first
-- then create table commands for the others


CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first VARCHAR NOT NULL CHECK (first != ''),
    last VARCHAR NOT NULL CHECK (last != ''),
    email VARCHAR UNIQUE NOT NULL CHECK (email != ''),
    password VARCHAR NOT NULL,
    time TIMESTAMP
);

CREATE TABLE signatures (
    signature VARCHAR NOT NULL CHECK (signature != ''),
    time TIMESTAMP,
    id INTEGER NOT NULL PRIMARY KEY
    );

CREATE TABLE profiles (
    id_table SERIAL PRIMARY KEY,
    url VARCHAR,
    city VARCHAR,
    age INTEGER,
    id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
    ); 