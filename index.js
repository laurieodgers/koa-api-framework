'use strict';
var _ = require("lodash");
var koa = require('koa');
var koaRouter = require('koa-router');
var http = require('http');
var https = require('https');
var fs = require('fs');
var bodyParser = require("koa-body-parser");
var cors = require('koa-cors');
var ramlParser = require('raml-parser');
var jwt = require('jwt-simple');
var JSONValidator = require('jsonschema').Validator;

var v = new JSONValidator();

module.exports = ApiFramework;

function ApiFramework(obj) {
    var self = this;

    self.database = obj.database;
    self.models = obj.models;
    self.jwtSecret = obj.jwtSecret;
    self.pathBase = processUri(obj.apiBase) || '';
    self.raml = obj.raml || './raml/api.raml';
    this.authTraits = obj.authTraits || ['authenticated'];

    // strip trailing slash
    this.controllerPath = obj.controllerPath.replace(/\/+$/,'') || '/controllers';

    obj = _.pick(obj, [
        'tls',
        'tlsKeyPath',
        'tlsCertPath',
        'port',
        'debug'
    ]);
    self.options = obj;

    self.router = new koaRouter();
}

// split out the base path from the given api url
function processUri(uri) {
    if (!uri) {
        return '';
    }
    // remove any trailing slashes
    uri = uri.replace(/\/+$/,'');

    var pathBase = uri.split('://')[1];
    pathBase = pathBase.split('/');
    delete pathBase[0];

    return pathBase.join('/');
}

ApiFramework.prototype.start = function*() {
    var self = this;

    // sanity checks
    if (self.tlsKeyPath && !fs.existsSync(self.tlsKeyPath)) {
        console.log("TLS key does not exist: " + self.tlsKeyPath);
        process.exit(1);
    }
    if (self.tlsCertPath && !fs.existsSync(self.tlsCertPath)) {
        console.log("TLS certificate does not exist: " + self.tlsCertPath);
        process.exit(1);
    }

    var app = new koa();
    app
        .use(cors())
        .use(bodyParser());

    app.use(function*(next) {
        this.db = self.database;
        this.models = self.models;
        this.jwtSecret = self.jwtSecret;
        this.authTraits = self.authTraits;
        this.controllerPath = self.controllerPath;

        // set up data so we can use it downstream
        this.data = {};

        yield next;
    });

    // verify incoming data
    app.use(function*(next) {
        var urlArray = this.request.url.substr(1).split('/');
        this.ramlRef = this.request.url;

        // strip the queryString
        var searchString = this.request.url.split('?')[0];

        // search for this endpoint in our list for easy validation
        for (var i = 0; i < self.endpoints.length; i++) {
            if (
                (self.endpoints[i].method.toLowerCase() == this.request.method.toLowerCase()) &&
                (searchString.toLowerCase().match(self.endpoints[i].regexPath))
            ) {
                this.endpoint = self.endpoints[i];
            }
        }

        if (!this.endpoint) {
            returnError(this, 404, "Endpoint not found");
            return;
        }

        var contentType;

        // validate the content type
        if (this.request.header['content-type']) {
            var contentTypeArray = this.request.header['content-type'].toLowerCase().split(';');
            contentType = contentTypeArray[0];

            // if we don't accept this content type then reject it
            if (contentType != 'application/json') {
                returnError(this, 415, "Content-type '" + contentType + "' not supported");
                return;
            }
        } else if (this.request.header['content-length']) {  // content length is specified but content type is not
            returnError(this, 415, "Content-type not specified");
            return;
        }

        yield next;
    });

    app.use(function*(next) {
        // validate the request body
        if (this.endpoint.requestSchema) {
            if (!this.request.body) {
                throw new Error("400:No data received");
            }

            var validation = v.validate(this.request.body, this.endpoint.requestSchema);

            if (validation.errors.length > 0) {
                throw new Error("400:" + validation.errors.join(", "));
            }
        }
        yield next;
    });

    app.use(function*(next) {
        // process JWT for JWT endpoints
        if (this.endpoint.traits && this.authTraits.some(r=> this.endpoint.traits.indexOf(r) >= 0)> -1) {
            // make sure it has an authorization header
            if (!this.request.header.authorization) {
                returnError(this, 401, "Unauthorized");
                return;
            }

            // remove Bearer from the start of the string
            var jwtString = this.request.header.authorization.replace(/^([Bb][Ee][Aa][Rr][Ee][Rr]\s)/,"");

            try {
                // process jwt and store for later use
                this.token = jwt.decode(jwtString, self.jwtSecret);
            } catch (err) {
                // not a valid JWT
                returnError(this, 400, "Invalid JWT");
                return;
            }

            // make sure the JWT includes a subject
            if (!this.token.sub) {
                // not a valid JWT
                returnError(this, 400, "Invalid JWT - Missing Subject");
                return;
            }
        }

        try {
            yield next;

            // TODO: validate the response body
            /*
            if (this.endpoint.responseSchema) {
                var validation = v.validate(this.request.body, this.endpoint.responseSchema);

                if (validation.errors.length > 0) {
                    throw new Error("400:" + validation.errors.join(", "));
                }
            }*/
        } catch(err) {
            returnError(this, 500, "An internal error occurred", err);
            return;
        }

        // everything worked so return status 200 and the data
        this.status = 200;

        // if the user didn't define this.body then set up a structure for them
        if (!this.body) {
            this.body = {
                statusCode: 200,
                message: '',
                data: this.data
            }
        }
    });

    this.endpointValidation = {
        request: {},
        response: {}
    };

    // parse the raml and set up the API structure
    ramlParser.loadFile(self.raml).then(function(raml) {
        console.log('------');
        console.log(raml.title);
        console.log('------');

        // if the pathBase wasnt provided then retrieve it from RAML
        if (!self.pathBase) {
            self.pathBase = processUri(raml.baseUri);
        }


        self.endpoints = [];

        try {
            processEndpoints(raml.resources, '', '');
        } catch (err) {
            console.error(err);
        }

        app
            .use(self.router.routes())
            .use(self.router.allowedMethods());

        var callback = app.callback();

        var server;

        if (!self.options.tls) {
            server = http.createServer(callback);
        } else {

            try {
                var key = fs.readFileSync(self.options.tlsKeyPath);
                var cert = fs.readFileSync(self.options.tlsCertPath);
            } catch (err) {
                console.error(err);
            }

            server = https.createServer({
                key: key,
                cert: cert
            }, callback);
        }
        server.timeout = 180*60 * 1000;

        server.listen(self.options.port);

        console.log("Listening on port " + self.options.port);
    }, function(error) {
        console.error("Error parsing RAML: " + error);
        process.exit(1);
    });

    // sets up ctx to return an error message
    function returnError(ctx, statusCode, errorMessage, caughtErr) {
        var error;
        var statusCode;

        // err.message is in the format "statusCode:error message"
        if (caughtErr) {
            // check if the message contains a : indicating the user generated it
            if (caughtErr.message.indexOf(':') == 3) {
                error = caughtErr.message.split(':');
                statusCode = parseInt(error[0]);
                errorMessage = error[1];
            } else {
                // this wasnt a user generated error
                if (self.options.debug) {
                    errorMessage = caughtErr.message;
                } else {
                    errorMessage = errorMessage;
                }

                // display to logs
                console.error(caughtErr);
            }
        }

        // handle errors other than our own
        if (isNaN(statusCode)) {
            statusCode = 500;
        }

        ctx.body = {
            status: statusCode,
            message: errorMessage,
            data: {}
        };
        ctx.status = statusCode;

        return;
    }

    // set up routes recursively
    function processEndpoints(resources, parentPath, parentRegex) {
        for (var i = 0; i < resources.length; i++) {
            var routerPath;
            var thisPath;
            var regexPath;

            // handle variables in the uri
            if (resources[i].relativeUri.startsWith('/{') && resources[i].relativeUri.endsWith('}')) {
                var param = resources[i].relativeUri.replace(/\/{/gi, '');
                var param = param.replace(/}/gi, '');

                var thisPath = parentPath;
                var routerPath = self.pathBase + parentPath + '/:' + param;
                var regexPath = parentRegex + '/(.+)';
            } else {
                var thisPath = parentPath + resources[i].relativeUri;
                var routerPath = self.pathBase + thisPath;
                var regexPath = parentRegex + resources[i].relativeUri;
            }

            // check for existence of methods (get/post/put) on this endpoint
            if (resources[i].methods) {

                // get the file and register the routes
                var controllerAbsolutePath = process.cwd() + self.controllerPath + thisPath + '/index';
                try {
                    var endpoints = require(controllerAbsolutePath);
                } catch (err) {
                    if (err.code == 'MODULE_NOT_FOUND') {
                        console.error("ERROR: Controller not found at " + controllerAbsolutePath);
                        process.exit(1);
                    } else {
                        throw err;
                    }
                }

                for (var j = 0; j < resources[i].methods.length; j++) {
                    var method = resources[i].methods[j];
                    var key = resources[i].methods[j].method;

                    if (endpoints.hasOwnProperty(key)) {
                        // print a message showing this endpoint
                        console.log(key.toUpperCase() + ' ' + routerPath);

                        var requestSchema = null;
                        var responseSchema = null;
                        if (method && method.body && method.body['application/json'] && method.body['application/json'].schema) {
                            requestSchema = JSON.parse(method.body['application/json'].schema);
                        }
                        if (method && method.responses && method.responses['200'] && method.responses['200'].body && method.responses['200'].body['application/json'] && method.responses['200'].body['application/json'].schema) {
                            responseSchema = JSON.parse(method.responses['200'].body['application/json'].schema);
                        }

                        // save endpoint data for processing incoming requests
                        self.endpoints.push({
                            path: thisPath,
                            regexPath: '^' + self.pathBase + regexPath + '$',
                            method: key,
                            traits: resources[i].methods[j].is,
                            requestSchema: requestSchema,
                            responseSchema: responseSchema
                        });

                        // register the endpoint
                        self.router[key](routerPath, endpoints[key]);
                    }
                }
            }

            // process children if they exist
            if (resources[i].resources) {
                processEndpoints(resources[i].resources, thisPath, regexPath);
            }
        }
    }
}
