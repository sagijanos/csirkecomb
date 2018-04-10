var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
// setup schema
var UserSchema = mongoose.Schema({
    googleID: String,
    username: { type: String, unique: true },
    password: String,
    password2: String,
    avatar: String,
    bio: String,
    email: { type: String, unique: true, required: true },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isAdmin: { type: Boolean, default: false }
});

// itt pluginolod a passportlocal mongoose-t
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);