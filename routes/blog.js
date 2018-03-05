var express = require('express');
var router = express.Router();
var Blog = require("../models/blog");
var middleware = require("../middleware");//var middleware = require("../middleware")//itt azert nincs tovabbi fajl mert ha index.js a neve akkor auto tudja az express hogy az az.

router.get("/blogs", function(req, res){
    Blog.find({}, function(err, allBlogs){
    	// itt keresi meg az osszes camp-et mert nem adtal meg neki semmit
    	// --{} ez jelent mindent.
    	if(err){
    		console.log(err);
    	} else {
    		res.render("blogs/blogs.pug", {blogs: allBlogs});
    	}
    });
    // amit utanna kiforgatsz ezen az ut vonalon 
    // itt rendereled azt az oldalt ahol az arrayed van!!!!
        
});

router.post("/blogs", middleware.isLoggedin, function(req, res){
    var name = req.body.name
    var image = req.body.image
    var description = req.body.description
    // itt adod hozza a usert a camphez
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newBlog = {name: name, image: image, description: description, author: author}
    Blog.create(newBlog, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
             // arra az oldalra ahol meg kell jeleniteni  cuccot a db-bol
             console.log(newlyCreated);
             res.redirect("/blogs");
        }
    });
   
});



router.get("/blogs/new", middleware.isLoggedin, function(req, res){
    res.render("blogs/new");
});
//show page
router.get("/blogs/:id", function(req, res, next){
	// ami itt tortenik az az hogy megkeresse az azonos id-ju campgroundot
	// aztan renderelje azt...
    //.populate most hozza adjuk a commenteket amivel egyesitettuk 
    // a campground ban
	Blog.findById(req.params.id).populate("comments").exec(function(err, foundBlog){
		if(err){
			console.log(err);
		}else{
			res.render("blogs/show", {blog: foundBlog});
		}
	});
	
});



// itt tudod edittelni a campgroundot
router.get("/blogs/:id/edit", middleware.checkBlogOwnership, function(req, res){
	// itt rakeresel az id-re hogy melyik camp az es amit megtalalsz
	// founCampground az lesz egyenlo az akkori meglevo camp-el
	// es azt fogod renderelni easy
	// be van jelentkezve akkor lefut minden 
			Blog.findById(req.params.id, function(err, foundBlog){
				res.render("blogs/edit", {blogs: foundBlog});
			});		
});

// es itt tudod Update-lni 
router.put("/blogs/:id",middleware.checkBlogOwnership, function(req, res, next){
// megkell keresni a correct campet es utana redirect a show pagera
// 1 findbyid
	var data = {name: req.body.name, image: req.body.image, description: req.body.description}
	Blog.findByIdAndUpdate(req.params.id, data, function(err, updateBlog){
		if(err){
			res.redirect("/blogs");
		} else {
			res.redirect("/blogs/" + req.params.id);
		}
	}); 
});

// destroy camp 
router.delete("/blogs/:id", middleware.checkBlogOwnership, function(req, res){
	Blog.findByIdAndRemove(req.params.id, function(err){
		if(err){
			res.redirect("/blogs");
		} else {
			res.redirect("/blogs");
		}
	});
});

module.exports = router;