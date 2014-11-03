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