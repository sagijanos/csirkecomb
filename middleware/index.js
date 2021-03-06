var Blog = require("../models/blog"); // ide req-elned kell mert ha nem akkor undefinednak erzekeli az osszest modelt amit itt hasznalsz
var Comment = require("../models/comment");
var User = require("../models/user");
// az osszes middleware jon ide 

middlewareObj = {}

middlewareObj.checkBlogOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {
        Blog.findById(req.params.id, function(err, foundBlog) {
            if (err) {
                req.flash("error", "Nincs ilyen bejegyzés");
                res.redirect("back");
            } else {
                // itt azert hasznalod ezt mert a found es a user az nem string az egyik object a masik string ezert hasznalod a az equals ami a mongoosenak egy cucca
                if (foundBlog.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You dont have permission to do that!")
                    res.redirect("back");
                }

            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that!")
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {
        Comment.findById(req.params.comment_id, function(err, foundComment) {
            if (err) {
                res.redirect("back");
            } else {
                // itt azert hasznalod ezt mert a found es a user az nem string az egyik object a masik string ezert hasznalod a az equals ami a mongoosenak egy cucca
                if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You dont have permission to do that!");
                    res.redirect("back");
                }

            }
        });
    } else {
        req.flash("error", "Ypu need to be logged in to do that");
        res.redirect("back");
    }
}

middlewareObj.checkUserOwnership = function(req, res, next) {
    if (req.isAuthenticated()) {
        User.findById(req.params.id, function(err, foundUser) {
            if (err) {
                res.redirect("back");
            } else {
                if (foundUser._id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You dont have permission to do that!");
                    res.redirect("back");
                }

            }
        });
    } else {
        req.flash("error", "Ypu need to be logged in to do that");
        res.redirect("back");
    }
}



middlewareObj.isLoggedin = function(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
        // ez fontos ha returnolsz nem kell else
    }
    req.flash("error", "Kérlek jelentkezz be elötte");
    res.redirect("/login");
}



module.exports = middlewareObj;