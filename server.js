/* eslint-disable no-unused-vars */

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - functionality

const express = require("express");
const app = express();

const hb = require("express-handlebars");
app.engine("handlebars", hb.engine());
app.set("view engine", "handlebars");

const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - data from other files

const db = require("./db");
console.log(db);

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - serve static files

app.use(express.static("./public"));

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - requests

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /

app.get("/", (req, res) => {
    if (req.cookies.signed === "1") {
        res.redirect("/thanks");
    } else {
        res.render("intro", {});
        console.log("get request to / works");
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /petition

app.get("/petition", (req, res) => {
    if (req.cookies.signed === "1") {
        res.redirect("/thanks");
    } else {
        res.render("petition", {});
        console.log("get request to /petition works");
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - POST: /

app.post("/petition", (req, res) => {
    //console.log(data);
    let time = new Date(Date.now());

    db.addSignature(req.body.first, req.body.last, req.body.signature, time)
        .then(() => {
            console.log("addSignature worked!");

            res.cookie("signed", 1);
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("error in addSignature", err);
            res.render("petition", { message: "All fields are necessary" });
        });
    console.log("post request to /petition works");
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - USE: check cookie > necessary????

app.use((req, res, next) => {
    if (req.cookies.signed === "1") {
        next();
    } else {
        res.redirect("/petition");
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /thanks

app.get("/thanks", (req, res) => {
    if (!req.cookies.signed === "1") {
        res.redirect("/petition");
    } else {
        db.countSignatures()
            .then((results) => {
                const signersCount = results.rows[0];
                res.render("thanks", { signers: signersCount.count });
            })
            .catch((err) => {
                console.log(err);
                res.sendStatus(500);
            });
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /signers

// IMP: db is an object!!
// IMP: getSignature is a promise!!

app.get("/signers", (req, res) => {
    if (!req.cookies.signed === "1") {
        res.redirect("/petition");
    } else {
        db.getSignature()
            .then((results) => {
                const signersData = results.rows;
                res.render("signers", { signersData });
                console.log(results.rows);
            })
            .catch((err) => {
                console.log(err);
                res.sendStatus(500);
            });
        console.log("get request to /signers works");
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - listen to the port

const PORT = 8080;

app.listen(PORT, () => {
    console.log("petition server is listening in PORT: ", PORT);
});
