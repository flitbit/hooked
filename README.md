# hooked
A simple javascript/node.js module for attaching before and after hooks over functions.

_or should I say, yet another..._

##Features

As a base type, any method defined on derived types can be hooked. Supports both `before` and `after` hooks.

Any hooked method, when invoked, will also cause an event to fire, the event's name is the same as the hooked method's name.

Constructor options enable subclasses to mark methods as ineligible for hooks, ineligible for before hooks, ineligible for after hooks, and whether corresponding events should be fired.
