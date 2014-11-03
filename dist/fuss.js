/**
 * @version 1.0.0
 * @link https://github.com/gajus/fuss for the canonical source repository
 * @license https://github.com/gajus/fuss/blob/master/LICENSE BSD 3-Clause
 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],2:[function(require,module,exports){
'use strict';

module.exports = require('./lib/core.js')
require('./lib/done.js')
require('./lib/es6-extensions.js')
require('./lib/node-extensions.js')
},{"./lib/core.js":3,"./lib/done.js":4,"./lib/es6-extensions.js":5,"./lib/node-extensions.js":6}],3:[function(require,module,exports){
'use strict';

var asap = require('asap')

module.exports = Promise;
function Promise(fn) {
  if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new')
  if (typeof fn !== 'function') throw new TypeError('not a function')
  var state = null
  var value = null
  var deferreds = []
  var self = this

  this.then = function(onFulfilled, onRejected) {
    return new self.constructor(function(resolve, reject) {
      handle(new Handler(onFulfilled, onRejected, resolve, reject))
    })
  }

  function handle(deferred) {
    if (state === null) {
      deferreds.push(deferred)
      return
    }
    asap(function() {
      var cb = state ? deferred.onFulfilled : deferred.onRejected
      if (cb === null) {
        (state ? deferred.resolve : deferred.reject)(value)
        return
      }
      var ret
      try {
        ret = cb(value)
      }
      catch (e) {
        deferred.reject(e)
        return
      }
      deferred.resolve(ret)
    })
  }

  function resolve(newValue) {
    try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.')
      if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
        var then = newValue.then
        if (typeof then === 'function') {
          doResolve(then.bind(newValue), resolve, reject)
          return
        }
      }
      state = true
      value = newValue
      finale()
    } catch (e) { reject(e) }
  }

  function reject(newValue) {
    state = false
    value = newValue
    finale()
  }

  function finale() {
    for (var i = 0, len = deferreds.length; i < len; i++)
      handle(deferreds[i])
    deferreds = null
  }

  doResolve(fn, resolve, reject)
}


function Handler(onFulfilled, onRejected, resolve, reject){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null
  this.onRejected = typeof onRejected === 'function' ? onRejected : null
  this.resolve = resolve
  this.reject = reject
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, onFulfilled, onRejected) {
  var done = false;
  try {
    fn(function (value) {
      if (done) return
      done = true
      onFulfilled(value)
    }, function (reason) {
      if (done) return
      done = true
      onRejected(reason)
    })
  } catch (ex) {
    if (done) return
    done = true
    onRejected(ex)
  }
}

},{"asap":7}],4:[function(require,module,exports){
'use strict';

var Promise = require('./core.js')
var asap = require('asap')

module.exports = Promise
Promise.prototype.done = function (onFulfilled, onRejected) {
  var self = arguments.length ? this.then.apply(this, arguments) : this
  self.then(null, function (err) {
    asap(function () {
      throw err
    })
  })
}
},{"./core.js":3,"asap":7}],5:[function(require,module,exports){
'use strict';

//This file contains the ES6 extensions to the core Promises/A+ API

var Promise = require('./core.js')
var asap = require('asap')

module.exports = Promise

/* Static Functions */

function ValuePromise(value) {
  this.then = function (onFulfilled) {
    if (typeof onFulfilled !== 'function') return this
    return new Promise(function (resolve, reject) {
      asap(function () {
        try {
          resolve(onFulfilled(value))
        } catch (ex) {
          reject(ex);
        }
      })
    })
  }
}
ValuePromise.prototype = Promise.prototype

var TRUE = new ValuePromise(true)
var FALSE = new ValuePromise(false)
var NULL = new ValuePromise(null)
var UNDEFINED = new ValuePromise(undefined)
var ZERO = new ValuePromise(0)
var EMPTYSTRING = new ValuePromise('')

Promise.resolve = function (value) {
  if (value instanceof Promise) return value

  if (value === null) return NULL
  if (value === undefined) return UNDEFINED
  if (value === true) return TRUE
  if (value === false) return FALSE
  if (value === 0) return ZERO
  if (value === '') return EMPTYSTRING

  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then
      if (typeof then === 'function') {
        return new Promise(then.bind(value))
      }
    } catch (ex) {
      return new Promise(function (resolve, reject) {
        reject(ex)
      })
    }
  }

  return new ValuePromise(value)
}

Promise.all = function (arr) {
  var args = Array.prototype.slice.call(arr)

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([])
    var remaining = args.length
    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then
          if (typeof then === 'function') {
            then.call(val, function (val) { res(i, val) }, reject)
            return
          }
        }
        args[i] = val
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex)
      }
    }
    for (var i = 0; i < args.length; i++) {
      res(i, args[i])
    }
  })
}

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) { 
    reject(value);
  });
}

