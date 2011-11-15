# modef


## Installation
	npm install modef


## Connect Mongoose
	var mongoose = require('mongoose');
	var mongooseDb = mongoose.connect('mongodb://localhost/blog');


## Require Modef
	var modef = require('modef');
	var model	= modef.model,
		common	= modef.common,
		create	= modef.create
	;


## Example Usage
	var Author = {
		username: { type: String }
	};

	// Common schema for several entities
	var PostAndComment = {
		body: { type: String },
		date: { type: Date, default: function(){ return new Date(); } }
	};

	var Picture = {
		url: { type: String }
	};

	// one-to-many connections imply opposite many-to-one connection
	// Picture-Post has many-to-many connection
	// model('<entity-name>', <connections>*, MongooseSchema)
	model('Author' ,  Author);
	model('Post'   , 'Author', ['Picture'], PostAndComment);
	model('Comment', 'Post'  ,  'Author'  , PostAndComment);
	model('Picture', 'Author', ['Post']   , Picture);

	// Fields common to all models
	common('name', { type: String, index: true });

	create();


## View your models
	modef.printHierarchies();


	Author (root)
	 `- Post
	 |   `- Picture -> Post
	 |   `- Comment
	 `- Comment
	 `- Picture
	     `- Post -> Picture
	         `- Comment


## Use defined Mongoose Models
	// modef exports mongoose models
	var post = new modef['Post']();
	post.body = 'Lorem ipsum dolor sit amet, consectetur...';
	post.save();

	var author = new modef['Author']();
	author.name = 'John Author';
	author.username = 'john.author';
	author.posts.push(post);
	author.save();
