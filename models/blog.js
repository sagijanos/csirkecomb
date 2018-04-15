var mongoose = require('mongoose');
// Setup Schema
var blogSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
    imageup: String,
    subname: String,
    status: {
        type: String,
        default: 'public'
    },
    createAt: { type: Date, default: Date.now },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String,
        avatar: String

    },
    //fontoss hogy itt adod hozza az egyutmukodes 
    // minden campgroundhoz tartozik tobb comment 
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }]
});
var Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog