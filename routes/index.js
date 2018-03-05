var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var Blog = require("../models/blog");// hozd letre a schemat
var Comment = require("../models/comment");// hozd letre a schemat
var User = require("../models/user");// hozd letre a schemat
var passport = require('passport');
var LocalStrategy = require('passport-local');
var passportLocalMongoose = require('passport-local-mongoose');
var async = require('async');
var nodemailer = require('nodemailer');
var crypto = require('crypto');
mongoose.connect('mongodb://devjohn:Iphone93@ds229448.mlab.com:29448/bloglist');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get("/register", function(req, res, next){
    res.render("register",);
});

// Show sign up form register form letrehozasa post 
router.post("/register", function(req, res, next){
    var newUser = new User({
            username: req.body.username,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            email: req.body.email,
            avatar: req.body.avatar
        });
    if(req.body.adminCode === 'Qazwsx930323'){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Szia " + " " + user.username);
            res.redirect("/blogs");
        });
    });
});


// ==============
// belepesii utak LOG IN
//===============

// Show form login

router.get("/login", function(req, res, next){
    res.render("login");
	});
// Megcsinalni a login logikat
router.post("/login", passport.authenticate("local",
		{
    	successRedirect: "/blogs",
    	failureRedirect: "/login"
		}), function(req, res){

	});

// ==============
// belepesii utak LOG OUT
//===============

router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Várunk vissza!");// ennek par resze middlewareben is van csak mondom ott is keresd
    res.redirect("/blogs");
});

// elfelejtett password
router.get("/forgot", function(req, res){
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
    res.render('reset', {token: req.params.token});
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
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
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

router.get("/users/:id", function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash("error", "Valami nem stimmel");
            res.redirect("/blogs");
        }
        Blog.find().where('author.id').equals(foundUser._id).exec(function(err, posts){
            if(err){
            req.flash("error", "Valami nem stimmel");
            res.redirect("/blogs");
            }
            res.render("users/show", {user: foundUser, blog: posts});
        });
        
    });

});



module.exports = router;
