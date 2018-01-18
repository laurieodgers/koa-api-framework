'use strict';
var KoaApiFramework = require('../index')
var co = require("co");


co(function* () {
    // set up the framework
    var framework = new KoaApiFramework({
        debug: true,
        tls: false,
        port: 8080,
        apiBase: 'https://api.foo.com/v2/',
        raml: './tests/raml/api_specification.raml',
        controllerPath: '/tests/controllers',
        models: {},
        jwtSecret: 'qwertyuiopasdfghjklzxcvbnm123456',
        authTraits: ['authenticated', 'administrator']
    });

    yield framework.start();
});
