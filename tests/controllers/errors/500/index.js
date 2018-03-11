'use strict';
var errors = {};

module.exports = errors;

errors.get = async (ctx, next) => {
    throw new Error("500 internal server error");
};
