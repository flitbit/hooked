var util = require('util')
, assert = require('assert')
, Hooks  = require('../').Hooks;

var logger  = new Hooks();

// observe the errors as they occur...
logger.on('error', function(e) {
	console.log("".concat(new Date().toISOString(), ": observed error event - ", util.inspect(e, false, 10)));
});

// observe the cancelations as they occur...
logger.on('canceled', function(e) {
	console.log("".concat(new Date().toISOString(), ": observed canceled event - ", util.inspect(e, false, 10)));
});

// Add a function that logs what it is given...
logger.log = function(what) {
	console.log("".concat(new Date().toISOString(), ": ", util.inspect(what, false, 10)));
}

// Add a hook that filters objects containing secrets from being logged...
logger.before('log', function(a) {
	var s = JSON.stringify(a);
	return s.indexOf('secret') < 0;
});

logger.log("Nothing important here.");
logger.log("This is a secret, maybe I should be more discreet.");
logger.log({ some: { data: ["this", "is", { number: 4 }]}});
logger.log({ more: { data: [{ number: 5 }, { and: { a: 'secret'}}]}});
logger.log("all done now");

/*
2013-01-10T15:16:44.626Z: 'Nothing important here.'
2013-01-10T15:16:44.631Z: { some: { data: [ 'this', 'is', { number: 4 } ] } }
2013-01-10T15:16:44.631Z: 'all done now'
*/