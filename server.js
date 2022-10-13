/* eslint-disable no-unused-vars */

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - create server (express)

const express = require("express");
const app = express();

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - middleware

// handlebars
const hb = require("express-handlebars");
app.engine("handlebars", hb.engine());
app.set("view engine", "handlebars");

// to parse cookies
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// to parse the request bodies in forms and make the info available as req.body
app.use(express.urlencoded({ extended: false }));

// to hash passwords
const bcrypt = require("bcryptjs");

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - cookie session middleware

const cookieSession = require("cookie-session");

const SESSION_SECRET =
    process.env.SESSION_SECRET || require("./secrets.json").SESSION_SECRET;

app.use(
    cookieSession({
        secret: SESSION_SECRET,
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - require our database

const db = require("./db");

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - only https when in production

if (process.env.NODE_ENV == "production") {
    app.use((req, res, next) => {
        if (req.headers["x-forwarded-proto"].startsWith("https")) {
            return next();
        }
        res.redirect(`https://${req.hostname}${req.url}`);
    });
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - serve public folder

app.use(express.static("./public"));

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - sanitizing functions

const sanitizeEmail = (email) => {
    return email.toLowerCase();
};

const sanitizeName = (name) => {
    var sanitizedName =
        name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    return sanitizedName;
};

const sanitizeUrl = (url) => {
    if (url && !url.startsWith("http")) {
        var sanitizedUrl = "http://" + url.toLowerCase();
        return sanitizedUrl;
    } else {
        return url.toLowerCase();
    }
};

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - check for signature

var signature = false;
// when user signs > change to TRUE
// when user unsigns > change to FALSE
// after login > check db for signature and set value to TRUE or FALSE

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - routes

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - /

app.get("/", (req, res) => {
    if (req.session.loginId) {
        if (signature) {
            res.redirect("/thanks");
        } else {
            res.redirect("/petition");
        }
    } else {
        res.render("intro", {});
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - REGISTER

app.get("/register", (req, res) => {
    if (req.session.loginId) {
        if (signature) {
            res.redirect("/thanks");
        } else {
            res.render("register", {});
        }
    } else {
        res.render("register", {});
    }
});

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
        db.addUser(
            sanitizeName(req.body.regFirst),
            sanitizeName(req.body.regLast),
            sanitizeEmail(req.body.regEmail),
            req.body.regPassword,
            time
        )
            .then((results) => {
                // add cookie (value = id) to mark login
                var loginUserId = results.rows[0].id;
                req.session.loginId = loginUserId;
                //res.send(`loginId: ${req.session.loginId}`);
                res.redirect("/profile");
            })
            .catch((err) => {
                console.log("error in addUser", err);
                res.render("register", {
                    message: "Something went wrong!",
                });
            });
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ADD USER INFO

app.get("/profile", (req, res) => {
    if (req.session.loginId) {
        if (signature) {
            res.redirect("/thanks");
        } else {
            res.render("profile", {});
        }
    } else {
        res.render("register", {});
    }
});

app.post("/profile", (req, res) => {
    if (
        req.body.profileHomepage ||
        req.body.profileCity ||
        req.body.profileAge ||
        req.session.loginId
    ) {
        db.addUserInfo(
            sanitizeUrl(req.body.profileHomepage),
            sanitizeName(req.body.profileCity),
            req.body.profileAge,
            req.session.loginId
        )

            .then((results) => {
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("error in addUserInfo", err);
            });
    } else {
        res.redirect("/petition");
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - EDIT PROFILE

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
        res.redirect("/login");
    }
});

app.post("/profile-edit", (req, res) => {
    let userEditPromise;

    if (req.body.profileEditPassword) {
        userEditPromise = db.editUserPass(
            sanitizeName(req.body.profileEditFirst),
            sanitizeName(req.body.profileEditLast),
            req.body.profileEditPassword,
            req.session.loginId
        );
    } else {
        userEditPromise = db.editUserNoPass(
            sanitizeName(req.body.profileEditFirst),
            sanitizeName(req.body.profileEditLast),
            req.session.loginId
        );
    }

    userEditPromise
        .then(() => {
            return db.upsertUser(
                sanitizeUrl(req.body.profileEditHomepage),
                sanitizeName(req.body.profileEditCity),
                req.body.profileEditAge,
                req.session.loginId
            );
        })
        .then(() => {
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("error on updateInfo", err);
        });
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - DELETE SIGNATURE

app.post("/signature/delete", (req, res) => {
    db.deleteUserSignature(req.session.loginId)
        .then(() => {
            // req.session.signatureId = null;
            signature = false;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("error when deleting the signature", err);
        });
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - LOGIN

app.get("/login", (req, res) => {
    if (req.session.loginId) {
        if (signature) {
            res.redirect("/thanks");
        } else {
            res.redirect("/petition");
        }
    } else {
        res.render("login", {});
    }
});

app.post("/login", (req, res) => {
    if (!req.body.loginEmail || !req.body.loginPassword) {
        res.render("login", {
            message: "All fields are necessary!",
        });
    } else {
        db.getUserInfo(sanitizeEmail(req.body.loginEmail))
            .then((results) => {
                if (results.rows.length === 0) {
                    console.log("email not found");
                    res.render("login", {
                        message: "Something went wrong!",
                    });
                } else {
                    let inputPassword = req.body.loginPassword;
                    let databasePassword = results.rows[0].password;

                    return bcrypt
                        .compare(inputPassword, databasePassword)
                        .then((result) => {
                            if (result) {
                                // store login cookie
                                req.session.loginId = results.rows[0].id;
                                //res.send(`loginId: ${req.session.loginId}`);
                                db.getUserSignature(req.session.loginId)
                                    .then((result) => {
                                        if (result.rows.length === 0) {
                                            signature = false;
                                            res.redirect("/petition");
                                        } else {
                                            signature = true;
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

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - PETITION

app.get("/petition", (req, res) => {
    console.log("req.session.loginId: ", req.session.loginId);
    if (req.session.loginId) {
        if (signature) {
            res.redirect("/thanks");
        } else {
            res.render("petition", {});
        }
    } else {
        res.redirect("/register");
    }
});

app.post("/petition", (req, res) => {
    let time = new Date().toISOString().slice(0, 19).replace("T", " ");
    let userId = req.session.loginId; // ?????

    db.addSignature(req.body.signature, time, userId)
        .then(() => {
            req.session.signatureId = userId;
            //res.send(`signatureId: ${req.session.signatureId}`);
            signature = true;
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("error in addSignature", err);
            res.render("petition", {
                message: "We really need your signature!",
            });
        });
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - THANKS

app.get("/thanks", (req, res) => {
    if (req.session.loginId) {
        if (signature) {
            db.getUserSignature(req.session.loginId)
                .then((result) => {
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
                        });
                })
                .catch((err) => {
                    console.log("error in getUserSignature", err);
                });
        } else {
            res.redirect("/petition");
        }
    }
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - LOGOUT

app.get("/logout", (req, res) => {
    req.session.loginId = null;
    res.redirect("/login");
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - SIGNERS

app.get("/signers", (req, res) => {
    if (req.session.loginId) {
        if (signature) {
            var signersData;
            db.getSignersInfo()
                .then((results) => {
                    signersData = results.rows;
                    res.render("signers", { signersData });
                })
                .catch((err) => {
                    console.log("error in getSignersInfo", err);
                });
        } else {
            res.redirect("/petition");
        }
    } else {
        res.redirect("/login");
    }
});

app.get("/signers/:city", (req, res) => {
    var signersData;

    db.getCitySigners(req.params.city)
        .then((results) => {
            signersData = results.rows;
            res.render("signers", { signersData });
        })

        .catch((err) => {
            console.log("error in getCitySigners", err);
        });
});

// - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - listen to the server

let localPORT = 8080;
let productionPORT = process.env.PORT;

app.listen(productionPORT || localPORT, () => {
    console.log("petition server is listening in PORT: ", localPORT);
});
