var express = require('express');
var router = express.Router();
var Blog = require("../models/blog");
var Comment = require("../models/comment");
var middleware = require("../middleware");//var middleware = require("../middleware")//itt azert nincs tovabbi fajl mert ha index.js a neve akkor auto tudja az express hogy az az.

// most letre hozod a commentet =========================
// COMMENTS ROUTE
//=======================================================

router.get("/blogs/:id/comment/new", middleware.isLoggedin, function(req, res, next){
// na az van hogy meg kell keresned a campground idval 
    Blog.findById(req.params.id, function(err, blog){
        if(err){
            console.log(err);
        } else {
            res.render("comments/new", {blogs: blog});
        }
    });
	
});

// itt postot hozol letre ahol hogy a commentet hozza tudjad adni a campekhez.
router.post("/blogs/:id/comment", middleware.isLoggedin, function(req, res){
  // meg kell keresned az id-t hogy egyezzen findbyid
    // fontos itt a blog kell csinalnod tehat 
    // es amikor megtalalta akkor letre hozza ra a commentet 
     var text = req.body.text
    var author = req.body.author
    var newComment = {text: text, author: author}
    Blog.findById(req.params.id, function(err, blog){
        if(err){
            console.log(err);
            res.redirect("/blogs");
        } else {
            Comment.create(newComment, function(err, comment){
                if(err){
                    req.flash("error", "Something went wrong Try again pls");
                    console.log(err);
                } else {
                // itt hozzaadod az aktualis usert es id- a commenthez
                // csak a schemara hivatkozva a szokasos es utanna el kell mentened 
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    // ments el a commentet
                    comment.save();
                    blog.comments.push(comment);
                    blog.save();
                    req.flash("success", "Successfully added comment");
                    res.redirect("/blogs/" + blog._id);
                }
            });
        }
    });
});
// comment edit 
router.get("/blogs/:id/comments/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
        if(err){
            res.redirect("back");
        } else {
            res.render("comments/edit", {blog_id: req.params.id, comment: foundComment});
        }
    });
    
});
// comment updte
router.put("/blogs/:id/comments/:comment_id", middleware.checkCommentOwnership, function(req, res){
    var data = {text: req.body.text}
    Comment.findByIdAndUpdate(req.params.comment_id, data, function(err, updateComment){
        if(err){
            res.redirect("back");
        } else {
            res.redirect("/blogs/" + req.params.id);
        }
    });
});

// comment dstroy router.

router.delete("/blogs/:id/comments/:comment_id", middleware.checkCommentOwnership, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.redirect("back");
        } else {
            req.flash("success", "Comments deleted");
            res.redirect("/blogs/" + req.params.id);
        }
    });
});

module.exports = router;