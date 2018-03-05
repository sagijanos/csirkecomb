var mongoose = require('mongoose');
// setup schema 
var commentSchema = mongoose.Schema({
	text: String,
	createAt: {type: Date, default: Date.now},
	author: {
		id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User"
		},
		username: String
	}
});

var Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment