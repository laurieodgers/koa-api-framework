'use strict';
var body = {};

module.exports = body;

body.get = function*() {
    this.body = {
        "hello": "world!"
    }
};
