[![Build Status](https://travis-ci.org/laurieodgers/koa-api-framework.svg?branch=master)](https://travis-ci.org/laurieodgers/koa-api-framework)

# Description

An API framework using Koa. This will build an API framework based off a RAML 0.8 file, applying any JSON schemas on incoming data to make validation simpler.

# Features
## Build an API from a RAML specification
Place your RAML file within raml/api.raml in your project's directory. Currently koa-api-framework has only been tested against RAML 0.8 files.

## Validate Data Submitted to API
Automatic validation of incoming JSON data is performed if you specify the JSON schema within the api.raml file. This removes the need for validation within each individual endpoint controller.

## Automatic JWT decoding
Set RAML traits on your endpoints to indicate that a JWT is required. Any incoming `Authorization: Bearer (jwt)` headers for these endpoints will automatically decode the given JWT and place it within this.token.

# Necessary files
These may be passed in as arguments to koa-api-framework in the future. I am open to suggestions on how to make this more user friendly.
s
- /controllers/ - controllers based off the api structure. Eg an API structure of https://api.foo.com/v2/auth will require /controllers/auth/index.js. More information can be gained from the example given under /example.

# Returning data to the client
- `this.data` within your controllers allows you to return data to the client
- Any errors thrown within your controllers will be caught by the framework in order to always present JSON to the client. To throw an error and return a HTTP status code and message to the client, use `throw new Error("418:I'm a teapot!");` where 418 is the status code, and "I'm a teapot!" is the error message to the user.

# Example
An example can be found under /example.

# Installation
Using npm:
```
npm install --save koa-api-framework
```

In Node.js:
```
var KoaApiFramework = require('koa-api-framework');

// set up the framework
var framework = new KoaApiFramework({
    // disable extra debug logging
    debug: false,
    // enable SSL/TLS
    tls: true,
    // the ssl/tls private key
    tlsKeyPath: '/path/to/tls/key/server.key',
    // the ssl/tls certificate path
    tlsCertPath: '/path/to/tls/cert/server.crt',
    port: 443,
    // pass in a path to a raml file
    // DEFAULT: './raml/api.raml'
    raml: './raml/api.raml',
    apiBase: 'https://api.foo.com/v2',
    // pass in any models to make them easy to use
    models: {
        auth: auth,
        person: person,
        group: group
    },
    // specify where the controllers are in the filesystem
    // DEFAULT: ./controllers
    controllerPath: '/ctrl',
    // koa-api-framework will automatically decode Authorization: Bearer [jwt] for you
    // for endpoints which are specified in 'authTraits'
    jwtSecret: 'qwertyuiopasdfghjklzxcvbnm123456',
    // set which traits will decode the JWT
    // DEFAULT: ['authenticated']
    authTraits: ['authenticated', 'administrator', 'myAuthenticatedTrait']
});

```
