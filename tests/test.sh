#!/bin/bash

set -e

jwtWithNoSub="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE1MTYyNzMwNjEuNTA0LCJ0ZXN0IjoidGVzdCJ9.tYQIrlVX7A4jaib852v6RauFlKiokcXAanfqHKZogMQ"
jwtWithSub="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxNTE2Mjc4NTExLjAxNCwidGVzdCI6InRlc3QifQ.3CBFs7JXh70C6qC8FsSQK2jYwsEYMJbDp1wgp8ltr3E"
jwtNotOurs="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ"
node tests/server.js &

serverPid=$!

sleep 5

function exitWithError() {
    kill ${serverPid}
    exit 1
}

# test endpoints
echo "GET http://localhost:8080/v2/user/whoami"
echo "1. Valid JWT"
output=$( curl -s -H "Authorization: Bearer ${jwtWithSub}" -X "GET" http://localhost:8080/v2/user/whoami )
echo "${output}"
if [[ "${output}" != '{"statusCode":200,"message":"","data":{"userId":"1"}}' ]]; then
    echo "FAILED"
    exitWithError
fi
echo ""
echo "2. No Authorization Header"
output=$( curl -s -X "GET" http://localhost:8080/v2/user/whoami )
echo "${output}"
if [[ "${output}" != '{"status":401,"message":"Unauthorized","data":{}}' ]]; then
    echo "FAILED"
    exitWithError
fi
echo ""
echo "3. No JWT"
output=$( curl -s -H "Authorization: Bearer " -X "GET" http://localhost:8080/v2/user/whoami )
echo "${output}"
if [[ "${output}" != '{"status":400,"message":"Invalid JWT","data":{}}' ]]; then
    echo "FAILED"
    exitWithError
fi
echo ""
echo "4. Invalid JWT"
output=$( curl -s -H "Authorization: Bearer asdfasdfasdfasdf" -X "GET" http://localhost:8080/v2/user/whoami )
echo "${output}"
if [[ "${output}" != '{"status":400,"message":"Invalid JWT","data":{}}' ]]; then
    echo "FAILED"
    exitWithError
fi
echo ""
echo "5. Valid JWT not ours"
output=$( curl -s -H "Authorization: Bearer ${jwtNotOurs}" -X "GET" http://localhost:8080/v2/user/whoami )
echo "${output}"
if [[ "${output}" != '{"status":400,"message":"Invalid JWT","data":{}}' ]]; then
    echo "FAILED"
    exitWithError
fi
echo ""
echo "6. Valid JWT but no sub"
output=$( curl -s -H "Authorization: Bearer ${jwtWithNoSub}" -X "GET" http://localhost:8080/v2/user/whoami )
echo "${output}"
if [[ "${output}" != '{"status":400,"message":"Invalid JWT - Missing Subject","data":{}}' ]]; then
    echo "FAILED"
    exitWithError
fi

echo ""
echo "----"
echo ""

echo "POST http://localhost:8080/v2/person"
echo "1. Valid POST data"
output=$( curl -s -H "Authorization: Bearer ${jwtWithSub}" -H "Content-type: application/json" -X "POST" -d '{"name":"test"}' http://localhost:8080/v2/person )
echo "${output}"
if [[ "${output}" != '{"statusCode":200,"message":"","data":{"message":"POST person endpoint"}}' ]]; then
    echo "FAILED"
    exitWithError
fi
echo ""

echo "2. Invalid Content Type"
output=$( curl -s -H "Authorization: Bearer ${jwtWithSub}" -H "Content-type: text/plain" -X "POST" -d '{"name":"test"}' http://localhost:8080/v2/person )
echo "${output}"
if [[ "${output}" != "{\"status\":415,\"message\":\"Content-type 'text/plain' not supported\",\"data\":{}}" ]]; then
    echo "FAILED"
    exitWithError
fi
echo ""

echo "3. No Content Type"
output=$( curl -s -H "Authorization: Bearer ${jwtWithSub}" -H "Content-type: " -X "POST" -d '{"name":"test"}' http://localhost:8080/v2/person )
echo "${output}"
if [[ "${output}" != '{"status":415,"message":"Content-type not specified","data":{}}' ]]; then
    echo "FAILED"
    exitWithError
fi
echo ""

echo ""
echo "----"
echo ""

echo "GET http://localhost:8080/v2/person/list"
echo "1. Valid GET request"
output=$( curl -s -H "Authorization: Bearer ${jwtWithSub}" -X "GET" http://localhost:8080/v2/person/list )
echo "${output}"
if [[ "${output}" != '{"statusCode":200,"message":"","data":{"people":[{"name":"Jane"},{"name":"Bob"}]}}' ]]; then
    echo "FAILED"
    exitWithError
fi
echo ""

echo "2. Invalid GET request"
output=$( curl -s -H "Authorization: Bearer ${jwtWithSub}" -X "GET" http://localhost:8080/v2/nonexistent )
echo "${output}"
if [[ "${output}" != '{"status":404,"message":"Endpoint not found","data":{}}' ]]; then
    echo "FAILED"
    exitWithError
fi
echo ""

echo ""
echo "----"
echo ""

echo "GET http://localhost:8080/v2/errors/500"
echo "1. Check 500 error"
output=$( curl -s -X "GET" http://localhost:8080/v2/errors/500 )
statusCode=$( curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/v2/errors/500 )
echo "${output}"
if [[ "${output}" != '{"status":500,"message":"500 internal server error","data":{}}'  || ${statusCode} -ne 500 ]]; then
    echo "FAILED"
    echo "Status Code: ${statusCode}"
    echo "Output: ${output}"
    exitWithError
fi
echo ""
echo "2. Check user error and message"
output=$( curl -s -X "GET" http://localhost:8080/v2/errors/418 )
statusCode=$( curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/v2/errors/418 )
echo "${output}"
if [[ "${output}" != '{"status":418,"message":"I am a teapot","data":{}}' || ${statusCode} -ne 418 ]]; then
    echo "FAILED"
    exitWithError
fi
echo ""

sleep 10

# kill the server
kill ${serverPid}

echo ""
echo "----"
echo ""
echo "Tests suceeded"
