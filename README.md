# Thaniumnine Data API starter

A NestJS + TypeScript starter API for PostgreSQL data access with both:

1. JSONB topic/event storage for flexible device/application payloads.
2. Native SQL table access for structured tables that already exist or need relational modelling.

The API keeps database tables private and exposes stable topic-based endpoints.

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

## Topic model

The API supports two topic storage types.

### 1. JSONB event-log topics

Best for semi-structured objects from devices/applications.

Physical table:

```text
topic_events
```

Core fields:

```text
topic_name
device_id
event_timestamp
received_at
payload jsonb
```

Example write:

```bash
curl -s -X POST http://localhost:3500/api/v1/topics/sensor_readings/events \
  -H 'authorization: Bearer <access_token>' \
  -H 'content-type: application/json' \
  -d '{
    "device_id": "demo-device-1",
    "event_timestamp": "2026-04-26T12:34:00Z",
    "payload": {
      "temperature": 21.4,
      "humidity": 67,
      "battery": 89
    }
  }'
```

Example query:

```bash
curl -s 'http://localhost:3500/api/v1/topics/sensor_readings/events?device_id=demo-device-1&limit=50' \
  -H 'authorization: Bearer <access_token>'
```

### 2. Native SQL table topics

Best for structured tables with real columns and relational constraints.

The sample migration creates a native table:

```text
device_status
```

and maps it to a public topic with the same name.

Example insert:

```bash
curl -s -X POST http://localhost:3500/api/v1/topics/device_status/rows \
  -H 'authorization: Bearer <access_token>' \
  -H 'content-type: application/json' \
  -d '{
    "row": {
      "device_id": "demo-device-1",
      "status": "online",
      "firmware_version": "1.0.0",
      "battery_percent": 98.5,
      "event_timestamp": "2026-04-26T12:34:00Z",
      "raw_payload": {"source":"bootstrap"}
    }
  }'
```

Example query through the same topic API shape:

```bash
curl -s 'http://localhost:3500/api/v1/topics/device_status/events?device_id=demo-device-1&limit=50' \
  -H 'authorization: Bearer <access_token>'
```

## Main endpoints

```text
GET  /api/v1/health

POST /api/v1/auth/register      development only, controlled by AUTH_ALLOW_REGISTRATION
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me

POST /api/v1/topics
GET  /api/v1/topics
GET  /api/v1/topics/:topic
PATCH /api/v1/topics/:topic

POST /api/v1/topics/:topic/events
GET  /api/v1/topics/:topic/events
GET  /api/v1/topics/:topic/devices/:deviceId/latest
POST /api/v1/topics/:topic/rows
```

## Why this layout

The public API is topic-based, not table-based. Each topic is registered in the `topics` table. A topic can use shared JSONB storage or map to a native SQL table. That means applications can use stable URLs while the database design can evolve.

## Project layout

```text
src/
  auth/           login, refresh, logout, JWT access tokens
  sessions/       hashed refresh token sessions and rotation
  users/          user lookup and password storage
  topics/         topic registry and metadata
  topic-records/  JSONB event and native SQL row access
  database/       PostgreSQL/Kysely connection
  common/         guards, decorators, validation pipes, SQL identifier helpers
migrations/       SQL migrations
scripts/          migration runner and admin seed
```

## Production notes

Before exposing this publicly:

- Put it behind HTTPS.
- Set a long random `JWT_ACCESS_SECRET`.
- Set `AUTH_ALLOW_REGISTRATION=false`.
- Restrict CORS origins.
- Add rate limiting on `/auth/login` and ingestion endpoints.
- Add topic/device-level permissions.
- Add request-size limits for JSON payloads.
- Add observability, audit logs, backups, and alerting.
