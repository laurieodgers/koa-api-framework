'use strict';
var body = {};

module.exports = body;

body.get = async (ctx, next) => {
    ctx.body = {
        "hello": "world!"
    }
};
