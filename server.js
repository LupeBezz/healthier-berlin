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

const bcrypt = require("bcryptjs");

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
        console.log("not logged in and no signature - get request to /");
        res.render("intro", {});
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /register

app.get("/register", (req, res) => {
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
        console.log(
            "not logged in and no signature - get request to /register"
        );
        res.render("register", {});
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - POST: /register

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
                    message: "Something is wrong!",
                });
            });
        console.log("post request to /register works");
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /profile

app.get("/profile", (req, res) => {
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
        console.log("not logged in and no signature - get request to /profile");
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

        if (
            req.body.profileHomepage &&
            !req.body.profileHomepage.startsWith("http")
        ) {
            req.body.profileHomepage = "http://" + req.body.profileHomepage;
        }

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

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /profile-edit

app.get("/profile-edit", (req, res) => {
    if (req.session.loginId) {
        db.getInfoForEdit(req.session.loginId)
            .then((result) => {
                var userInfoForEdit = result.rows[0];
                res.render("profile-edit", { userInfoForEdit });
            })
            .catch((err) => {
                console.log("error in getInfoForEdit", err);
            });
    } else {
        console.log("user not logged in");
        res.redirect("/login");
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - POST: /profile-edit

app.post("/profile-edit", (req, res) => {
    //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - sanitize first
    req.body.profileEditFirst =
        req.body.profileEditFirst.charAt(0).toUpperCase() +
        req.body.profileEditFirst.slice(1).toLowerCase();

    //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - sanitize last

    req.body.profileEditLast =
        req.body.profileEditLast.charAt(0).toUpperCase() +
        req.body.profileEditLast.slice(1).toLowerCase();

    //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - sanitize city

    req.body.profileEditCity =
        req.body.profileEditCity.charAt(0).toUpperCase() +
        req.body.profileEditCity.slice(1).toLowerCase();
    //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - sanitize url

    if (
        req.body.profileEditHomepage &&
        !req.body.profileEditHomepage.startsWith("http")
    ) {
        req.body.profileEditHomepage = "http://" + req.body.profileEditHomepage;
    }

    //- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - insert into database

    let userEditPromise;

    if (req.body.profileEditPassword) {
        userEditPromise = db.editUserPass(
            req.body.profileEditFirst,
            req.body.profileEditLast,
            req.body.profileEditPassword,
            req.session.loginId
        );
    } else {
        userEditPromise = db.editUserNoPass(
            req.body.profileEditFirst,
            req.body.profileEditLast,
            req.session.loginId
        );
    }

    userEditPromise
        .then(() => {
            return db.upsertUser(
                req.body.profileEditHomepage,
                req.body.profileEditCity,
                req.body.profileEditAge,
                req.session.loginId
            );
        })
        .then(() => {
            console.log("user info successfully updated");
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("error on updateInfo", err);
        });
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - POST: /signature/delete

app.post("/signature/delete", (req, res) => {
    db.deleteUserSignature(req.session.loginId)
        .then(() => {
            console.log("signature successfully erased");
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("error when deleting the signature", err);
        });
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /login

app.get("/login", (req, res) => {
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
        console.log("not logged in and no signature - get request to /login");
        res.render("login", {});
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - POST: /login

app.post("/login", (req, res) => {
    if (!req.body.loginEmail || !req.body.loginPassword) {
        res.render("login", {
            message: "All fields are necessary!",
        });
    } else {
        db.getUserInfo(req.body.loginEmail)
            .then((results) => {
                if (results.rows.length === 0) {
                    console.log("email not found");
                    res.render("login", {
                        message: "Something is wrong!",
                    });
                } else {
                    console.log("email found");
                    let inputPassword = req.body.loginPassword;
                    let databasePassword = results.rows[0].password;

                    return bcrypt
                        .compare(inputPassword, databasePassword)
                        .then((result) => {
                            if (result) {
                                // - - - - - - - - - - - - - - - - - - - - req. session.loginId > the user successfully logged in
                                console.log("the password is correct");
                                req.session.loginId = results.rows[0].id;
                                //res.send(`loginId: ${req.session.loginId}`);
                                db.getUserSignature(req.session.loginId)
                                    .then((result) => {
                                        if (result.rows.length === 0) {
                                            console.log(
                                                "logged in but no signature"
                                            );
                                            res.redirect("/petition");
                                        } else {
                                            console.log(
                                                "logged in + signature"
                                            );
                                            res.redirect("/thanks");
                                        }
                                    })
                                    .catch((err) => {
                                        console.log(
                                            "passwords don't match!",
                                            err
                                        );
                                        res.sendStatus(500);
                                    });
                            }
                        });
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
        console.log(
            "not logged in and no signature - get request to /petition"
        );
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
        console.log("not logged in and no signature - get request to /thanks");
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
        console.log("not logged in and no signature - get request to /signers");
        res.redirect("/login");
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - GET: /signers/:city

app.get("/signers/:city", (req, res) => {
    var signersData;
    console.log("req.params.city: ", req.params.city);

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
