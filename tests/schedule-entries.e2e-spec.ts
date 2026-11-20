import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { AppModule } from '../src/app.module';
import { DatabaseService } from '../src/database/database.service';
import {
    dayKey,
    getNextWorkingDay,
} from '../src/scheduleEntries/schedule-date.utils';

import {
    planScheduleMoves,
    type ScheduleMove,
} from '../src/scheduleEntries/schedule-planner';

const organisation = 'simmtronic';
const baseUrl = `/organisations/${organisation}`;
const testTaskId = 1;

describe('Schedule Entries E2E', () => {
    let app: NestFastifyApplication;

    const createdIds: string[] = []; // track onlu records created by these tests for now

    beforeAll(async () => {
        const moduleRef: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: () => true,
            })
            .compile();

        app = moduleRef.createNestApplication<NestFastifyApplication>(
            new FastifyAdapter(),
        );

        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    afterAll(async () => {
        if (!app) return;

        try {
            //remove only entries created by this test suite
            if (createdIds.length > 0) {
                const database = app.get(DatabaseService);

                await database.db
                    .deleteFrom('schedule_entries')
                    .where('id', 'in', createdIds)
                    .execute();
            }
        } finally {
            await app.close();
        }
    });

    // -------------------------------
    // GET TESTS
    // -------------------------------

    // it should be tasks/{id} so setting it to invalid should return a 400 bad request
    it(`GET schedule entries - invalid task ID`, async () => {
        const result = await app.inject({
            method: 'GET',
            url: `${baseUrl}/tasks/invalid/schedule-entries`,
        });

        expect(result.statusCode).toEqual(400);
    });

    it(`GET organisation schedule entries`, async () => {
        const result = await app.inject({
            method: 'GET',
            url: `${baseUrl}/schedule-entries?from=1970-01-01&to=1970-01-31`,
        });

        expect(result.statusCode).toEqual(200);

        const body = JSON.parse(result.payload);

        expect(Array.isArray(body.records)).toBe(true);
        expect(body.count).toBe(body.records.length);
    });

    it(`GET missing to date`, async () => {
        const result = await app.inject({
            method: `GET`,
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


    // -----------------------------------------
    // POST VALIDATION TESTS
    // -----------------------------------------

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
            }
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


    // -----------------------------------------
    // PATCH VALIDATION TESTS
    // -----------------------------------------

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
    });

    // -----------------------------------------
    // REAL DATABASE TESTS
    // -----------------------------------------

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
    // ------------------------
    // SCHEDULE DATE UTILS TEST
    // ------------------------

    describe('Schedule Date Utils', () => {

        it('should return the correct UK date', () => {
            const result = dayKey('1970-01-05T09:00:00.000Z');

            expect(result).toBe('1970-01-05');
        });

        it('should convert a late UTC time to the correct UK date', () => {
            const result = dayKey('1970-01-05T23:30:00.000Z');

            expect(result).toBe('1970-01-06');
        });

        it('should move Monday to Tuesday', () => {
            const result = getNextWorkingDay('1970-01-05T09:00:00.000Z');

            expect(result).toBe('1970-01-06T09:00:00.000Z');
        });

        it('should skip the weekend when moving from Friday', () => {
            const result = getNextWorkingDay('1970-01-02T09:00:00.000Z');

            expect(result).toBe('1970-01-05T09:00:00.000Z');
        });

        it('should skip Sunday when moving from Saturday', () => {
            const result = getNextWorkingDay('1970-01-03T09:00:00.000Z');

            expect(result).toBe('1970-01-05T09:00:00.000Z');
        });

        it('should preserve the original time', () => {
            const result = getNextWorkingDay('1970-01-05T14:30:00.000Z');

            expect(result).toBe('1970-01-06T14:30:00.000Z');
        });

    });

    // ----------------------
    // SCHEDULE PLANNER TESTS
    // ----------------------

    describe("Schedule Planner", () => {

        const createMove = (
            entryId: string,
            taskId: string,
            originalTime: number,
            changes: Partial<ScheduleMove> = {},
        ): ScheduleMove => ({
            entryId,
            taskId,
            scheduledTime: "1970-01-05T09:00:00.000Z",
            originalTime,
            status: "Planned",
            isLocked: false,
            ...changes,
        });

        it("should schedule a task on a free day", () => {
            const incoming = createMove("entry-1", "1", 100);

            const result = planScheduleMoves(incoming, new Map());

            expect(result).toEqual([incoming]);

        });

        it('should move a newer task to the next day', () => {
            const existing = createMove('entry-1', '1', 100);
            const incoming = createMove('entry-2', '2', 200);

            const occupied = new Map([
                ['1970-01-05', existing],
            ]);

            const result = planScheduleMoves(incoming, occupied);

            expect(result[0].scheduledTime)
                .toBe('1970-01-06T09:00:00.000Z');
        });
        
        it('should give an older FDD task priority', () => {
            const existing = createMove('entry-1', '1', 200);
            const incoming = createMove('entry-2', '2', 100);

            const occupied = new Map([
                ['1970-01-05', existing],
            ]);

            const result = planScheduleMoves(incoming, occupied);

            expect(result).toHaveLength(2);

            expect(result.find(m => m.entryId === 'entry-2')?.scheduledTime)
                .toBe('1970-01-05T09:00:00.000Z');

            expect(result.find(m => m.entryId === 'entry-1')?.scheduledTime)
                .toBe('1970-01-06T09:00:00.000Z');
        });

        it('should not displace a locked booking', () => {
            const existing = createMove('entry-1', '1', 200, {
                isLocked: true,
            });

            const incoming = createMove('entry-2', '2', 100);

            const occupied = new Map([
                ['1970-01-05', existing],
            ]);

            expect(() => planScheduleMoves(incoming, occupied))
                .toThrow('Cannot displace a locked or completed booking.');
        });

        it('should not displace a completed booking', () => {
            const existing = createMove('entry-1', '1', 200, {
                status: 'Completed',
            });

            const incoming = createMove('entry-2', '2', 100);

            const occupied = new Map([
                ['1970-01-05', existing],
            ]);

            expect(() => planScheduleMoves(incoming, occupied))
                .toThrow('Cannot displace a locked or completed booking.');
        });

    })

});