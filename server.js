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

// req.session.loginId > if the user logged in successfully

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
    //console.log("req.session.loginId: ", req.session.loginId);

    if (req.session.loginId) {
        db.getUserSignature(req.session.loginId)
            .then((result) => {
                if (result.rows.length === 0) {
                    console.log("logged in but no signature");
                    res.redirect("/petition");
                } else {
                    console.log("logged in + signature");
                    res.redirect("/thanks");
                }
            })
            .catch((err) => {
                console.log("error in getUserSignature", err);
            });
    } else {
        console.log("not logged in and no signature");
        console.log("get request to / works");
        res.render("intro", {});
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /register

app.get("/register", (req, res) => {
    //console.log("req.session.loginId: ", req.session.loginId);

    if (req.session.loginId) {
        db.getUserSignature(req.session.loginId)
            .then((result) => {
                if (result.rows.length === 0) {
                    console.log("logged in but no signature");
                    res.render("register", {});
                } else {
                    console.log("logged in + signature");
                    res.redirect("/thanks");
                }
            })
            .catch((err) => {
                console.log("error in getUserSignature", err);
            });
    } else {
        console.log("not logged in and no signature");
        console.log("get request to /register works");
        res.render("register", {});
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - POST: /register

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
        !req.body.regFirst ||
        !req.body.regLast ||
        !req.body.regEmail ||
        !req.body.regPassword
    ) {
        res.render("register", {
            message: "All fields are necessary!",
        });
    } else {
        //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - sanitize email
        req.body.regEmail = req.body.regEmail.toLowerCase();

        //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - sanitize first
        req.body.regFirst =
            req.body.regFirst.charAt(0).toUpperCase() +
            req.body.regFirst.slice(1).toLowerCase();

        //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - sanitize last

        req.body.regLast =
            req.body.regLast.charAt(0).toUpperCase() +
            req.body.regLast.slice(1).toLowerCase();

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
                res.redirect("/profile");
            })
            .catch((err) => {
                console.log("error in addUser", err);
                res.render("register", {
                    message: "There was a problem, please try again!",
                });
            });
        console.log("post request to /register works");
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /profile

app.get("/profile", (req, res) => {
    //console.log("req.session.loginId: ", req.session.loginId);

    if (req.session.loginId) {
        db.getUserSignature(req.session.loginId)
            .then((result) => {
                if (result.rows.length === 0) {
                    console.log("logged in but no signature");
                    res.render("profile", {});
                } else {
                    console.log("logged in + signature");
                    res.redirect("/thanks");
                }
            })
            .catch((err) => {
                console.log("error in getUserSignature", err);
            });
    } else {
        console.log("not logged in and no signature");
        console.log("get request to /register works");
        res.render("register", {});
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - POST: /profile

app.post("/profile", (req, res) => {
    if (
        req.body.profileHomepage ||
        req.body.profileCity ||
        req.body.profileAge ||
        req.session.loginId
    ) {
        //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - sanitize city
        req.body.profileCity =
            req.body.profileCity.charAt(0).toUpperCase() +
            req.body.profileCity.slice(1).toLowerCase();
        //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - sanitize url

        //console.log("before san: ", req.body.profileHomepage);

        if (!req.body.profileHomepage.startsWith("http")) {
            req.body.profileHomepage = "http://" + req.body.profileHomepage;
        }
        //console.log("after san: ", req.body.profileHomepage);

        //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - sanitize age
        db.addUserInfo(
            req.body.profileHomepage,
            req.body.profileCity,
            req.body.profileAge,
            req.session.loginId
        )

            .then((results) => {
                console.log("addUserInfo worked!");
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("error in addUserInfo", err);
            });
        console.log("post request to /profile works");
    } else {
        res.redirect("/petition");
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /login

app.get("/login", (req, res) => {
    //console.log("req.session.loginId: ", req.session.loginId);

    if (req.session.loginId) {
        db.getUserSignature(req.session.loginId)
            .then((result) => {
                if (result.rows.length === 0) {
                    console.log("logged in but no signature");
                    res.redirect("/petition");
                } else {
                    console.log("logged in + signature");
                    res.redirect("/thanks");
                }
            })
            .catch((err) => {
                console.log("error in getUserSignature", err);
            });
    } else {
        console.log("not logged in and no signature");
        console.log("get request to /login works");
        res.render("login", {});
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - POST: /login - - - In progress

app.post("/login", (req, res) => {
    if (!req.body.loginEmail || !req.body.loginPassword) {
        res.render("login", {
            message: "All fields are necessary!",
        });
    } else {
        db.getUserInfo(req.body.loginEmail)
            .then((results) => {
                console.log("results:", results);
                if (results.rows.length === 0) {
                    console.log("email not found");
                    res.render("login", {
                        message:
                            "The login information is not right, please try again",
                    });
                } else {
                    console.log("email found");
                    if (req.body.loginPassword === results.rows[0].password) {
                        // - - - - - - - - - - - - - - - - - - - - req. session.loginId > the user successfully logged in
                        req.session.loginId = results.rows[0].id;
                        //res.send(`loginId: ${req.session.loginId}`);
                        db.getUserSignature(req.session.loginId)
                            .then((result) => {
                                if (result.rows.length === 0) {
                                    console.log("logged in but no signature");
                                    res.redirect("/petition");
                                } else {
                                    console.log("logged in + signature");
                                    res.redirect("/thanks");
                                }
                            })
                            .catch((err) => {
                                console.log("error in getUserSignature", err);
                            });
                    }
                }
            })
            .catch((err) => {
                console.log("error in getUserInfo", err);
            });
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /petition

app.get("/petition", (req, res) => {
    console.log("req.session.loginId: ", req.session.loginId);
    if (req.session.loginId) {
        db.getUserSignature(req.session.loginId)
            .then((result) => {
                if (result.rows.length === 0) {
                    console.log("logged in but no signature");
                    res.render("petition", {});
                } else {
                    console.log("logged in + signature");
                    res.redirect("/thanks");
                }
            })
            .catch((err) => {
                console.log("error in getUserSignature", err);
            });
    } else {
        console.log("not logged in and no signature");
        console.log("get request to /petition works");
        res.redirect("/register");
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
    //console.log("req.session.loginId: ", req.session.loginId);

    if (req.session.loginId) {
        db.getUserSignature(req.session.loginId)
            .then((result) => {
                if (result.rows.length === 0) {
                    console.log("logged in but no signature");
                    res.redirect("/petition");
                } else {
                    console.log("logged in + signature");
                    var userSignature = result.rows[0].signature;

                    db.countSignatures()
                        .then((results) => {
                            const signersCount = results.rows[0].count;
                            res.render("thanks", {
                                signers: signersCount,
                                displaySignature: userSignature,
                            });
                        })
                        .catch((err) => {
                            console.log("error in countSignatures", err);
                            //res.sendStatus(500);
                        });
                }
            })
            .catch((err) => {
                console.log("error in getUserSignature", err);
            });
    } else {
        console.log("not logged in and no signature");
        console.log("get request to /login works");
        res.redirect("/login");
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - POST: /logout button

app.get("/logout", (req, res) => {
    req.session.loginId = null;
    res.redirect("/login");
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /signers

app.get("/signers", (req, res) => {
    //console.log("req.session.loginId: ", req.session.loginId);

    if (req.session.loginId) {
        db.getUserSignature(req.session.loginId)
            .then((results) => {
                if (results.rows.length === 0) {
                    console.log("logged in but no signature");
                    res.redirect("/petition");
                } else {
                    console.log("logged in + signature");
                    var signersData;
                    db.getSignersInfo()
                        .then((results) => {
                            //console.log("results.rows: ", results.rows);
                            // console.log(
                            //     "results.rows[0].first ",
                            //     results.rows[0].first
                            // );
                            signersData = results.rows;
                            res.render("signers", { signersData });
                        })
                        .catch((err) => {
                            console.log("error in getSignersInfo", err);
                        });
                }
            })
            .catch((err) => {
                console.log("error in getUserSignature", err);
            });
    } else {
        console.log("not logged in and no signature");
        console.log("get request to /signers works");
        res.redirect("/login");
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /signers/:city

app.get("/signers/:city", (req, res) => {
    //console.log("req.session.loginId: ", req.session.loginId);
    var signersData;
    //console.log("req.params: ", req.params);
    console.log("req.params.city: ", req.params.city);
    //console.log("req.params.city: ", req.params.city);
    //console.log("req.params[0].city[0]: ", req.params[0].city);

    db.getCitySigners(req.params.city)
        .then((results) => {
            signersData = results.rows;
            res.render("signers", { signersData });
        })

        .catch((err) => {
            console.log("error in getCitySigners", err);
        });
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - listen to the port

const PORT = 8080;

app.listen(PORT, () => {
    console.log("petition server is listening in PORT: ", PORT);
});
