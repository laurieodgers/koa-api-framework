'use strict';

var person = {};

module.exports = person;

person.get = function*() {
    // GET https://api.foo.com/v2/person/{person_id}
    // Access models through this.models
};

person.post = function*() {
    // POST https://api.foo.com/v2/person/{person_id}
    // Access models through this.models
};

person.put = function*() {
    // PUT https://api.foo.com/v2/person/{person_id}
    // Access models through this.models
};

person.delete = function*() {
    // DELETE https://api.foo.com/v2/person/{person_id}
    // Access models through this.models
};
