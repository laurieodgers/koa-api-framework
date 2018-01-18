var jwt = require('jwt-simple');

var payload = {
    iat: new Date() / 1000,
    test: 'test'
}

console.log(jwt.encode(payload, 'qwertyuiopasdfghjklzxcvbnm123456'));
