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
## Scripts

To create a new aggregation device type along after you have created its table

Usage: node insert-new-deviceType.js <orgPrefix> <deviceType> <deviceColumns>

```
npm run insert-new:deviceType -- sim mts2 '[
            {
                "name": "illuminance_sensor",
                "type": "numeric"
            },
            {
                "name": "last_week_total_occupancy",
                "type": "numeric"
            },
            {
                "name": "motion_event",
                "type": "numeric"
            },
            {
                "name": "this_week_cumulative_occupancy",
                "type": "numeric"
            }
        ]'
```

To create a new organisation

Usage: node insert-new-organisation.js <orgName> <orgPrefix>

```
npm run insert-new:organisation -- Simtronics sim



To create a new aggregation device type table for that organisation

Usage: node create_new_aggregation_tables.ts <orgPrefix>

```npm run create_new_aggregation_type_table -- SIM2```
```

To create new aggregation tables based of of the data in aggregation device table

Usage: node create_new_aggregation_tables.ts <orgPrefix>

```
npm run create_new_aggregation_record_tables -- SIM2
```


## Setup

### Aggregation
1) if don't have an organisation run npm run insert-new:organisation
2) run create_new_aggregation_type_table with that organisations prefix to create device table 
3) either use the postman request or insert-new:deviceType to populate the table with device types and their columns
4) finally run create_new_aggregation_tables to create aggregation record tables based of the aggregation device type table records




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

POST /api/v1/aggregation/organisations/:organisation/device_types
GET /api/v1/aggregation/organisations/:organisation/device_types
GET /api/v1/aggregation/organisations/:organisation/device_types/:device_type
DELETE /api/v1/aggregation/organisations/:organisation/device_types

POST /api/v1/aggregation/organisations/:organisation/device_types/:device_type/records
GET /api/v1/aggregation/organisations/:organisation/device_types/:device_type/records
DELETE /api/v1/aggregation/organisations/:organisation/device_types/:device_type/records

POST /api/v1/organisations/:organisation/buildings/:building/levels/:level/devices/history
GET /api/v1/organisations/:organisation/buildings/:building/levels/:level/devices/history
GET /api/v1/organisations/:organisation/buildings/:building/levels/:level/devices/:device_id/history
DELETE /api/v1/organisations/:organisation/buildings/:building/levels/:level/history

GET /api/v1/uildings/:building/levels/:level/devices/
GET /organisations/:organisation/fdd
POST /organisations/:organisation/buildings/:building/levels/:level/devices/:device_id/fdd
GET /organisations/:organisation/fdd/:fdd_history_id/assignments
POST /organisations/:organisation/fdd/:fdd_history_id/assignments

GET /organisations/:organisation/fdd/assignments/:fdd_assignment_id/comments
POST /organisations/:organisation/fdd/assignments/:fdd_assignment_id/comments

GET /organisations/:organisation/fdd/assignments/:fdd_assignment_id/schedule-entries
POST /organisations/:organisation/fdd/assignments/:fdd_assignment_id/schedule-entries
PATCH /organisations/:organisation/fdd/assignments/:fdd_assignment_id/schedule-entries/:entry_id
GET /organisations/:organisation/schedule-entries?from=YYYY-MM-DD&to=YYYY-MM-DD
```

## Project layout

```text
src/
  auth/                       login, refresh, logout, JWT access tokens
  sessions/                   hashed refresh token sessions and rotation
  users/                      user lookup and password storage
  aggregation-records/        aggregation records
  aggregation-type/           metadata about aggregation records table
  deviceMetadata/             device metadata
  history/                    device history data
  organisations/              organisations and their metadata such as table prefix
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



# software errors

PGadmin white screen cache error

https://stackoverflow.com/questions/62426245/pgadmin-4-window-is-completely-blank

delete or rename pgadmin4.db in storage folder and retype in connection info