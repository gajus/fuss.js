var Promise = require('promise'),
    Fuss,
    _loaded,
    _loginStatus,
    _;

_loaded = new Promise(function (resolve) {
    window.fbAsyncInit = function () {
        resolve();
    };
});

_ = {};
_.isArray = require('lodash.isArray');
_.difference = require('lodash.difference');

/**
 * @param {Object} config
 * @param {String} config.appId App ID. Required parameter.
 * @param {String} config.version Graph API version. Required parameter.
 * @param {Boolean} config.debug Loads debug version of JavaScript SDK. Default: false.
 */
Fuss = function Fuss (config) {
    var fuss,
        _user = null;

    if (!(this instanceof Fuss)) {
        return new Fuss(config);
    }

    fuss = this;
    config = config || {};

    if (!config.appId) {
        throw new Error('Missing Fuss() config.appId.');
    }

    if (!config.version) {
        throw new Error('Missing Fuss() config.version.');
    }

    config.debug = !!config.debug;

    _.difference(Object.keys(config), ['appId', 'version', 'debug']).forEach(function (setting) {
        throw new Error('Unknown configuration property ("' + setting + '").');
    });

    /**
     * @param {Boolean} debug Indicates whether to load debug version of the JavaScript SDK.
     */
    fuss._loadOfficialFacebookSDK = function (debug) {
        var script,
            parent;

        if (typeof document !== 'undefined') {
            if (document.getElementById('facebook-jssdk')) {
                throw new Error('Facebook SDK cannot be loaded before Fuss.');
            }

            script = document.createElement('script');
            parent = document.getElementsByTagName('script')[0];
            
            script.id = 'facebook-jssdk';
            
            if (debug) {
                script.src = '//connect.facebook.net/en_US/sdk/debug.js';
            } else {
                script.src = '//connect.facebook.net/en_US/sdk.js';
            }
            
            parent.parentNode.insertBefore(script, parent);
        }
    };

    fuss._loadOfficialFacebookSDK(config.debug);

    _loginStatus = _loaded.then(function () {
        return new Promise(function (resolve) {
            FB.init({
                appId: config.appId,
                cookie: true,
                status: false,
                version: config.version
            });

            // FB.login {status: true} does not make FB.getLoginStatus to do the roundtrip.
            // @see https://developers.facebook.com/docs/reference/javascript/FB.login/v2.2
            // @see https://developers.facebook.com/docs/reference/javascript/FB.getLoginStatus#servers
            fuss
                ._getLoginStatus()
                .then(resolve);            

            /**
             * This event is fired when your app notices that there is no longer a valid
             * user (in other words, it had a session but can no longer validate the current user).
             */
            FB.Event.subscribe('auth.logout', function(response) {
                fuss._invalidateUser();
            });
        });
    });
    
    /**
     * Get and populate the login status.
     * Promise is resolved with _user.
     * 
     * @return {Promise}
     */
    fuss._getLoginStatus = function () {
        return new Promise(function (resolve) {
            FB.getLoginStatus(function (loginStatus) {
                if (loginStatus.status === 'connected') {
                    fuss
                        .batch([
                            {method: 'get', relative_url: 'v2.1/me'},
                            {method: 'get', relative_url: 'v2.1/me/permissions'}
                        ])
                        .then(function (response) {
                            _user = new Fuss.User({
                                me: response[0],
                                permissions: response[1],
                                accessToken: loginStatus.authResponse.accessToken
                            });

                            resolve({status: loginStatus.status});
                        });
                } else {
                    fuss._invalidateUser();

                    resolve({status: loginStatus.status});
                }
            }, true);
        });
    };   

    /**
     * Returns a promise that is resolved as soon as the SDK has completed loading
     * and FB.getLoginStatus is known.
     * 
     * @return {Promise}
     */
    fuss.loaded = function () {
        return _loginStatus;
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
     * {status: 'not_granted_scope', notGrantedScope: []}. When `status` is "not_granted_scope",
     * `notGrantedScope` will have the list of the not granted permissions.
     * 
     * @see https://developers.facebook.com/docs/reference/javascript/FB.login/v2.2
     * @param {Object} options
     * @param {Array} options.scope
     * @param {Boolean} options.enableProfileSelector
     * @param {Array} options.profileSelectorIds
     * @return {Promise}
     */
    fuss.login = function (options) {
        options = options || {};
        options.scope = options.scope || [];
        options.enableProfileSelector = options.enableProfileSelector || false;
        options.profileSelectorIds = options.profileSelectorIds || [];

        _.difference(Object.keys(options), ['scope', 'enableProfileSelector', 'profileSelectorIds']).forEach(function (setting) {
            throw new Error('Unknown fuss.login() option ("' + setting + '").');
        });

        if (!_.isArray(options.scope)) {
            throw new Error('fuss.login() option.scope must be an array.');
        }

        if (!_.isArray(options.profileSelectorIds)) {
            throw new Error('fuss.login() option.profileSelectorIds must be an array.');
        }

        if (typeof options.enableProfileSelector !== 'boolean') {
            throw new Error('fuss.login() option.enableProfileSelector must be a boolean.');
        }

        return new Promise(function (resolve) {
            var user = fuss.getUser();

            // User has not authorized the app or has not granted the required permissions.
            if (!user || user && _.difference(options.scope, user.getGrantedPermissions()).length) {
                return FB.login(function (response) {
                    if (response.status === 'not_authorized') {
                        return resolve({status: 'not_authorized'});
                    }

                    fuss
                        ._getLoginStatus()
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
                    enable_profile_selector: options.enableProfileSelector,
                    profile_selector_ids: options.profileSelectorIds.join(','),
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
     * Scrolls to a specific location of the canvas page,
     * or the document itself, when the script is loaded not in canvas.
     * 
     * @param {Object} offset
     * @param {Number} offset.x
     * @param {Number} offset.y
     */
    fuss.scrollTo = function (offset) {
        offset = offset || {};
        offset.x = offset.x || 0;
        offset.y = offset.y || 0;

        if (!fuss.isInCanvas()) {
            // @todo Document magic constant.
            offset.y += 25;

            FB.Canvas.scrollTo(offset.x, offset.y);
        } else {
            document.body.scrollLeft = document.documentElement.scrollLeft = offset.x;
            document.body.scrollTop = document.documentElement.scrollTop = offset.y;
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
     * @param {String} method The HTTP method to use for the API request. Default: get.
     * @param {Object} parameters Graph API call parameters.
     * @return {Promise}
     */
    fuss.api = function (path) {
        var method = 'get',
            parameters = {};

        // fuss.api({String} url, {String} method, {Object} parameters)
        // fuss.api({String} url, {String} method)
        // fuss.api({String} url, {Object} parameters)
        if (arguments[1]) {
            if (typeof arguments[1] === 'string') {
                method = arguments[1];

                if (arguments[2]) {
                    parameters = arguments[2];
                }
            } else {
                parameters = arguments[1];
            }
        }

        return new Promise(function (resolve, reject) {
            FB.api(path, method, parameters, function (response) {
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
     * @param {String} batch[0].method Default: get.
     * @param {String} batch[0].url
     * @param {String} batch[0].body
     * @return {Promise}
     */
    fuss.batch = function (batch) {
        batch = batch.map(function (request) {
            request.method = request.method || 'get';

            return request;
        });
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
     * @return {String}
     */
    user.getAccessToken = function () {
        return backpack.accessToken;
    };

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

global.gajus = global.gajus || {};
global.gajus.Fuss = Fuss;

module.exports = Fuss;