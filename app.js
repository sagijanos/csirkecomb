var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var passportLocalMongoose = require('passport-local-mongoose');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var User = require("./models/user");
var mongoose = require('mongoose');
var methodOverride = require("method-override");
var flash = require('connect-flash');

// configure dotenv
require('dotenv').load();

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

app.use(require("express-session")({
	secret: "This is good",
	resave: false,
	saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));
app.use(flash()); // flash message login first stb
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// ezek az allandok amit hasznalsz.
app.use(function(req, res, next){
	res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
	next();
});

app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride("_method"));
app.use(flash()); // flash message login first stb
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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
