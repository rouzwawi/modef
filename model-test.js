// connect mongoose
var mongoose = require('mongoose');
var mongooseDb = mongoose.connect('mongodb://localhost/blog');


// load modef
var m = require('modef');


// Fields common to all models
m.common('name', { type: String, index: true });

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
m.model('Author' ,  Author);
m.model('Post'   , 'Author', ['Picture'], PostAndComment);
m.model('Comment', 'Post'  ,  'Author'  , PostAndComment);
m.model('Picture', 'Author', ['Post']   , Picture);


m.create();

// look at the created entity hierarchy
m.printHierarchies();

// Author (root)
//  `- Post
//  |   `- Picture -> Post
//  |   `- Comment
//  `- Comment
//  `- Picture
//      `- Post -> Picture
//          `- Comment


// modef exports mongoose models
var post = new m['Post']();
post.body = 'Lorem ipsum dolor sit amet, consectetur...';
post.save();

var author = new m['Author']();
author.name = 'John Author';
author.username = 'john.author';
author.posts.push(post);
author.save();
