# hooked
A simple javascript/node.js module for attaching before and after hooks over functions.

_or should I say, yet another..._

##Features

Derives from EventEmitter, and intended to be used as a base type.

Methods defined on derived types can be hooked with `before` and `after` hooks.

Unless disallowed, hooked methods also emit a corresponding event upon success.

Hooked methods will raise `error` events upon error.

Constructor options enable subclasses to mark methods as ineligible for hooks, ineligible for before hooks, ineligible for after hooks, and whether corresponding events should be fired.

##`before` Hooks

Two types of **before** hooks can be attached to a method, predicate hooks and pipeline hooks.

### Predicate `before` Hooks

`before` hooks with an arity of one (function/1) are assumed to be predicates. Any result returned from predicate hooks are evaluated for truthiness. If truthy it indicates the method should continue; otherwise it is canceled.

```javascript
var util = require('util')
, assert = require('assert')
, Hooks  = require('../').Hooks;

var logger  = new Hooks();

// observe the errors as they occur...
logger.on('error', function(e) {
	console.log("".concat(new Date().toISOString(), ": observed error event - ", util.inspect(e, false, 10)));
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
2013-01-10T15:43:02.820Z: 'Nothing important here.'
2013-01-10T15:43:02.824Z: observed canceled event - { error: 'canceled',
  method: 'log',
  reason: 'Canceled by predicate.' }
2013-01-10T15:43:02.825Z: { some: { data: [ 'this', 'is', { number: 4 } ] } }
2013-01-10T15:43:02.825Z: observed canceled event - { error: 'canceled',
  method: 'log',
  reason: 'Canceled by predicate.' }
2013-01-10T15:43:02.826Z: 'all done now'
*/
```

### Pipeline `before` Hooks

