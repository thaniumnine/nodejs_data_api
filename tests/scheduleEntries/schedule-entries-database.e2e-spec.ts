import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DatabaseService } from '../../src/database/database.service';
import { baseUrl, testTaskId, createScheduleTestApp, cleanupScheduleTestData } from './schedule-test.helper';

describe('Schedule Entries Database E2E', () => {
    let app: NestFastifyApplication;
    const createdIds: string[] = [];

    beforeAll(async () => {
        app = await createScheduleTestApp();
    });


    afterAll(async () => {
        if (!app) return;

        try {
            if (createdIds.length > 0) {
                const database = app.get(DatabaseService);

                await database.db
                    .deleteFrom('schedule_entries')
                    .where('id', 'in', createdIds)
                    .execute();
            }
        } finally {
            try {
                await cleanupScheduleTestData(app);
            } finally {
                await app.close();
            }
        }
    });


    describe('Schedule entry creation and updates', () => {
        const taskUrl = `${baseUrl}/tasks/${testTaskId}/schedule-entries`;

        let firstEntryId: string;
        let secondEntryId: string;

        it('POST - create a planned entry in 1970', async () => {
            const result = await app.inject({
                method: 'POST',
                url: taskUrl,
                payload: {
                    scheduled_time: '1970-01-05T09:00:00.000Z',
                },
            });

            const body = JSON.parse(result.payload);

            if (typeof body.id === 'string') {
                firstEntryId = body.id;
                createdIds.push(body.id);
            }

            expect(result.statusCode).toBe(201);
            expect(body.id).toEqual(expect.any(String));
            expect(body.task_id).toBe(String(testTaskId));
            expect(body.scheduled_time).toBe('1970-01-05T09:00:00.000Z');
            expect(body.status).toBe('Planned');
            expect(body.is_locked).toBe(false);
        });

        it('GET - retrieve the created task entry', async () => {
            const result = await app.inject({
                method: 'GET',
                url: taskUrl,
            });

            expect(result.statusCode).toBe(200);

            const body = JSON.parse(result.payload);
            const entry = body.records.find(
                (record: { id: string }) => record.id === firstEntryId,
            );

            expect(entry).toBeDefined();
            expect(entry.status).toBe('Planned');
            expect(entry.task_id).toBe(String(testTaskId));
        });

        it('GET - created entry appears in organisation schedule', async () => {
            const result = await app.inject({
                method: 'GET',
                url: `${baseUrl}/schedule-entries?from=1970-01-01&to=1970-01-31`,
            });

            expect(result.statusCode).toBe(200);

            const body = JSON.parse(result.payload);
            const entry = body.records.find(
                (record: { id: string }) => record.id === firstEntryId,
            );

            expect(entry).toBeDefined();
            expect(Array.isArray(entry.assignments)).toBe(true);
            expect(entry.assignments.length).toBeGreaterThan(0);
        });

        it('PATCH - mark an entry as Completed', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${taskUrl}/${firstEntryId}`,
                payload: {
                    status: 'Completed',
                },
            });

            expect(result.statusCode).toBe(200);

            const body = JSON.parse(result.payload);
            expect(body.status).toBe('Completed');
        });

        it('PATCH - reject changes to a Completed entry', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${taskUrl}/${firstEntryId}`,
                payload: {
                    is_locked: true,
                },
            });

            expect(result.statusCode).toBe(404);
        });

        it('POST - create another entry in 1970', async () => {
            const result = await app.inject({
                method: 'POST',
                url: taskUrl,
                payload: {
                    scheduled_time: '1970-01-07T09:00:00.000Z',
                    status: 'Planned',
                },
            });

            const body = JSON.parse(result.payload);

            if (typeof body.id === 'string') {
                secondEntryId = body.id;
                createdIds.push(body.id);
            }

            expect(result.statusCode).toBe(201);
            expect(body.status).toBe('Planned');
        });

        it('PATCH - lock a planned entry', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${taskUrl}/${secondEntryId}`,
                payload: {
                    is_locked: true,
                },
            });

            expect(result.statusCode).toBe(200);

            const body = JSON.parse(result.payload);
            expect(body.is_locked).toBe(true);
        });

        it('PATCH - reject changes to a locked entry', async () => {
            const result = await app.inject({
                method: 'PATCH',
                url: `${taskUrl}/${secondEntryId}`,
                payload: {
                    status: 'Completed',
                },
            });

            expect(result.statusCode).toBe(404);
        });


    });
});
