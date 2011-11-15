# destrruc


## prerequisites
[modef](https://github.com/rouzwawi/modef)


## Installation
	npm install destrruc


## Use
Define your models using modef. Here done in a separate module (see modef docs).

	require('./model/blog-models.js');

Use destrruc() on express server to set up resource routes.

	var express = require('express');
	var app = express.createServer();

	app.destrruc({});

This will set up CRUD routes for all your modef defined models.

	POST    /:model      ->  Create Model from req.body.author
	GET     /:model/:id  ->  Return Model :id as JSON
	PUT     /:model/:id  ->  Update Model :id to req.body.author (per field updates)
	DELETE  /:model/:id  ->  Delete Model :id


## Setup options
Setting up destrruc, you can pass these options to customize some of the behavior. This is the default behavior.

	app.destrruc({
		render: function(req, res, modelName, entity, next) {
			res.JSON(entity);
		},
		id: function(id) { return { _id: id }; }
	});

### render
A callback function for rendering the entity

### id
A function for creating a mongoose query object from the :id parameter
