mongoose = require 'mongoose'
mongooseUtils = require 'mongoose/lib/utils.js'
pluralize = mongooseUtils.toCollectionName

Schema = mongoose.Schema
ObjectId = Schema.ObjectId

commons = []
modelTemplates = {}
connections = {}
aliases = {}
roots = {}

#-------------------------------------------------------------------
# Internal functions

firstLower = (name) -> name.substr(0,1).toLowerCase() + name.substr(1)
connectionName = (name) -> name.toLowerCase()
alias = (name) -> aliases[name]
connected = (from) ->
	c = connections[from] ? connections[aliases[from]]
	connections[from] = c = {} unless c?
	c

connect = (name, model, field, many) ->
	from = connected(name)
	if not from[field] or not from[field].many
		from[field] = to:model, many:many

queueConnections = (cs, searchStack, followMany) ->
	ret = false
	if cs?
		for name,c of cs
			if c.many is followMany?
				searchStack.push c
				ret = true
	ret

searchRoots = ->
	# console.log(connections, aliases)
	for name,template of modelTemplates
		# resolve hirarchial roots
		searchStack = []
		unless queueConnections connections[name], searchStack
			roots[name] = module.exports[name]
		while searchStack.length > 0
			c = searchStack.pop()
			unless queueConnections(connections[c.to], searchStack)
				roots[c.to] = module.exports[c.to]


#-------------------------------------------------------------------
# Functions for data model hierarchies

hierarchies = ->
	level = (nodes, vs, node) ->
		visited = (v) ->
			(e) -> !v ^ vs[e.to]
		notVisited = nodes.filter visited false
		for n,i in notVisited
			vs2 = {}
			vs2[vf]=true for vf of vs
			vs2[n.to] = true

			stack = []
			queueConnections connections[n.to], stack, true

			next = n:n.to, c:[]
			node.c.push next
			level stack, vs2, next
		for n,i in nodes.filter visited true
			node.b ?= []
			node.b.push n.to
	h = []
	for root of roots
		node = n:root, c:[]
		h.push node
		stack = []
		queueConnections connections[root], stack, true
		vs = {}
		vs[root] = true
		level stack, vs, node
	h

printHierarchies = ->
	rep = (z, o, a) ->
		s = ((if n then o else z) for n in a)
		s.join ''
	level = (nodes, d, node) ->
		for n,i in node.c
			stack = []
			queueConnections connections[node.n], stack, true

			line = rep('    ',' |  ',d) + ' `- ' + n.n
			if n.b? and n.b.length > 0
				line += ' -> ' + n.b.join ', '
			console.log line

			d.push if i == node.c.length-1 then 0 else 1
			pr = level stack, d, n
			d.pop()
	h = hierarchies()
	for root in h 
		stack = []
		queueConnections connections[root.n], stack, true
		console.log root.n + ' (root)'
		level stack, [], root


#-------------------------------------------------------------------
# Exported functions

# Defines a common field that will be added to all models.
common = (name, type) ->
	commons.push name:name, type:type

###
Defines a model from a schema definition, with connections.

All arguments in position 1 to last-1 will be treated as
connection declatations. Last argument is the schema definition.

A connection declaration is either a String with the name
of the connected model, or an Array containing one String
with the name of the connected model.

Examples:
model('Post', 'Author', {...});
model('Essay', ['Author'], 'Institute', {...});
###
model = (name, rest...) ->
	# last argument is the schema template
	schemaTemplate = rest[rest.length - 1]
	modelTemplates[name] = schemaTemplate

	# save connections for later
	for arg in rest[...(rest.length-1)]
		isObj = arg.constructor is Object
		connection = if isObj then arg.m else arg
		if connection.constructor is Array
			field = if isObj then arg.n else connectionName(connection[0])
			connect name, connection[0], field, true
		else
			field = if isObj then arg.n else connectionName(connection)
			connect name, connection, field, false
			connect connection, name, connectionName(name), true

# Returns a reference type
ref = (modelName) ->
	type:ObjectId
	ref:modelName

# Creates all mongoose Models and exports them by name
create = ->
	# create connections in templates
	for from,connectees of connections
		schemaTemplate = modelTemplates[from]
		for name,connection of connectees
			if connection.many?
				schemaTemplate[pluralize name ] = [ ref connection.to ]
			else
				schemaTemplate[name]            =   ref connection.to

	# create mongoose models
	for name,schemaTemplate of modelTemplates
		# add defined common fields
		for common in commons
			schemaTemplate[common.name] = common.type

		# create schema and model
		schema = new Schema(schemaTemplate)
		model = mongoose.model name, schema

		# export model from module
		module.exports[name] = model
		module.exports[name.toLowerCase()] = model

		aliases[name] = name
		aliases[name.toLowerCase()] = name

		console.log 'Defined Model ', name
		for field,declaration of schemaTemplate
			console.log '\t', field, ':', declaration

	searchRoots()
	console.log roots


# module exports
exports.common = common
exports.model = model
exports.ref = ref
exports.create = create
exports.connected = connected
exports.pluralize = pluralize
exports.printHierarchies = printHierarchies
exports.hierarchies = hierarchies
exports.alias = alias
