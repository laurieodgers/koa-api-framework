# Description

An API framework using Koa. This will build an API framework based off a RAML 0.8 file, applying any JSON schemas on incoming data to make validation simpler.



# Necessary files to work
These may be passed in as arguments to koa-api-framework in the future. I am open to suggestions on how to make this more user friendly.
/raml/api.raml - the RAML specification for the API
/controllers/ - controllers based off the api structure. Eg an api structure of https://api.foo.com/v2/auth will require /controllers/auth/index.js

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
