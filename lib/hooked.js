var events = require('events')
, oops     = require('node-oops')
, dbc      = oops.dbc
, defines  = oops.create
;

function Hooks(options) {
	Hooks.super_.call(this);

	defines(this).value('_hooks', { });
	if (options && options.unhooked) {
		dbc(Array.isArray(options.unhooked), "options.unhooked must be an array");
		defines(this).value('_unhooked', options.unhooked.slice(0));
	}
	if (options && options.nonbefore) {
		dbc(Array.isArray(options.nonbefore), "options.nonbefore must be an array");
		defines(this).value('_nonbefore', options.nonbefore.slice(0));
	}
	if (options && options.noevent) {
		dbc(Array.isArray(options.noevent), "options.noevent must be an array");
		defines(this).value('_noevent', options.noevent.slice(0));
	}
}
oops.inherits(Hooks, events.EventEmitter);

function copyOnWrite(hooks, when, item) {
	var updated = hooks[when].slice(0);
	updated.push(item);
	hooks[when] = updated;
}

// adapt the recommended delaying mechanism...
var delay = (process && typeof process.nextTick === 'function')
? process.nextTick
: function(delay) { setTimeout(delay, 0); }
;

function ensureConfigurable(it, name) {
	var descriptor = Object.getOwnPropertyDescriptor(it, name);
	if (descriptor && !descriptor.configurable) {
		throw new TypeError('target has a non-configurable property obstructing the operation.');
	}
	return descriptor;
}

function _ensureMethodHook(method) {
	var hooks = this._hooks, hook, that = this;
	if (typeof hooks[method] === 'undefined') {
		var orig = this[method];
		dbc(typeof orig === 'function', function(){return 'Member `'.concat(method, '` is not a function, therefore it cannot be hooked.'); });
		dbc((!this._unhooked) || this._unhooked.indexOf(method) < 0, function() {
			return 'Method `'.concat(method, '` is ineligible for hooks.');
		});
		var noevent = this._noevent && this._noevent.indexOf(method) >= 0;

		var descriptor = ensureConfigurable(this, method) || {};
		hooks[method] = hook = { before: [], after: [] };
		orig = orig.bind(this);

		descriptor.value = function(obj, callback) {
			var cb = function(err, res) {
				if (err) {
					that.emit('error', err);
				} else if (!noevent) {
					that.emit(method, res);
				}
				if (callback) {
					callback(err || null, res);
				}
			};
			that._runBeforeHooks(obj, cb, hook.before, function() {
				orig(obj, function(err, res) {
					if (err) {
						that.emit('error', err);
						callback(err);
					} else {
						that._runAfterHooks(err, res, hook.after, cb);
					}
				});
			});
		};
		Object.defineProperty(this, method, descriptor);
	}
}

function before(method, hook) {
	dbc([typeof method === 'string', method.length > 0], 'method must be a non-empty string.');
	dbc([typeof hook === 'function'], 'method must be a function.');
	if (this._nonbefore && this._nonbefore.indexOf(method) >= 0) {
		throw new Error('Method `'.concat(method, '` is ineligible for before hooks.'));
	}
	this._ensureMethodHook(method);
	copyOnWrite(this._hooks[method], 'before', hook);
	return this;
}

function after(method, hook) {
	dbc([typeof method === 'string', method.length > 0], 'method must be a non-empty string.');
	dbc([typeof hook === 'function'], 'method must be a function.');
	this._ensureMethodHook(method);
	copyOnWrite(this._hooks[method], 'after', hook);
	return this;
}

function _runBeforeHooks(obj, callback, seq, then) {
	var that = this;
	if (seq.length) {
		(function loop(n) {
			if (n >= seq.length) {
				then();
			} else {
				var it = seq[n];
				try {

					if (it && it.length === 2) {
						it(obj, function(e, obj) {
							if (e || obj) {
								if (callback) {
									delay(function() {callback(e, obj);});
								}
							} else {
								delay(function() {loop(n + 1);});
							}
						});
					} else if (it && it.length === 1) {
						var res = it(obj);
						if (res === true) {
							delay(function() {loop(n + 1);});
						} else {
							if (callback) {
								delay(function() {
									callback(res || new Error(
										'Operation was canceled before it ran: '.concat(that.name)));
								});
							}
						}
					} else {
						then();
					}
				} catch (e) {
					if (callback) { callback(e); }
					else { throw e; }
				}
			}
		}(0));
	} else {
		then();
	}
}

function _runAfterHooks(err, res, seq, then) {
	if (seq.length) {
		(function loop(n) {
			if (n >= seq.length) {
				then(null, res);
			} else {
				var it = seq[n];
				try {
					if (it && it.length === 3) {
						it(err, res, function(err, res) {
							if (err) { then(err, res); }
							else {
								delay(function() {loop(n + 1);});
							}
						});
					} else {
						then(null, res);
					}
				} catch (e) {
					then(e);
				}
			}
		}(seq));
	} else {
		then(null, res);
	}
}

defines(Hooks).enumerable
.method(before)
.method(after);

defines(Hooks)
.method(_ensureMethodHook)
.method(_runBeforeHooks)
.method(_runAfterHooks);

module.exports.Hooks = Hooks;