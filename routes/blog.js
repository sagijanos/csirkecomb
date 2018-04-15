var express = require('express');
var router = express.Router();
var Blog = require("../models/blog");
var socialSharing = require('social-share');
var middleware = require("../middleware"); //var middleware = require("../middleware")//itt azert nincs tovabbi fajl mert ha index.js a neve akkor auto tudja az express hogy az az.
var multer = require("multer");
//INDEX - image upload to cloudnary
var storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});
var imageFilter = function(req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter })

var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: process.env.CLOUDNARYNAME,
    api_key: process.env.CLOUDNARYAPIKEY,
    api_secret: process.env.CLOUDNARYAPISECRET
});


//INDEX - show all posts
router.get("/blogs", function(req, res) {
    var noMatch = null;
    if (req.query.search) {
        var regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all posts from DB
        Blog.find({ name: regex }, function(err, allBlogs) {
            if (err) {
                console.log(err);
            } else {
                if (allBlogs.length < 1) {
                    noMatch = "Sajnos nincs ilyen bejegyzés kérlek próbálkozz újra"
                }
                res.render("blogs/blogs", { blogs: allBlogs, noMatch: noMatch });
            }
        });
    } else {
        // Get all campgrounds from DB // Ez mar pagination 
        // itt ezt meg old meg hogy a legfrissebb keruljon elore mindig
        Blog.find({ status: 'nyilvános' }).sort({ createAt: 'desc' }).exec(function(err, allBlogs) {
            if (err) {
                console.log(err);
            } else {
                res.render("blogs/blogs", { blogs: allBlogs });
            }
        });
    }
}); // ez a vege a teljes route-nak

router.post("/blogs", middleware.isLoggedin, upload.single('imageup'), function(req, res) {
    cloudinary.uploader.upload(req.file.path, function(result) {
        req.body.testamony.imageup = result.secure_url;
        req.body.testamony.author = {
            id: req.user._id,
            username: req.user.username,
            avatar: req.user.avatar
        };
        Blog.create(req.body.testamony, function(err, testamony) {
            if (err) {
                console.log('something went wrong');
                return res.redirect('back');
            }
            res.redirect('/blogs');
            console.log(testamony);
        });
    });
});

router.get("/blogs/new", middleware.isLoggedin, function(req, res) {
    res.render("blogs/new");
});
//show page
router.get("/blogs/:id", function(req, res, next) {
    // ami itt tortenik az az hogy megkeresse az azonos id-ju campgroundot
    // aztan renderelje azt...
    //.populate most hozza adjuk a commenteket amivel egyesitettuk 
    // a campground ban
    Blog.findById(req.params.id).populate("comments").exec(function(err, foundBlog) {
        if (err) {
            console.log(err);
        } else {
            res.render("blogs/show", { blog: foundBlog });
        }
    });

});



// itt tudod edittelni a campgroundot
router.get("/blogs/:id/edit", middleware.checkBlogOwnership, function(req, res) {
    // itt rakeresel az id-re hogy melyik camp az es amit megtalalsz
    // founCampground az lesz egyenlo az akkori meglevo camp-el
    // es azt fogod renderelni easy
    // be van jelentkezve akkor lefut minden 
    Blog.findById(req.params.id, function(err, foundBlog) {
        res.render("blogs/edit", { blogs: foundBlog });
    });
});

// es itt tudod Update-lni 
router.put("/blogs/:id", middleware.checkBlogOwnership, function(req, res, next) {
    // megkell keresni a correct campet es utana redirect a show pagera
    // 1 findbyid
    var data = { name: req.body.name, image: req.body.image, description: req.body.description }
    Blog.findByIdAndUpdate(req.params.id, data, function(err, updateBlog) {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.redirect("/blogs/" + req.params.id);
        }
    });
});

// destroy camp 
router.delete("/blogs/:id", middleware.checkBlogOwnership, function(req, res) {
    Blog.findByIdAndRemove(req.params.id, function(err) {
        if (err) {
            res.redirect("/blogs");
        } else {
            res.redirect("/blogs");
        }
    });
});
// itt van a regex amit meg mondja hogy mi fer 
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};



module.exports = router;