Promise.race = function (values) {
  return new Promise(function (resolve, reject) { 
    values.forEach(function(value){
      Promise.resolve(value).then(resolve, reject);
    })
  });
}

/* Prototype Methods */

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
}

},{"./core.js":3,"asap":7}],6:[function(require,module,exports){
'use strict';

//This file contains then/promise specific extensions that are only useful for node.js interop

var Promise = require('./core.js')
var asap = require('asap')

module.exports = Promise

/* Static Functions */

Promise.denodeify = function (fn, argumentCount) {
  argumentCount = argumentCount || Infinity
  return function () {
    var self = this
    var args = Array.prototype.slice.call(arguments)
    return new Promise(function (resolve, reject) {
      while (args.length && args.length > argumentCount) {
        args.pop()
      }
      args.push(function (err, res) {
        if (err) reject(err)
        else resolve(res)
      })
      fn.apply(self, args)
    })
  }
}
Promise.nodeify = function (fn) {
  return function () {
    var args = Array.prototype.slice.call(arguments)
    var callback = typeof args[args.length - 1] === 'function' ? args.pop() : null
    var ctx = this
    try {
      return fn.apply(this, arguments).nodeify(callback, ctx)
    } catch (ex) {
      if (callback === null || typeof callback == 'undefined') {
        return new Promise(function (resolve, reject) { reject(ex) })
      } else {
        asap(function () {
          callback.call(ctx, ex)
        })
      }
    }
  }
}

Promise.prototype.nodeify = function (callback, ctx) {
  if (typeof callback != 'function') return this

  this.then(function (value) {
    asap(function () {
      callback.call(ctx, null, value)
    })
  }, function (err) {
    asap(function () {
      callback.call(ctx, err)
    })
  })
}

},{"./core.js":3,"asap":7}],7:[function(require,module,exports){
(function (process){

// Use the fastest possible means to execute a task in a future turn
// of the event loop.

// linked list of tasks (single, with head node)
var head = {task: void 0, next: null};
var tail = head;
var flushing = false;
var requestFlush = void 0;
var isNodeJS = false;

function flush() {
    /* jshint loopfunc: true */

    while (head.next) {
        head = head.next;
        var task = head.task;
        head.task = void 0;
        var domain = head.domain;

        if (domain) {
            head.domain = void 0;
            domain.enter();
        }

        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function() {
                   throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    flushing = false;
}

if (typeof process !== "undefined" && process.nextTick) {
    // Node.js before 0.9. Note that some fake-Node environments, like the
    // Mocha test runner, introduce a `process` global without a `nextTick`.
    isNodeJS = true;

    requestFlush = function () {
        process.nextTick(flush);
    };

} else if (typeof setImmediate === "function") {
    // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
    if (typeof window !== "undefined") {
        requestFlush = setImmediate.bind(window, flush);
    } else {
        requestFlush = function () {
            setImmediate(flush);
        };
    }

} else if (typeof MessageChannel !== "undefined") {
    // modern browsers
    // http://www.nonblocking.io/2011/06/windownexttick.html
    var channel = new MessageChannel();
    channel.port1.onmessage = flush;
    requestFlush = function () {
        channel.port2.postMessage(0);
    };

} else {
    // old browsers
    requestFlush = function () {
        setTimeout(flush, 0);
    };
}

function asap(task) {
    tail = tail.next = {
        task: task,
        domain: isNodeJS && process.domain,
        next: null
    };

    if (!flushing) {
        flushing = true;
        requestFlush();
    }
};

module.exports = asap;


}).call(this,require("1YiZ5S"))
},{"1YiZ5S":1}],8:[function(require,module,exports){
(function (global){
var Promise = require('promise'),
    Fuss;

Fuss = function Fuss (env) {
    var fuss,
        loaded;

    if (!(this instanceof Fuss)) {
        return new Fuss(env);
    }

    fuss = this;
    env = env || {};

    if (!env.appId) {
        throw new Error('Missing appId.');
    }

    loaded = new Promise(function (resolve) {
        window.fbAsyncInit = function () {
            FB.init({
                appId: env.appId,
                cookie: true,
                status: false,
                version: 'v2.1'
            });
            // FB.login {status: true} is supposed to do this.
            // This is a defensive approach to avoid whatever cache Facebook SDK may impose.
            // @see https://developers.facebook.com/docs/reference/javascript/FB.login/v2.2
            // @see https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus#servers
            FB.getLoginStatus(function (response) {
                if (response.status === 'connected') {
                    Fuss
                        .batch([
                            {method: 'get', relative_url: '/me'},
                            {method: 'get', relative_url: '/me/permissions'}
                        ])
                        .then(function (response) {
                            env.user = new Fuss.User({
                                me: response[0],
                                permissions: response[1]
                            });
                        });
                } else {
                    resolve();
                }
            }, true);

            /**
             * This event is fired when your app notices that there is no longer a valid
             * user (in other words, it had a session but can no longer validate the current user).
             */
            FB.Event.subscribe('auth.logout', function(response) {
                env.user = null;
            });
        };
    });

    /**
     * Returns a promise that is resolved as soon as the SDK has completed loading and FB.getLoginStatus is known.
     * 
     * @return {Promise}
     */
    fuss.loaded = function () {
        return loaded;
    };

    /**
     * If user has authorized the app, returns an instance of Fuss.User.
     * 
     * @return {Null}
     * @return {Fuss.User}
     */
    fuss.getUser = function () {
        if (!env.user) {
            return null;
        }

        // @todo
    };

    /**
     * @param {Object} options
     * @param {Function} options.callback
     * @param {Array} options.scope
     */
    fuss.login = function (options) {
        var user = fuss.getUser();

        if (!user) {
        }
    };

    /**
     * Scrolls to a specific location of your document or canvas page.
     * 
     * @param {Object} offset
     * @param {Number} offset.x
     * @param {Number} offset.y
     */
    fuss.scrollTo = function (offset) {
        var stepsLength = 2,
            stepsUpdate = 0,
            steps = {};

        offset = offset || {};
        offset.x = offset.x || 0;
        offset.y = offset.y || 0;

        if (!fuss.isInCanvas()) {
            $('body')
                .animate({
                    scrollLeft: offset.x,
                    scrollTop: offset.y
                }, {
                    duration: 500
                });
            
        } else {
            // @todo Document magic constant.
            y += 25;
            
            FB.Canvas.getPageInfo(function(pageInfo){
                $({
                    x: pageInfo.scrollLeft,
                    y: pageInfo.scrollTop
                }).animate(
                    {
                        x: offset.x,
                        y: offset.y
                    },
                    {
                        duration: 500,
                        step: function (now, fx) {
                            steps[fx.prop] = now;

                            if (++stepsUpdate == stepsLength) {
                                stepsUpdate = 0;

                                FB.Canvas.scrollTo(steps.x, steps.y);
                            }
                        }
                    }
                );
            });
        }
    };

    /**
     * Returns true if script is loaded inside Facebook canvas.
     *
     * @return {Boolean}
     */
    fuss.isInCanvas = function () {
        return top !== self;
    };
};

/**
 * Returns a promise that is resolved if all requests resolve with status code 200.
 * 
 * @see https://developers.facebook.com/docs/graph-api/making-multiple-requests#multiple_methods
 * @param {Array} batch
 * @param {String} batch[0].method
 * @param {String} batch[0].url
 * @return {Promise}
 */
Fuss.batch = function (batch) {
    return new Promise(function (resolve, reject) {
        FB.api('/', 'post', {
            batch: batch,
            include_headers: false
        }, function (response) {
            var j = response.length,
                resolution = [];

            while (j--) {
                response[j].body = JSON.parse(response[j].body);

                if (response[j].body.error) {
                    return reject(new Fuss.Error(response[j].body.message, response[j].body.type, response[j].body.code));
                }

                resolution.unshift(response[j].body);
            }

            resolve(resolution);
        });
    });
};

Fuss.Error = function (message, type, code) {
    this.code = code;
    this.message = message;
    this.type = type;
};

/**
 * @param {Array} backpack
 * @param {Object} backpack.me /me
 * @param {Object} backpack.permissions /me/permissions
 */
Fuss.User = function User (backpack) {
    var user;

    if (!(this instanceof User)) {
        return new User(backpack);
    }

    user = this;

    /**
     * @see https://developers.facebook.com/docs/facebook-login/permissions/v2.2#reference
     * @return {Object}
     */
    user.getPublicProfile = function () {
        return {
            id: backpack.me.id,
            first_name: backpack.me.first_name,
            last_name: backpack.me.last_name,
            link: backpack.me.link,
            gender: backpack.me.gender,
            local: backpack.me.local,
            age_range: backpack.me.age_range
        };
    };

    /**
     * Return list of granted permissions.
     * 
     * @return {Array}
     */
    user.getGrantedPermissions = function () {
        var permissions = [];

        backpack.permissions.data.forEach(function (permission) {
            if (permission.status === 'granted') {
                permissions.push(permission.permission);
            }
        });

        return permissions;
    };

    return user;
};

if (typeof document !== 'undefined') {
    (function(d, s, id){
     var js, fjs = d.getElementsByTagName(s)[0];
     if (d.getElementById(id)) {return;}
     js = d.createElement(s); js.id = id;
     js.src = "//connect.facebook.net/en_US/sdk.js";
     fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
}

global.gajus = global.gajus || {};
global.gajus.Fuss = Fuss;

module.exports = Fuss;
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"promise":2}]},{},[8])