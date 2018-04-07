require('dotenv').config();
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var passportLocalMongoose = require('passport-local-mongoose');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var User = require("./models/user");
var mongoose = require('mongoose');
var methodOverride = require("method-override");
var flash = require('connect-flash');
var moment = require('moment');
var ObjectID = require("mongodb").ObjectID;

// configure dotenv
require('dotenv').load();
moment().format();
// helpers 

var index = require('./routes/index');
var users = require('./routes/users');
var blog = require('./routes/blog');
var comments = require('./routes/comments');

var app = express();

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// req moment.js for timing
app.locals.moment = require('moment');

// ez olyan mint a cookie session csak ez express ez felel azert hogy a user kapjon egy token ami egyedi ezert nem kell tobbet bejelentkeznie. cookie session emily-
app.use(require("express-session")({
    secret: "This is good",
    resave: false,
    saveUninitialized: false
}));
// ez kell meg a passporthoz de ez a vegen kell 
app.use(passport.initialize());
app.use(passport.session());


app.use(methodOverride("_method"));
app.use(flash()); // flash message login first stb

// passport Google oauth
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLECLIENTID,
    clientSecret: process.env.GOOGLECLIENTSECRET,
    callbackURL: "/auth/google/callback",
    proxy: true
}, function(accessToken, refreshToken, profile, done) {
    //console.log(accessToken);
    var avatar = profile.photos[0].value.substring(0, profile.photos[0].value.indexOf('?'));
    var newUser = {
        googleID: profile.id,
        username: profile.displayName,
        firstname: profile.name.givenName,
        lastname: profile.name.familyName,
        email: profile.emails[0].value,
        bio: '',
        avatar: avatar
    };
    User.findOne({ googleID: profile.id }).then(user => {
        if (user) {
            done(null, user);
        } else {
            new User(newUser).save().then(user => done(null, user));
            console.log(newUser);
        }
    });

}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

// passport local with email login
passport.use(new LocalStrategy((username, password, done) => {
    User.findOne({ username: username }, (err, user) => {
        if (err) { return done(err); }

        if (!user) {
            return done(null, false, { message: 'Érvénytelen felhasználó' });
        }
        if (user) {
            console.log(user);
        }
        return done(null, user);
    });
}));




// ezek az allandok amit hasznalsz.
app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// view engine setup




app.use('/', index);
app.use('/users', users);
app.use(blog);
app.use(comments);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;