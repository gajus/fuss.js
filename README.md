<!--
This file has been generated using GitDown (https://github.com/gajus/gitdown).
Direct edits to this will be be overwritten. Look for GitDown markup file under ./.gitdown/ path.
-->
<h1 id="fuss-js">Fuss.js</h1>

[![Travis build status](http://img.shields.io/travis/gajus/fuss.js/master.svg?style=flat)](https://travis-ci.org/gajus/fuss.js)
[![NPM version](http://img.shields.io/npm/v/fuss.svg?style=flat)](https://www.npmjs.org/package/fuss)
[![Bower version](http://img.shields.io/bower/v/fuss.svg?style=flat)](http://bower.io/search/?q=fuss)

Extended Facebook JavaScript SDK. Provides intuitive API for handling user authorization, batch requests; represents the asynchronous operations using promises.

Fuss.js is an extension of a server side library [Fuss](https://github.com/gajus/fuss).

<h2 id="fuss-js-usage">Usage</h2>

Fuss will load and initialize [Facebook JavaScript SDK](https://developers.facebook.com/docs/javascript/quickstart/v2.2) for you. 

```js
/**
 * @param {Object} env
 * @param {String} env.appId
 * @param {String} env.version
 */
var fuss = Fuss({
    appId: 'your-app-id',
    version: 'v2.1'
});
```

When using Fuss.js, do not attempt to set `fbAsyncInit` or dynamically load the SDK:

```js
// Not needed when using Fuss.js
window.fbAsyncInit = function() {
    FB.init({
        appId: 'your-app-id',
        xfbml: true,
        version: 'v2.1'
    });
};

// Not needed when using Fuss.js
(function(d, s, id){
var js, fjs = d.getElementsByTagName(s)[0];
if (d.getElementById(id)) {return;}
js = d.createElement(s); js.id = id;
js.src = "//connect.facebook.net/en_US/sdk.js";
fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
```

After you have initialized an instance of Fuss, you can access the `FB`.

```js
fuss
    .loaded();
    .then(function () {
        FB.Event.subscribe('edge.create', console.log);
    });
```

`fuss.loaded()` is a [promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) equivalent of [`window.fbAsyncInit`](https://developers.facebook.com/docs/javascript/quickstart/v2.2#advancedsetup). The difference is that you are not running at risk of overwriting the callback function and you do not need to worry about attaching a listener after Facebook has been loaded.

<h3 id="fuss-js-usage-authorizing-user">Authorizing User</h3>

`fuss.login()` prompts user to authenticate the application using the [Login Dialog](https://developers.facebook.com/docs/reference/dialogs/oauth/).

`fuss.login()` will prompt the login dialog if called with scope that user has not granted.

Promise is resolved with `{status: 'not_authorized'}`, `{status: 'authorized'}` or `{status: 'not_granted_scope', notGrantedScope: []}`. When `status` is "not_granted_scope", `notGrantedScope` will have the list of the not granted permissions.

```js
fuss
    .login({scope: ['email']})
    .then(function (response) {
        if (response.status === 'authorized') {
            // Ok
        } else if (response.status === 'not_authorized') {
            // User has not authorized the app.
        } else if (response.status === 'not_granted_scope') {
            // User has authorized the app, but has not authorized all of the scope.

            // List of not granted extended permissions.
            response.notGrantendScope;
        }
    });
```

<h3 id="fuss-js-usage-making-batch-requests">Making Batch Requests</h3>

Making a batch request using `fuss.batch()` will return a promise that is resolved when all of the requests are resolved.

```js
fuss
    .batch([
        {url: 'me'},
        {url: 'me/permissions'},
        {url: 'me/feed', method: 'post', data: {message: 'test'}}
    ])
    .then(function (results) {
        results[0]; // me
        results[1]; // me/permissions
        results[2]; // me/feed
    })
    .catch(function (error) {
        console.log(error);
    });
```

Promises work with `fuss.api()` too:

```js
fuss
    .api('me')
    .then(function (me) {
        me;
    })
    .catch(function (error) {
        console.log(error);
    });
```

<h2 id="fuss-js-api">API</h2>

```js
/**
 * Returns a promise that is resolved as soon as the SDK has completed loading
 * and FB.getLoginStatus is known.
 * 
 * @return {Promise}
 */
fuss.loaded();

/**
 * If user has authorized the app, returns an instance of Fuss.User.
 * 
 * @return {Null}
 * @return {Fuss.User}
 */
fuss.getUser();

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
 * @param {Boolean} options.enable_profile_selector
 * @param {Array} options.profile_selector_ids
 * @return {Promise}
 */
fuss.login();

/**
 * Makes a call against the Graph API.
 * 
 * @param {String} path
 * @param {String} method The HTTP method to use for the API request. Default: get.
 * @param {Object} parameters Graph API call parameters.
 * @return {Promise}
 */
fuss.api();

// fuss.api({String} url, {String} method, {Object} parameters);
// fuss.api({String} url, {String} method);
// fuss.api({String} url, {Object} parameters);

/**
 * Makes a batch call against the Graph API.
 * 
 * @see https://developers.facebook.com/docs/graph-api/making-multiple-requests#multiple_methods
 * @param {Array} batch
 * @param {String} batch[0].method Default: get.
 * @param {String} batch[0].url
 * @return {Promise}
 */
fuss.batch();

/**
 * Returns true if script is loaded inside Facebook canvas.
 *
 * @return {Boolean}
 */
fuss.isInCanvas();

/**
 * Scrolls to a specific location of the canvas page,
 * or the document itself, when the script is loaded not in canvas.
 * 
 * @param {Object} offset
 * @param {Number} offset.x
 * @param {Number} offset.y
 */
fuss.scrollTo();
```

<h2 id="fuss-js-download">Download</h2>

Using [Bower](http://bower.io/):

```sh
bower install fuss
```

Using [NPM](https://www.npmjs.org/):

```sh
npm install fuss
```