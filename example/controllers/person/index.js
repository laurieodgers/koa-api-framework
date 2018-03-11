'use strict';

var person = {};

module.exports = person;

person.get = async (ctx, next) => {
    // GET https://api.foo.com/v2/person/{person_id}
    // Access models through this.models

    ctx.data = {
        "message": "GET person endpoint"
    }
};

person.post = async (ctx, next) => {
    // POST https://api.foo.com/v2/person/{person_id}
    // Access models through this.models
    ctx.data = {
        "message": "POST person endpoint"
    }
};

person.put = async (ctx, next) => {
    // PUT https://api.foo.com/v2/person/{person_id}
    // Access models through this.models
    ctx.data = {
        "message": "PUT person endpoint"
    }
};

person.delete = async (ctx, next) => {
    // DELETE https://api.foo.com/v2/person/{person_id}
    // Access models through this.models
    ctx.data = {
        "message": "DELETE person endpoint"
    }
};
