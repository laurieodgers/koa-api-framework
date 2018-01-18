#!/bin/bash

set -e

jwtWithNoSub="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE1MTYyNzMwNjEuNTA0LCJ0ZXN0IjoidGVzdCJ9.tYQIrlVX7A4jaib852v6RauFlKiokcXAanfqHKZogMQ"
jwtWithSub="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxNTE2Mjc4NTExLjAxNCwidGVzdCI6InRlc3QifQ.3CBFs7JXh70C6qC8FsSQK2jYwsEYMJbDp1wgp8ltr3E"

node tests/server.js &

serverPid=$!

sleep 5

# test endpoints
echo "GET http://localhost:8080/v2/user/whoami"
curl -H "Authorization: Bearer ${jwtWithSub}" -X "GET" http://localhost:8080/v2/user/whoami
echo ""
echo "POST http://localhost:8080/v2/person"
curl -H "Authorization: Bearer ${jwtWithSub}" -H "Content-type: application/json" -X "POST" -d '{"name":"test"}' http://localhost:8080/v2/person
echo ""
echo "GET http://localhost:8080/v2/person/list"
curl -H "Authorization: Bearer ${jwtWithSub}" -X "GET" http://localhost:8080/v2/person/list
echo ""

sleep 10

# kill the server
kill ${serverPid}
