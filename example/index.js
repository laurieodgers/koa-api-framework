'use strict';
var KoaApiFramework = require('koa-api-framework')

(async () => {
    // set up the framework
    var framework = new KoaApiFramework({
        debug: true,
        tls: false,
        port: 8080,
        //apiBase: 'https://api.foo.com/v2/',
        // pass in the path to the raml file
        raml: './raml/api_specification.raml',
        controllerPath: '/controllers',
        // pass in any models to make them easy to use
        models: {},
        // koa-api-framework will automatically decode Authorization: Bearer [jwt] for you
        jwtSecret: 'qwertyuiopasdfghjklzxcvbnm123456',
        // set which traits will decode the JWT
        authTraits: ['authenticated', 'administrator']
    });

    // run the framework
    await framework.start();
})().catch(e => {
    console.error(e)
});;
