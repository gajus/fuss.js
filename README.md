# Fuss.js

[![Build Status](https://travis-ci.org/gajus/url-regexp.png?branch=master)](https://travis-ci.org/gajus/url-regexp)
[![NPM version](https://badge.fury.io/js/fuss.svg)](http://badge.fury.io/js/fuss)
[![Bower version](https://badge.fury.io/bo/fuss.svg)](http://badge.fury.io/bo/fuss)

Extended Facebook JavaScript SDK. Provides intuitive API for handling user authorization, batch requests; represents the asynchronous operations using promises.

Fuss.js is an extension of a server side library [Fuss](https://github.com/gajus/fuss).

## Usage

Fuss will load and initialize [Facebook JavaScript SDK](https://developers.facebook.com/docs/javascript/quickstart/v2.2) for you. 

```js
/**
 * @param {Object} env
 * @param {String} env.appId
 */
var fuss = Fuss({appId: 'your-app-id'});
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

## API

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
 * {status: 'not_granted_scope', notGrantedScope: []}.
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
 * @param {Object} options
 * @param {String} options.method The HTTP method to use for the API request. Default: get.
 * @param {Object} options.params Graph API call parameters.
 * @return {Promise}
 */
fuss.api();

/**
 * Makes a batch call against the Graph API.
 * 
 * @see https://developers.facebook.com/docs/graph-api/making-multiple-requests#multiple_methods
 * @param {Array} batch
 * @param {String} batch[0].method
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

## Download

Using [Bower](http://bower.io/):

```sh
bower install fuss
```

Using [NPM](https://www.npmjs.org/):

```sh
npm install fuss
```

The old-fashioned way, download either of the following files:

* https://raw.githubusercontent.com/gajus/fuss/master/dist/fuss.js
* https://raw.githubusercontent.com/gajus/fuss/master/dist/fuss.min.js