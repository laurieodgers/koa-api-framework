'use strict';
var _ = require("lodash");
var koa = require('koa');
var koaRouter = require('koa-router');
var http = require('http');
var https = require('https');
var fs = require('fs');
var bodyParser = require("koa-bodyparser");
var cors = require('koa2-cors');
var ramlParser = require('raml-parser');
var jwt = require('jwt-simple');
var JSONValidator = require('jsonschema').Validator;
var Moment = require('moment');

var v = new JSONValidator();

module.exports = class KoaApiFramework {
    constructor(obj) {
        var self = this;

        self.database = obj.database;
        self.models = obj.models;
        self.jwtSecret = obj.jwtSecret;
        self.pathBase = processUri(obj.apiBase) || '';
        self.raml = obj.raml || './raml/api.raml';
        this.authTraits = obj.authTraits || ['authenticated'];

        if (obj.controllerPath) {
            // strip trailing slash
            this.controllerPath = obj.controllerPath.replace(/\/+$/,'');
        } else {
            this.controllerPath = '/controllers';
        }

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

    async start() {
        var self = this;

        // sanity checks
        if (self.tlsKeyPath && !fs.existsSync(self.tlsKeyPath)) {
            console.error("TLS key does not exist: " + self.tlsKeyPath);
            process.exit(1);
        }
        if (self.tlsCertPath && !fs.existsSync(self.tlsCertPath)) {
            console.error("TLS certificate does not exist: " + self.tlsCertPath);
            process.exit(1);
        }

        var app = new koa();
        app
            .use(cors())
            .use(bodyParser());

        app.use(async (ctx, next) => {
            ctx.db = self.database;
            ctx.models = self.models;
            ctx.jwtSecret = self.jwtSecret;
            ctx.authTraits = self.authTraits;
            ctx.controllerPath = self.controllerPath;

            // set up data so we can use it downstream
            ctx.data = {};

            var urlArray = ctx.request.url.substr(1).split('/');
            ctx.ramlRef = ctx.request.url;

            // strip the queryString
            var searchString = ctx.request.url.split('?')[0];

            // search for this endpoint in our list for easy validation
            for (var i = 0; i < self.endpoints.length; i++) {
                if (
                    (self.endpoints[i].method.toLowerCase() == ctx.request.method.toLowerCase()) &&
                    (searchString.toLowerCase().match(self.endpoints[i].regexPath))
                ) {
                    ctx.endpoint = self.endpoints[i];
                }
            }

            if (!ctx.endpoint) {
                returnError(ctx, 404, "Endpoint not found");
                return;
            }

            var contentType;

            // validate the content type
            if (ctx.request.header['content-type']) {
                var contentTypeArray = ctx.request.header['content-type'].toLowerCase().split(';');
                contentType = contentTypeArray[0];

                // if we don't accept this content type then reject it
                if (contentType != 'application/json') {
                    returnError(ctx, 415, "Content-type '" + contentType + "' not supported");
                    return;
                }
            } else if (ctx.request.header['content-length']) {  // content length is specified but content type is not
                returnError(ctx, 415, "Content-type not specified");
                return;
            }

            // validate the request body
            if (ctx.endpoint.requestSchema) {
                if (!ctx.request.body) {
                    throw new Error("400:No data received");
                }

                var validation = v.validate(ctx.request.body, ctx.endpoint.requestSchema);

                if (validation.errors.length > 0) {
                    throw new Error("400:" + validation.errors.join(", "));
                }
            }


            // process JWT for JWT endpoints
            if (ctx.endpoint.traits && ctx.authTraits.some(r=> ctx.endpoint.traits.indexOf(r) >= 0)> -1) {

                // make sure it has an authorization header
                if (!ctx.request.header.authorization) {
                    returnError(ctx, 401, "Unauthorized");
                    return;
                }

                // remove Bearer from the start of the string
                var jwtString = ctx.request.header.authorization.replace(/^([Bb][Ee][Aa][Rr][Ee][Rr]\s)/,"");

                try {
                    // process jwt and store for later use
                    ctx.token = jwt.decode(jwtString, self.jwtSecret);
                } catch (err) {
                    // not a valid JWT
                    returnError(ctx, 400, "Invalid JWT");
                    return;
                }

                // make sure the JWT includes a subject
                if (!ctx.token.sub) {
                    // not a valid JWT
                    returnError(ctx, 400, "Invalid JWT - Missing Subject");
                    return;
                }

                // make sure the JWT hasnt expired
                if (ctx.token.exp) {
                    var now = Moment();
                    var jwtExp = Moment(ctx.token.exp);

                    if (jwtExp < now) {
                        returnError(ctx, 401, "Invalid JWT - Expired");
                        return;
                    }
                }
            }

            try {

                await next();

                // TODO: validate the response body
                /*
                if (ctx.endpoint.responseSchema) {
                    var validation = v.validate(ctx.request.body, ctx.endpoint.responseSchema);

                    if (validation.errors.length > 0) {
                        throw new Error("400:" + validation.errors.join(", "));
                    }
                }*/
            } catch(err) {
                returnError(ctx, 500, "An internal error occurred", err);
                return;
            }

            // everything worked so return status 200 and the data
            ctx.status = 200;

            // if the user didn't define this.body then set up a structure for them
            if (!ctx.body) {
                ctx.body = {
                    statusCode: 200,
                    message: '',
                    data: ctx.data
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
                    var controllerAbsolutePath = process.cwd() + self.controllerPath + '/' + thisPath + '/index';
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
