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
            resolve();
        };
    });

    /**
     * Returns a promise that is resolved as soon as the SDK has completed loading.
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

    fuss.loaded().then(function () {
        FB.init({
          appId: env.appId,
          xfbml: true,
          version: 'v2.1'
        });
    });
};

Fuss.User = function User () {
    var user;

    if (!(this instanceof User)) {
        return new User();
    }

    user = this;

    return user;
};

(function(d, s, id){
 var js, fjs = d.getElementsByTagName(s)[0];
 if (d.getElementById(id)) {return;}
 js = d.createElement(s); js.id = id;
 js.src = "//connect.facebook.net/en_US/sdk.js";
 fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));

global.gajus = global.gajus || {};
global.gajus.Fuss = Fuss;

module.exports = Fuss;