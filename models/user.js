var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
// setup schema 
var UserSchema = mongoose.Schema({
	username: {type: String, unique: true, required: true},
	password: String,
	avatar: String,
	firstname: String,
	lastname: String,
	email: {type: String, unique: true, required: true},
	resetPasswordToken: String,
    resetPasswordExpires: Date,
	isAdmin: {type: Boolean, default: false}
});

// itt pluginolod a passportlocal mongoose-t
UserSchema.plugin(passportLocalMongoose);

 
module.exports = mongoose.model("User", UserSchema);