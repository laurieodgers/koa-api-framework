# Description

An API framework using Koa. This will build an API framework based off a RAML 0.8 file, applying any JSON schemas on incoming data to make validation simpler.

# Features
## Build an API from a RAML specification
Place your RAML file within raml/api.raml in your project's directory. Currently koa-api-framework has only been tested against RAML 0.8 files.

## Validate Data Submitted to API
Automatic validation of incoming JSON data is performed if you specify the JSON schema within the api.raml file. This removes the need for validation within each individual endpoint controller.

## Automatic JWT decoding
Any incoming `Authorization: Bearer (jwt)` headers which are received will automatically decode the given JWT and place it within this.token.

# Necessary files
These may be passed in as arguments to koa-api-framework in the future. I am open to suggestions on how to make this more user friendly.

- /raml/api.raml - the RAML specification for the API
- /controllers/ - controllers based off the api structure. Eg an API structure of https://api.foo.com/v2/auth will require /controllers/auth/index.js. More information can be gained from the example given under /example.

# Example
An example can be found under /example

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
    debug: false,
    tls: true,
    tlsKeyPath: '/path/to/tls/key/server.key',
    tlsCertPath: '/path/to/tls/cert/server.crt',
    port: 443,
    apiBase: 'https://api.foo.com/v2',
    // pass in any models to make them easy to use
    models: {
        auth: auth,
        person: person,
        group: group
    },
    // koa-api-framework will automatically decode Authorization: Bearer [jwt] for you
    jwtSecret: 'qwertyuiopasdfghjklzxcvbnm123456'
});

```
