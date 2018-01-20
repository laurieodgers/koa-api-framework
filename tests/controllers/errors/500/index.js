'use strict';
var errors = {};

module.exports = errors;

errors.get = function*() {
    throw new Error("500 internal server error");
};
