var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Blog = require("../models/blog"); // hozd letre a schemat
var Comment = require("../models/comment"); // hozd letre a schemat
var User = require("../models/user"); // hozd letre a schemat
var passport = require('passport');
var LocalStrategy = require('passport-local');
var passportLocalMongoose = require('passport-local-mongoose');
var async = require('async');
var middleware = require("../middleware");
var nodemailer = require('nodemailer');
var crypto = require('crypto');
var bcrypt = require('bcryptjs');
var request = require("request");
var ObjectID = require("mongodb");
mongoose.connect(process.env.DBHOST);

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index');
});

router.get("/register", function(req, res, next) {
    res.render("register");
});

// Show sign up form register form letrehozasa post 
router.post("/register", function(req, res, next) {
    var errors = [];

    if (req.body.password !== req.body.password2) {
        errors.push({ text: 'A jelszo nem egyezik meg' });
    }
    if (errors.length > 0) {
        res.render("register", {
            username: req.body.username,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            bio: req.body.bio,
            email: req.body.email,
            avatar: req.body.avatar
        });
    } else {
        var newUser = new User({
            username: req.body.username,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            bio: req.body.bio,
            email: req.body.email,
            avatar: req.body.avatar,
            password: req.body.password
        });
        bcrypt.genSalt(10, function(err, salt) {
            bcrypt.hash(newUser.password, salt, function(err, hash) {
                if (err) throw err;
                newUser.password = hash;
                newUser.save()
                    .then(user => {
                        req.flash('success', 'Sikeres regisztráció most már bejelentkezhetsz');
                        res.redirect('/login');

                    })
                    .catch(err => {
                        console.log(err);
                        return;
                    });
            });
        });
    }
});




// ==============
// belepesii utak LOG IN
//===============

// Show form login

router.get("/login", function(req, res, next) {
    res.render("login");
});
// Megcsinalni a login logikat
router.post(
    "/login",
    passport.authenticate("local", {
        successRedirect: "/blogs",
        failureRedirect: "/login",
        failureFlash: true
    }),
    function(req, res) {}
);
// ==============
// belepesii utak LOG OUT
//===============

router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Várunk vissza!"); // ennek par resze middlewareben is van csak mondom ott is keresd
    res.redirect("/login");
});

// elfelejtett password
router.get("/forgot", function(req, res) {
    res.render("forgot");
});

router.post('/forgot', function(req, res, next) {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({ email: req.body.email }, function(err, user) {
                if (!user) {
                    req.flash('error', 'Nincs ilyen email-cím vagy felhasználó');
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'janodevelop@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'janodevelop@gmail.com',
                subject: 'Csirkecomb Jelszó csere',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                console.log('mail sent');
                req.flash('success', 'Az email el lett küldve a  ' + user.email + ' -re köszönjük');
                done(err, 'done');
            });
        }
    ], function(err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
});

router.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
            req.flash('error', 'Lejárt az idő kérlek kérj meg egy lehetőséget');
            return res.redirect('/forgot');
        }
        res.render('reset', { token: req.params.token });
    });
});


router.post('/reset/:token', function(req, res) {
    async.waterfall([
        function(done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                if (!user) {
                    req.flash('error', 'Lejárt az idő kérlek kérj meg egy lehetőséget');
                    return res.redirect('back');
                }
                if (req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function(err) {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(function(err) {
                            req.logIn(user, function(err) {
                                done(err, user);
                            });
                        });
                    });
                } else {
                    req.flash("error", "Nem egyezik a jelszó");
                    return res.redirect('back');
                }
            });
        },
        function(user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: 'janodevelop@gmail.com',
                    pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'janodevelop@gmail.com',
                subject: 'Jelszó csere',
                text: 'Hello,\n\n' +
                    'Ez az a link amire ha rá mész megtudod változtatni a jelszódat ' + user.email + ' has just been changed.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                req.flash('success', 'Gratulálok! Sikeresen megváltozott a jelszód');
                done(err);
            });
        }
    ], function(err) {
        res.redirect('/blogs');
    });
});


// Users profiles

router.get("/users/:id", middleware.isLoggedin, function(req, res) {
    User.findById(req.params.id, function(err, foundUser) {
        if (err) {
            req.flash("error", "Valami nem stimmel");
            res.redirect("/blogs");
        }
        Blog.find({}, {}, { sort: { 'createAt': -1 } }).where('author.id').equals(foundUser._id).exec(function(err, posts) {
            if (err) {
                req.flash("error", "Valami nem stimmel");
                res.redirect("/blogs");
            }
            res.render("users/show", { user: foundUser, blog: posts });
            console.log("========================");
            console.log(foundUser);
        });

    });

});

// Users Edit his/her profile
router.get("/users/:id/edit", function(req, res, next) {
    User.findById(req.params.id, function(err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            console.log(req.user.id);
            console.log(foundUser._id);
            if (foundUser._id.equals(req.user.id)) {
                console.log("yeah its working");
                res.render("users/edit", { user: foundUser });
            } else {
                res.redirect("back");
            }
        }
    });
});

// Users update  his/her profile
router.put("/users/:id", function(req, res) {
    //mi van a form-ba 
    var data = { username: req.body.username, firstname: req.body.firstname, lastname: req.body.lastname, avatar: req.body.avatar, bio: req.body.bio };
    User.findByIdAndUpdate(req.params.id, data, function(err, updatedProfile) {
        if (err) {
            console.log(err);
            console.log(updatedProfile);
            req.flash("error", "Valami nem stimmel kérlek próbáld úrja");
            res.redirect("back");
        } else if (updatedProfile._id.equals(req.user.id)) {
            res.redirect("/users/" + updatedProfile._id);
            console.log(updatedProfile);
        }
    });
});


// contactpage get

router.get("/contact", function(req, res) {
    res.render("kapcsolat");
});

router.post("/contact/send", function(req, res) {
    const captcha = req.body["g-recaptcha-response"];
    if (!captcha) {
        console.log(req.body);
        req.flash("error", "Please select captcha");
        return res.redirect("back");
    }
    // secret key
    var secretKey = process.env.CAPTCHA;
    // Verify URL
    var verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captcha}&remoteip=${req
      .connection.remoteAddress}`;
    // Make request to Verify URL
    request.get(verifyURL, (err, response, body) => {
        // if not successful
        if (body.success !== undefined && !body.success) {
            req.flash("error", "Captcha Failed");
            return res.redirect("/contact");
        }
        var smtpTransport = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'janodevelop@gmail.com',
                pass: process.env.GMAILPW
            }
        });

        var mailOptions = {
            from: 'Your Name janodevelop@gmail.com',
            to: 'your@gmail.com',
            replyTo: req.body.email,
            subject: "Let's Camp contact request from: " + req.body.name,
            text: 'You have received an email from... Name: ' + req.body.name + ' Email: ' + req.body.email + ' Message: ' + req.body.message,
            html: '<h3>You have received an email from...</h3><ul><li>Name: ' + req.body.name + ' </li><li>Email: ' + req.body.email + ' </li></ul><p>Message: <br/><br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + req.body.message + ' </p>'
        };

        smtpTransport.sendMail(mailOptions, function(err, info) {
            if (err) {
                console.log(err);
                req.flash("error", "Something went wrong... Please try again later!");
                res.redirect("/contact");
            } else {
                req.flash("success", "Your email has been sent, we will respond within 24 hours.");
                res.redirect("/blogs");

            }
        });
    });
});



module.exports = router;