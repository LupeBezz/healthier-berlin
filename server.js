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

const cookieSession = require("cookie-session");

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - data from other files

const db = require("./db");
//console.log(db);

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - serve static files

app.use(express.static("./public"));

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - requests

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - USE: cookie session

app.use(
    cookieSession({
        secret: "random secret",
        maxAge: 1000 * 60 * 60 * 24 * 14,
        sameSite: true,
    })
);

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /

app.get("/", (req, res) => {
    if (req.session.signatureId !== undefined) {
        res.redirect("/thanks");
    } else {
        res.render("intro", {});
        console.log("get request to / works");
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /petition

app.get("/petition", (req, res) => {
    if (req.session.signatureId !== undefined) {
        res.redirect("/thanks");
    } else {
        res.render("petition", {});
        console.log("get request to /petition works");
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - POST: /

app.post("/petition", (req, res) => {
    let time = new Date().toISOString().slice(0, 19).replace("T", " ");

    db.addSignature(req.body.first, req.body.last, req.body.signature, time)
        .then((results) => {
            console.log("addSignature worked!");
            // - - - - - - - - - - - cookie
            var userId = results.rows[0].id;
            //console.log(results.rows[0].id);
            req.session.signatureId = userId;
            //res.send(`signatureId: ${req.session.signatureId}`);

            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("error in addSignature", err);
            res.render("petition", { message: "All fields are necessary" });
        });
    console.log("post request to /petition works");
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /thanks

app.get("/thanks", (req, res) => {
    if (req.session.signatureId === undefined) {
        res.redirect("/petition");
    } else {
        var userSignature;

        db.getUserSignature(req.session.signatureId)
            .then((results) => {
                userSignature = results;
                //console.log(userSignature.rows[0].signature);
            })
            .catch((err) => {
                console.log("error in getUserSignature", err);
            });

        db.countSignatures()
            .then((results) => {
                const signersCount = results.rows[0];
                res.render("thanks", {
                    signers: signersCount.count,
                    displaySignature: userSignature.rows[0].signature,
                });
            })
            .catch((err) => {
                console.log("error in countSignatures", err);
                res.sendStatus(500);
            });
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /signers

// IMP: db is an object!!
// IMP: getSignature is a promise!!

app.get("/signers", (req, res) => {
    if (req.session.signatureId === undefined) {
        res.redirect("/petition");
    } else {
        db.getSignature()
            .then((results) => {
                const signersData = results.rows;
                res.render("signers", { signersData });
                //console.log(results.rows);
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
