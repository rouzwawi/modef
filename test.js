var mongoose = require('mongoose');
var mongooseDb = mongoose.connect('mongodb://localhost/blog');

var modef = require('modef')
modef.model('A', {a:String})
modef.model('B', 'A', {b:String})
modef.create()
modef.printHierarchies()
