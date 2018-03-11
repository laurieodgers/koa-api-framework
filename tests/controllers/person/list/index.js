'use strict';
var personList = {};

module.exports = personList;

personList.get = async (ctx, next) => {
    // GET https://api.foo.com/v2/person/list
    // Access models through this.models
    ctx.data.people = [
      {
        name: "Jane",
      },
      {
        name: "Bob"
      }
    ]
};
