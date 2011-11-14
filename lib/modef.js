var mongoose = require('mongoose');
var pluralize = require('mongoose/lib/utils.js').toCollectionName;

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var commons = [];
var modelTemplates = {};
var connections = {}, aliases = {};
var roots = {};


/********************************************************************
 * Internal functions
 */

function firstLower(name) { return name.substr(0,1).toLowerCase() + name.substr(1); }
function connectionName(name) { return name.toLowerCase(); }
function alias(name) { return aliases[name]; }
function connected(from) {
	var c = connections[from];
	if (c === undefined) c = connections[aliases[from]];
	if (c === undefined) connections[from] = c = {};
	return c;
}

function connect(name, model, field, many) {
	var from = connected(name);
	if (!from[field] || !from[field].many)
		from[field] = { to: model, many: many };
}

function queueConnections(cs, searchStack, followMany) {
	var ret = false;
	if (cs !== undefined) {
		for (con in cs) {
			var c = cs[con];
			if (c.many == (followMany ? true : false)) {
				searchStack.push(c);
				ret = true;
			}
		}
	}
	return ret;
}

function searchRoots() {
	// console.log(connections, aliases);
	for (name in modelTemplates) {
		// resolve hirarchial roots
		var searchStack = [];
		if (!queueConnections(connections[name], searchStack)) {
			roots[name] = module.exports[name];
		}
		while (searchStack.length > 0) {
			var c = searchStack.pop();
			var cs = connections[c.to];
			if (!queueConnections(cs, searchStack)) {
				roots[c.to] = module.exports[c.to];
			}
		}
	}
}


/********************************************************************
 * Functions for data model hierarchies
 */

function hierarchies() {
	var h = [];
	for (root in roots) {
		function level(nodes, vs, node) {
			var visited = function(v) {
				return function(e) { return !v ^ vs[e.to]; };
			};
			var notVisited = nodes.filter(visited(false));
			notVisited.forEach(function(n,i) {
				var vs2 = {}; for (vf in vs) vs2[vf] = true;
				vs2[n.to] = true;

				var stack = [];
				queueConnections(connections[n.to], stack, true)

				var next = { n: n.to, c: [] };
				node.c.push(next);
				level(stack, vs2, next);
			});
			nodes.filter(visited(true)).forEach(function(n,i) {
				if (node.b === undefined) node.b = [];
				node.b.push(n.to);
			});
		}
		var node = { n: root, c: [] };
		h.push(node);
		var stack = [];
		queueConnections(connections[root], stack, true);
		var vs = {}; vs[root] = true;
		level(stack, vs, node);
	}
	return h;
}

function printHierarchies() {
	function rep( z, o, a ) {
		var s = '';
		a.forEach(function(n) { s += n?o:z; });
		return s;
	}
	function level(nodes, d, node) {
		node.c.forEach(function(n,i) {
			var stack = [];
			queueConnections(connections[node.n], stack, true)

			var line = rep('    ',' |  ',d) + ' `- ' + n.n;
			if (n.b && n.b.length > 0) line += ' -> ' + n.b.join(', ');
			console.log(line);

			var last = i==node.c.length-1;
			d.push(last?0:1);
			var pr = level(stack, d, n);
			d.pop();
		});
	}
	var h = hierarchies();
	h.forEach(function(root)  {
		var stack = [];
		queueConnections(connections[root.n], stack, true);
		console.log(root.n + ' (root)');
		level(stack, [], root);
	});
}


/********************************************************************
 * Exported functions
 */

/**
 * Defines a common field that will be added to all models.
 */
function common(name, type) {
	commons.push({ name: name, type: type });
}

/**
 * Defines a model from a schema definition, with connections.
 *
 * All arguments in position 1 to last-1 will be treated as
 * connection declatations. Last argument is the schema definition.
 *
 * A connection declaration is either a String with the name
 * of the connected model, or an Array containing one String
 * with the name of the connected model.
 * 
 * Examples:
 * model('Post', 'Author', {...});
 * model('Essay', ['Author'], 'Institute', {...});
 */
function model(name /* ... */ ) {
	// last argument is the schema template
	var schemaTemplate = arguments[arguments.length - 1];

	modelTemplates[name] = schemaTemplate;

	// save connections for later
	for (i = 1; i < arguments.length - 1; i++) {
		var arg = arguments[i];
		var isObj = arg.constructor === Object;
		var connection = isObj ? arg.m : arg;
		if (connection.constructor === Array) {
			var field = isObj ? arg.n : connectionName(connection[0]);
			connect(name, connection[0], field, true);
		} else {
			var field = isObj ? arg.n : connectionName(connection);
			connect(name, connection, field, false);
			connect(connection, name, connectionName(name), true);
		}
	}
}

/**
 * Returns a reference type.
 */
function ref(modelName) {
	return { type: ObjectId, ref: modelName };
}

/**
 * Creates all mongoose Models and exports them by name.
 */
function create() {
	// create connections in templates
	for (from in connections) {
		var schemaTemplate = modelTemplates[from];
		for (c in connections[from]) {
			var connection = connections[from][c];
			if (connection.many)
				schemaTemplate[pluralize(c)] = [ ref(connection.to) ];
			else
				schemaTemplate[c]            =   ref(connection.to);
		}
	}

	// create mongoose models
	for (name in modelTemplates) {
		var schemaTemplate = modelTemplates[name];

		// add defined common fields
		commons.forEach(function(common) {
			schemaTemplate[common.name] = common.type;
		})

		// create schema and model
		var schema = new Schema(schemaTemplate);
		var model = mongoose.model(name, schema);

		// export model from module
		module.exports[name] = model;
		module.exports[name.toLowerCase()] = model;

		aliases[name] = name;
		aliases[name.toLowerCase()] = name;

		console.log('Defined Model ' + name);
		for (field in schemaTemplate)
			console.log('\t' + field + ': ' + JSON.stringify(schemaTemplate[field]))
	}

	searchRoots();
}

exports.common = common;
exports.model = model;
exports.ref = ref;
exports.create = create;
exports.connected = connected;
exports.pluralize = pluralize;
exports.printHierarchies = printHierarchies;
exports.hierarchies = hierarchies;
exports.alias = alias;
