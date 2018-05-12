var jwt = require('jwt-simple');
var moment = require('moment');

var expTime = process.argv[2];

var exp = moment().add(expTime, 'seconds');

var payload = {
    sub: 'test',
    iat: new Date() / 1000,
    test: 'test',
    exp: exp.toISOString()
}

console.log(jwt.encode(payload, 'qwertyuiopasdfghjklzxcvbnm123456'));
