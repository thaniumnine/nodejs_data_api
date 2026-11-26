import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import {
    baseUrl,
    cleanupScheduleTestData,
    createScheduleTestApp,
} from './schedule-test.helper';

describe('Schedule Entries E2E', () => {
    let app: NestFastifyApplication;

    beforeAll(async () => {
        app = await createScheduleTestApp();
    });

    afterAll(async () => {
        if (!app) return;

        try {
            await cleanupScheduleTestData(app);
        } finally {
            await app.close();
        }
    });

    // -------------------------------
    // GET TESTS
    // -------------------------------

    it('GET schedule entries - invalid task ID', async () => {
        const result = await app.inject({
            method: 'GET',
            url: `${baseUrl}/tasks/invalid/schedule-entries`,
        });

        expect(result.statusCode).toBe(400);
    });

    it('GET organisation schedule entries', async () => {
        const result = await app.inject({
            method: 'GET',
            url: `${baseUrl}/schedule-entries?from=1970-01-01&to=1970-01-31`,
        });

        expect(result.statusCode).toBe(200);

        const body = JSON.parse(result.payload);

        expect(Array.isArray(body.records)).toBe(true);
        expect(body.count).toBe(body.records.length);
    });

    it('GET missing to date', async () => {
        const result = await app.inject({
            method: 'GET',
            url: `${baseUrl}/schedule-entries?from=1970-01-01`,
        });

        expect(result.statusCode).toBe(400);
    });

    it('GET - from date after to date', async () => {
        const result = await app.inject({
            method: 'GET',
            url: `${baseUrl}/schedule-entries?from=1970-01-31&to=1970-01-01`,
        });

        expect(result.statusCode).toBe(400);
    });

    it('GET - invalid calendar date', async () => {
        const result = await app.inject({
            method: 'GET',
            url: `${baseUrl}/schedule-entries?from=1970-02-30&to=1970-03-05`,
        });

        expect(result.statusCode).toBe(400);
    });

    it('GET - incorrect date format', async () => {
        const result = await app.inject({
            method: 'GET',
            url: `${baseUrl}/schedule-entries?from=01-01-1970&to=31-01-1970`,
        });

        expect(result.statusCode).toBe(400);
    });

    // -------------------------------
    // POST VALIDATION TESTS
    // -------------------------------

    it('POST - invalid task ID', async () => {
        const result = await app.inject({
            method: 'POST',
            url: `${baseUrl}/tasks/invalid/schedule-entries`,
            payload: {
                scheduled_time: '1970-01-05T09:00:00.000Z',
            },
        });

        expect(result.statusCode).toBe(400);
    });

    it('POST - missing scheduled time', async () => {
        const result = await app.inject({
            method: 'POST',
            url: `${baseUrl}/tasks/1/schedule-entries`,
            payload: {},
        });

        expect(result.statusCode).toBe(400);
    });

    it('POST - invalid timestamp', async () => {
        const result = await app.inject({
            method: 'POST',
            url: `${baseUrl}/tasks/1/schedule-entries`,
            payload: {
                scheduled_time: '1970-01-05',
            },
        });

        expect(result.statusCode).toBe(400);
    });

    it('POST - invalid status', async () => {
        const result = await app.inject({
            method: 'POST',
            url: `${baseUrl}/tasks/1/schedule-entries`,
            payload: {
                scheduled_time: '1970-01-05T09:00:00.000Z',
                status: 'Pending',
            },
        });

        expect(result.statusCode).toBe(400);
    });

    it('POST - invalid is_locked value', async () => {
        const result = await app.inject({
            method: 'POST',
            url: `${baseUrl}/tasks/1/schedule-entries`,
            payload: {
                scheduled_time: '1970-01-05T09:00:00.000Z',
                is_locked: 'yes',
            },
        });

        expect(result.statusCode).toBe(400);
    });

    // -------------------------------
    // PATCH VALIDATION TESTS
    // -------------------------------

    it('PATCH - invalid entry UUID', async () => {
        const result = await app.inject({
            method: 'PATCH',
            url: `${baseUrl}/tasks/1/schedule-entries/invalid`,
            payload: {
                is_locked: true,
            },
        });

        expect(result.statusCode).toBe(400);
    });

    it('PATCH - empty update body', async () => {
        const result = await app.inject({
            method: 'PATCH',
            url: `${baseUrl}/tasks/1/schedule-entries/00000000-0000-4000-8000-000000000000`,
            payload: {},
        });

        expect(result.statusCode).toBe(400);
    });

    it('PATCH - unknown field', async () => {
        const result = await app.inject({
            method: 'PATCH',
            url: `${baseUrl}/tasks/1/schedule-entries/00000000-0000-4000-8000-000000000000`,
            payload: {
                scheduled_minutes: 60,
            },
        });

        expect(result.statusCode).toBe(400);

        expect(result.json()).toMatchObject({
            message: 'Validation failed',
            issues: expect.arrayContaining([
                {
                    path: '',
                    message: 'Unrecognized key: "scheduled_minutes"',
                },
            ]),
        });
    });
});