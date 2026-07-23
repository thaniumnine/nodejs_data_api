# Thaniumnine Data API starter

A NestJS + TypeScript starter API for PostgreSQL data access with both:


## Stack

- Node.js 24+
- NestJS 11
- Fastify adapter
- PostgreSQL 18
- Kysely and node-postgres
- JWT access tokens
- Rotating opaque refresh tokens stored as hashes in PostgreSQL
- Zod request validation

## Quick start

```bash
cp .env.example .env
npm install
########## FRESH DATABASE SETUP
npm run db:migrate

# linux
    ADMIN_EMAIL=admin@thaniumnine.com ADMIN_PASSWORD='Exp0ls1ve123435' 
# windows
    set ADMIN_EMAIL=admin@thaniumnine.com
    set ADMIN_PASSWORD='Exp0ls1ve123435' 

npm run seed:admin
#############################


#### RUNTIME



npm run start:dev
```

The API listens at:

```text
http://localhost:3500/api/v1
```

## Auth flow

Login:

```bash
curl -s -X POST http://localhost:3500/api/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"admin@thaniumnine.com","password":"Exp0ls1ve123435"}'
```

Use the returned access token on protected endpoints:

```http
Authorization: Bearer <access_token>
```

Refresh access:

```bash
curl -s -X POST http://localhost:3500/api/v1/auth/refresh \
  -H 'content-type: application/json' \
  -d '{"refresh_token":"<refresh_token>"}'
```

Logout revokes the current session:

```bash
curl -s -X POST http://localhost:3500/api/v1/auth/logout \
  -H 'authorization: Bearer <access_token>'
```


## Main endpoints

```text
Look at postman for examples

GET  /api/v1/

GET  /api/v1/health

POST /api/v1/auth/register      development only, controlled by AUTH_ALLOW_REGISTRATION
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me

POST /api/v1/device_metadata/data
GET /api/v1/device_metadata/data
DELETE /api/v1//device_metadata/data

POST /api/v1/aggregation/
GET /api/v1/aggregation/
GET /api/v1/aggregation/:device_type
DELETE /api/v1/aggregation/

POST /api/v1/aggregation/:device_type/data
GET /api/v1/aggregation/:device_type/data
DELETE /api/v1/aggregation/:device_type/data

POST /api/v1/buildings/:building/levels/:level/devices/history
GET /api/v1/buildings/:building/levels/:level/devices/history
GET /api/v1/buildings/:building/levels/:level/devices/:device_id/history
DELETE /api/v1/buildings/:building/levels/:level/history

GET /api/v1/uildings/:building/levels/:level/devices/


```

## Project layout

```text
src/
  auth/                       login, refresh, logout, JWT access tokens
  sessions/                   hashed refresh token sessions and rotation
  users/                      user lookup and password storage
  aggregation-records/        aggregation records
  aggregationController/      metadata about aggregation records table
  deviceMetadataController/   device metadata
  historyController/          device history data
  database/                   PostgreSQL/Kysely connection
  common/                     guards, decorators, validation pipes, SQL identifier helpers
migrations/                   SQL migrations
scripts/                      migration runner and admin seed
```

## Production notes

Before exposing this publicly:

- Put it behind HTTPS.
- Set a long random `JWT_ACCESS_SECRET`.
- Set `AUTH_ALLOW_REGISTRATION=false`.
- Restrict CORS origins.
- Add rate limiting on `/auth/login` and ingestion endpoints.
- Add permissions.
- Add request-size limits for JSON payloads.
- Add observability, audit logs, backups, and alerting.


## testing docs (usefull files about testing)

  https://www.freecodecamp.org/news/nestjs-unit-testing-e2e-testing-guide/

  https://mariusniemet20.medium.com/writing-unit-tests-for-your-nestjs-rest-api-baf4361132d3

  https://circleci.com/blog/getting-started-with-nestjs-and-automatic-testing/

  https://docs.nestjs.com/fundamentals/testing

  https://medium.com/@jackallcock97/unit-testing-with-nestjs-and-jest-a-comprehensive-tutorial-464910f6c6ba

  https://blog.ablo.ai/jest-to-vitest-in-nestjs

  https://blog.stackademic.com/testing-your-api-services-with-nestjs-mocking-vs-real-database-bbfe689ed745

  https://zenn.dev/maronn/articles/nestjs-vitest-migrate?locale=en
