'use strict';
var personList = {};

module.exports = personList;

personList.get = function*() {
    // GET https://api.foo.com/v2/person/list
    // Access models through this.models
    this.data.data = {
        "userId": "1"
    }
};
