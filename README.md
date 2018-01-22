[![Build Status](https://travis-ci.org/laurieodgers/koa-api-framework.svg?branch=master)](https://travis-ci.org/laurieodgers/koa-api-framework)

# koa-api-framework
## Description

An API framework using Koa.

koa-api-framework builds an API framework from a RAML 0.8 file, with automatic payload validation and JWT decoding for your endpoints.

## Features
### An API From RAML
Your API will be constructed based on RAML. Specify the location in ./raml/api.raml or through the `raml` argument to the constructor.

### Simple Request Validation
Automatic validation of incoming JSON data is performed if you specify the JSON schema within your RAML file, removing the need for validation within each individual endpoint.

### Automatic JWT decoding
Set RAML traits on your endpoints to indicate that a JWT is required. Any incoming `Authorization: Bearer (jwt)` headers for these endpoints will automatically decode the given JWT and place it within `this.token`.

## Directory Structure
The controller path may be passed in with `controllerPath` to the constructor. The directory structure underneath must match the part of the path after `apiBase` with respect to the URL.

See /example for a complete example on how to construct your API.

## Returning Data
- `this.data` within your controllers allows you to return data to the client
- Any errors thrown within your controllers will be caught by the framework in order to always present JSON to the client. To throw an error and return a HTTP status code and message to the client, use `throw new Error("418:I'm a teapot!");` where 418 is the status code, and "I'm a teapot!" is the error message to the user.

## Example
A complete example can be found under `/example`.

## Contributing
Contributions are always welcome; if you fix a bug or implement some extra functionality please issue a PR back to https://github.com/laurieodgers/koa-api-framework

## Installation
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
    // HTTP(s) port
    port: 443,
    // pass in a path to a raml file
    // DEFAULT: './raml/api.raml'
    raml: './raml/api.raml',
    // The base URL of this API
    apiBase: 'https://api.foo.com/v2',
    // pass in any models for your constructors to consume
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
