'use strict';
var errors = {};

module.exports = errors;

errors.get = function*() {
    throw new Error("418:I am a teapot");
};
