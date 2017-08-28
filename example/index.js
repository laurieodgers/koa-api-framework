'use strict';
var KoaApiFramework = require('../index')
var co = require("co");


co(function* () {
    // set up the framework
    var framework = new KoaApiFramework({
        debug: true,
        tls: false,
        port: 8080,
        // pass in the path to the raml file
        raml: './raml/api_specification.raml',
        apiBase: 'http://api.foo.com/v2',
        // pass in any models to make them easy to use
        models: {},
        // koa-api-framework will automatically decode Authorization: Bearer [jwt] for you
        jwtSecret: 'qwertyuiopasdfghjklzxcvbnm123456'
    });

    yield framework.start();
});
