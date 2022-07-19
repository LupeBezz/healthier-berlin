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
    if (req.session.loginId !== undefined) {
        db.getUserSignature(req.session.loginId)
            .then(() => {
                res.redirect("/thanks");
            })
            .catch(() => {
                res.redirect("/petition");
            });
    } else {
        res.render("intro", {});
        console.log("get request to / works");
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /register - - - In progress

app.get("/register", (req, res) => {
    res.render("register", {});
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - POST: /register - - - In progress

// var hashedPassword;
// db.hashPassword(req.body.password)
//     .then((results) => {
//         hashedPassword = results;
//     })
//     .catch((err) => {
//         "Error in hash password";
//     });

app.post("/register", (req, res) => {
    let time = new Date().toISOString().slice(0, 19).replace("T", " ");
    if (
        req.body.first != "" &&
        req.body.last != "" &&
        req.body.email != "" &&
        req.body.password != ""
    ) {
        db.addUser(
            req.body.regFirst,
            req.body.regLast,
            req.body.regEmail,
            req.body.regPassword,
            time
        )
            .then((results) => {
                console.log("addUser worked!");
                // - - - - - - - - - - - - - - - - - - - - req. session.loginId > the user registered and stays logged in
                var loginUserId = results.rows[0].id;
                req.session.loginId = loginUserId;
                //res.send(`loginId: ${req.session.loginId}`);
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("error in addUser", err);
                res.render("register", {
                    message: "There was a problem, please try again!",
                });
            });
        console.log("post request to /register works");
    } else {
        res.render("register", {
            message: "All fields are necessary!",
        });
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /login - - - In progress

app.get("/login", (req, res) => {
    res.render("login", {});
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - POST: /login - - - In progress

app.post("/login", (req, res) => {
    //var re;
    db.getUserInfo(req.body.loginEmail)
        .then((results) => {
            //re = results;
            //console.log("results:", re);
            if (req.body.loginPassword === results.rows[0].password) {
                // - - - - - - - - - - - - - - - - - - - - req. session.loginId > the user successfully logged in
                req.session.loginId = results.rows[0].id;
                //res.send(`loginId: ${req.session.loginId}`);
                db.getUserSignature(req.session.loginId)
                    .then(() => {
                        res.redirect("/thanks");
                    })
                    .catch(() => {
                        res.redirect("/petition");
                    });
            }
        })
        .catch((err) => {
            console.log("error in login: ", err);
            console.log("req.body.loginEmail:", req.body.loginEmail);
            console.log("req.body.loginPassword:", req.body.loginPassword);

            res.render("login", {
                message: "Please try again!",
            });
        });
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /petition

app.get("/petition", (req, res) => {
    if (req.session.loginId !== undefined) {
        res.redirect("/thanks");
    } else {
        res.redirect("/register");
        console.log("get request to /petition works");
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - POST: /petition

app.post("/petition", (req, res) => {
    let time = new Date().toISOString().slice(0, 19).replace("T", " ");
    let userId = req.session.loginId; // ?????

    db.addSignature(req.body.signature, time, userId)
        .then((results) => {
            console.log("addSignature worked!");
            // - - - - - - - - - - - - - - - - - - - - req. session.signatureId > the user signed
            req.session.signatureId = userId;
            //res.send(`signatureId: ${req.session.signatureId}`);

            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("error in addSignature", err);
            res.render("petition", {
                message: "We really need your signature!",
            });
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

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - POST: /thanks (logout button)

app.post("/thanks", (req, res) => {
    var signoutButton = $("#signout-button");

    signoutButton.on("mouseup", () => {
        req.session.signatureId = null;
    });
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
