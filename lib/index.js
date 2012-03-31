require('tamejs').register();

module.exports = require('./modef');

var destr = require('./destrruc');
for (f in destr)
	module.exports[f] = destr[f];
