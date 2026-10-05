exit

curl -v -X OPTIONS 'https://api.thaniumos.com/api/v1/auth/login' \
  -H 'Origin: https://thaniumos.com' \
  -H 'Access-Control-Request-Method: POST' \
  -H 'Access-Control-Request-Headers: content-type,authorization'