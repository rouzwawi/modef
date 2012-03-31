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


# destrruc


## prerequisites
[modef](https://github.com/rouzwawi/modef)


## Installation
	npm install destrruc


## Use
Define your models using modef. Here done in a separate module (see modef docs).

	require('./model/blog-models.js');

Use `destrruc()` function in express server to set up resource routes.

	var express = require('express');
	var app = express.createServer();

	app.destrruc();

This will set up CRUD routes for all your modef defined models.

	POST    /:model      ->  Create Model from req.body
	GET     /:model/:id  ->  Return Model :id as JSON
	PUT     /:model/:id  ->  Update Model :id to req.body (per field updates)
	DELETE  /:model/:id  ->  Delete Model :id


## Setup options
Setting up destrruc, you can pass these options to customize some of the behavior.
These are the defaults.

	app.destrruc({
		render: function(req, res, modelName, entity, next) {
			res.JSON(entity);
		},
		id: function(id) { return { _id: id }; }
	});

`render:` - A callback function for rendering the entity

`id:` - A function for creating a mongoose query object from the :id parameter


## Populating connections
Using [mongoose populate](http://mongoosejs.com/docs/populate.html) destrruc gives
you a way to populate connected fields when doing GETs. Note, this only goes down one
level in the connections.

If we have a one-to-many connection between Authors and Posts, Authors will have a list
of references to Posts, and Posts will have a field with a reference to an Author.
These fields can be populated using the 'include' query parameter.

	/author/:id?include=posts
	/post/:id?include=author

The general syntax for the include query parameter is:

	include-caluse = <connection>[.<field>[|<field> ...]]
	?include=<include-clause>[,<include-clause> ...]

Some examples:

	# author with posts
	/author/:id?include=posts
	
	# author with posts, but only post heading and date
	/author/:id?include=posts.heading|date
	
	# same as above, but also include the authors pictures names
	/author/:id?include=posts.heading|date,pictures.name


## Events

	destrruc.audit(function(action, modelName, entity, fields) {
		console.log('action:%s, model:%s, id:%s', action, modelName, entity._id);
		for (field in fields) {
			console.log('\t %s = %s', field, fields[field]);
		}
	});
