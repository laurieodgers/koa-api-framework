'use strict';
var whoami = {};

module.exports = whoami;

whoami.get = async (ctx, next) => {
    // GET https://api.foo.com/v2/user/whpami
    // Access models through this.models
    // Access JWT through this.token

    ctx.data = {
        "userId": "1"
    }

    // throw an error and have koa-api-framework handle it for you
    // format: "http status code:error message"
    //throw new Error("418:I'm a teapot!");
};
