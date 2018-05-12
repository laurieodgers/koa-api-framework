'use strict';

(async () => {
    var KoaApiFramework = require('../index');
    
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

    // run the framework
    await framework.start();
})().catch(e => {
    console.error(e);
});;
