# Fuss.js

[![Build Status](https://travis-ci.org/gajus/url-regexp.png?branch=master)](https://travis-ci.org/gajus/url-regexp)
[![NPM version](https://badge.fury.io/js/fuss.svg)](http://badge.fury.io/js/fuss)
[![Bower version](https://badge.fury.io/bo/fuss.svg)](http://badge.fury.io/bo/fuss)

Library for handling Facebook user authorization. Fuss.js is an extension of server side library [Fuss](https://github.com/gajus/fuss).

## API

```js
var fuss = Fuss();

/**
 * Returns a promise that is resolved as soon as the SDK has completed loading and FB.getLoginStatus is known.
 * 
 * @return {Promise}
 */
fuss.loaded();

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

/**
 * If user has authorized the app, returns an instance of Fuss.User.
 * 
 * @return {Null}
 * @return {Fuss.User}
 */
fuss.getUser();
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