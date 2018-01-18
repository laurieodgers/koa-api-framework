'use strict';

var person = {};

module.exports = person;

person.get = function*() {
    // GET https://api.foo.com/v2/person/{person_id}
    // Access models through this.models

    this.data = {
        "message": "GET person endpoint"
    }
};

person.post = function*() {
    // POST https://api.foo.com/v2/person/{person_id}
    // Access models through this.models
    this.data = {
        "message": "POST person endpoint"
    }
};

person.put = function*() {
    // PUT https://api.foo.com/v2/person/{person_id}
    // Access models through this.models
    this.data = {
        "message": "PUT person endpoint"
    }
};

person.delete = function*() {
    // DELETE https://api.foo.com/v2/person/{person_id}
    // Access models through this.models
    this.data = {
        "message": "DELETE person endpoint"
    }
};
