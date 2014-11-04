var Promise = require('promise'),
    Fuss,
    _;

_ = {};
_.difference = require('lodash.difference');

Fuss = function Fuss (env) {
    var fuss,
        _loaded,
        _user;

    if (!(this instanceof Fuss)) {
        return new Fuss(env);
    }

    fuss = this;
    env = env || {};

    if (!env.appId) {
        throw new Error('Missing appId.');
    }

    _loaded = new Promise(function (resolve) {
        window.fbAsyncInit = function () {
            FB.init({
                appId: env.appId,
                cookie: true,
                status: false,
                version: 'v2.1'
            });

            // FB.login {status: true} does not make FB.getLoginStatus to do the roundtrip.
            // @see https://developers.facebook.com/docs/reference/javascript/FB.login/v2.2
            // @see https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus#servers
            fuss
                .getLoginStatus()
                .then(resolve);            

            /**
             * This event is fired when your app notices that there is no longer a valid
             * user (in other words, it had a session but can no longer validate the current user).
             */
            FB.Event.subscribe('auth.logout', function(response) {
                fuss._invalidateUser();
            });
        };
    });
    
    /**
     * Get and populate the login status.
     * Promise is resolved with _user.
     * 
     * @return {Promise}
     */
    fuss.getLoginStatus = function () {
        return new Promise(function (resolve) {
            FB.getLoginStatus(function (response) {
                if (response.status === 'connected') {
                    fuss
                        .batch([
                            {method: 'get', relative_url: '/me'},
                            {method: 'get', relative_url: '/me/permissions'}
                        ])
                        .then(function (response) {
                            _user = new Fuss.User({
                                me: response[0],
                                permissions: response[1]
                            });

                            resolve({status: response.status});
                        });
                } else {
                    fuss._invalidateUser();

                    resolve({status: response.status});
                }
            }, true);
        });
    }

    /**
     * Returns a promise that is resolved as soon as the SDK has completed loading and FB.getLoginStatus is known.
     * 
     * @return {Promise}
     */
    fuss.loaded = function () {
        return _loaded;
    };

    /**
     * If user has authorized the app, returns an instance of Fuss.User.
     * 
     * @return {Null}
     * @return {Fuss.User}
     */
    fuss.getUser = function () {
        return _user;
    };

    fuss._invalidateUser = function () {
        _user = null;
    };

    /**
     * Prompts user to authenticate the application using the Login Dialog.
     *
     * fuss.login will prompt the login dialog if called with scope that user has not granted.
     *
     * Promise is resolved with {status: 'not_authorized'}, {status: 'authorized'} or
     * {status: 'not_granted_scope', notGrantedScope: []}.
     * 
     * @see https://developers.facebook.com/docs/reference/javascript/FB.login/v2.2
     * @param {Object} options
     * @param {Array} options.scope
     * @param {Boolean} options.enable_profile_selector
     * @param {Array} options.profile_selector_ids
     * @return {Promise}
     */
    fuss.login = function (options) {
        options = options || {};
        options.scope = options.scope || [];
        options.enable_profile_selector = options.enable_profile_selector || false;
        options.profile_selector_ids = options.profile_selector_ids || [];

        return new Promise(function (resolve) {
            var user = fuss.getUser();

            // User has not authorized the app or has not granted the required permissions.
            if (!user || user && _.difference(options.scope, user.getGrantedPermissions()).length) {
                return FB.login(function (response) {
                    if (response.status === 'not_authorized') {
                        return resolve({status: 'not_authorized'});
                    }

                    fuss
                        .getLoginStatus()
                        .then(function () {
                            var notGrantedScope;

                            user = fuss.getUser();

                            notGrantedScope = _.difference(options.scope, user.getGrantedPermissions());

                            if (notGrantedScope.length) {
                                resolve({
                                    status: 'not_granted_scope',
                                    notGrantedScope: notGrantedScope
                                });
                            } else {
                                resolve({
                                    status: 'authorized'
                                });
                            }
                        });
                }, {
                    auth_type: 'rerequest',
                    scope: options.scope.join(','),
                    enable_profile_selector: options.enable_profile_selector,
                    profile_selector_ids: options.profile_selector_ids.join(','),
                    return_scopes: true
                });
            } else {
                resolve({
                    status: 'authorized'
                });
            }
        });
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

    /**
     * Makes a call against the Graph API.
     * 
     * @param {String} path
     * @param {Object} options
     * @param {String} options.method The HTTP method to use for the API request. Default: get.
     * @param {Object} options.params Graph API call parameters.
     * @return {Promise}
     */
    fuss.api = function (path, options) {
        options = options || {};
        options.method = options.method || 'get';
        options.params = options.params || {};
        return new Promise(function (resolve, reject) {
            FB.api(path, options.method, options.params, function (response) {
                if (response.error) {
                    return reject(new Fuss.Error(response.error.message, response.error.type, response.error.code));
                } else {
                    resolve(response);
                }
            });
        });
    };

    /**
     * Makes a batch call against the Graph API.
     * 
     * @see https://developers.facebook.com/docs/graph-api/making-multiple-requests#multiple_methods
     * @param {Array} batch
     * @param {String} batch[0].method
     * @param {String} batch[0].url
     * @return {Promise}
     */
    fuss.batch = function (batch) {
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