
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DatabaseService } from '../../src/database/database.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { sql } from 'kysely';
import { OrganisationService } from '../../src/organisations/organisations.service';
import { ScheduleReschedulerService } from '../../src/scheduleEntries/schedule-rescheduler.service';
import {
    baseUrl,
    testTaskId,
    createScheduleTestApp,
    cleanupScheduleTestData,
} from './schedule-test.helper';

const requestedTime = '1970-01-05T09:00:00.000Z';

const validOwner = {
    firebase_user_id: 'test-engineer',
    original_time: '1970-01-01T09:00:00.000Z',
};

type SqlResult = {
    rows: unknown[];
};

type Booking = {
    entry_id: string;
    task_id: string;
    scheduled_time: string;
    status: 'Planned' | 'Completed' | 'Cancelled';
    is_locked: boolean;
    original_time: string | null;
    owner_count: number;
    in_organisation: boolean;
    estimated_minutes: number | null;
};

const makeBooking = (changes: Partial<Booking> = {}): Booking => ({
    entry_id: 'entry-2',
    task_id: '2',
    scheduled_time: requestedTime,
    status: 'Planned',
    is_locked: false,
    original_time: '1970-01-02T09:00:00.000Z',
    owner_count: 1,
    in_organisation: true,
    estimated_minutes: 480,
    ...changes,
});

const makeSourceQuery = () => ({
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    executeTakeFirst: jest.fn().mockResolvedValue({
        id: 'entry-1',
        status: 'Planned',
        is_locked: false,
    }),
});

const makeUpdateQuery = () => ({
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    executeTakeFirst: jest.fn().mockResolvedValue({
        id: 'entry-1',
    }),
});

// =========================================
// E2E TESTS
// =========================================

describe('Schedule Rescheduler E2E', () => {
    let app: NestFastifyApplication;
    let entryId: string;

    const createdIds: string[] = [];
    const taskUrl = `${baseUrl}/tasks/${testTaskId}/schedule-entries`;

    beforeAll(async () => {
        app = await createScheduleTestApp();

        const result = await app.inject({
            method: 'POST',
            url: taskUrl,
            payload: {
                scheduled_time: '1970-03-02T09:00:00.000Z',
            },
        });

        expect(result.statusCode).toBe(201);

        const body = JSON.parse(result.payload);
        entryId = body.id;
        createdIds.push(entryId);
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


    // -----------------------------------------
    // RESCHEDULING TESTS
    // -----------------------------------------

    // it('PATCH - move a booking to another day', async () => {
    //     const result = await app.inject({
    //         method: 'PATCH',
    //         url: `${taskUrl}/${entryId}`,
    //         payload: {
    //             scheduled_time: '1970-03-03T09:00:00.000Z',
    //         },
    //     });
    //
    //     expect(result.statusCode).toBe(200);
    //
    //     const body = JSON.parse(result.payload);
    //
    //     expect(body.scheduled_time)
    //         .toBe('1970-03-03T09:00:00.000Z');
    // });

    it('PATCH - reject nonexistent booking', async () => {
        const result = await app.inject({
            method: 'PATCH',
            url: `${taskUrl}/00000000-0000-4000-8000-000000000000`,
            payload: {
                scheduled_time: '1970-03-04T09:00:00.000Z',
            },
        });

        expect(result.statusCode).toBe(404);
    });

    it('PATCH - lock a planned booking', async () => {
        const result = await app.inject({
            method: 'PATCH',
            url: `${taskUrl}/${entryId}`,
            payload: {
                is_locked: true,
            },
        });

        expect(result.statusCode).toBe(200);

        const body = JSON.parse(result.payload);
        expect(body.is_locked).toBe(true);
    });

    it('PATCH - reject rescheduling a locked booking', async () => {
        const result = await app.inject({
            method: 'PATCH',
            url: `${taskUrl}/${entryId}`,
            payload: {
                scheduled_time: '1970-03-05T09:00:00.000Z',
            },
        });

        expect(result.statusCode).toBe(409);
    });
});

// =========================================
// MOCKED SERVICE TESTS
// =========================================

describe('Schedule Rescheduler - mocked tests', () => {
    let service: ScheduleReschedulerService;
    let sourceQuery: ReturnType<typeof makeSourceQuery>;
    let updateQuery: ReturnType<typeof makeUpdateQuery>;
    let updateTable: jest.Mock;
    let rawSqlSpy: jest.SpyInstance;
    let sqlResults: SqlResult[];

    // Simulate owners, advisory lock and existing bookings.
    const mockSqlResults = (
        owners: unknown[] = [validOwner],
        bookings: unknown[] = [],
        estimatedMinutes = 480,
    ) => {
        sqlResults = [
            { rows: [] },       // Organisation advisory lock
            { rows: owners },   // Current engineer
            { rows: [{ estimated_minutes: estimatedMinutes }] },
            { rows: [] },       // Engineer advisory lock
            { rows: bookings }, // Existing bookings
        ];
    };

    beforeEach(() => {
        sourceQuery = makeSourceQuery();
        updateQuery = makeUpdateQuery();
        updateTable = jest.fn(() => updateQuery);

        mockSqlResults();

        // Mock raw SQL execution only during this test.
        const rawBuilderPrototype = Object.getPrototypeOf(
            sql`SELECT 1`
        );

        rawSqlSpy = jest
            .spyOn(rawBuilderPrototype, 'execute')
            .mockImplementation(async () =>
                sqlResults.shift() ?? { rows: [] }
            );

        const trx = {
            selectFrom: jest.fn(() => sourceQuery),
            updateTable,
        };

        const database = {
            db: {
                transaction: jest.fn(() => ({
                    execute: jest.fn(
                        async (
                            callback: (tx: typeof trx) => Promise<void>,
                        ) => callback(trx),
                    ),
                })),
            },
        };

        const organisationService = {
            queryOrganisationMetadata: jest.fn()
                .mockResolvedValue({ id: 1 }),
        };

        service = new ScheduleReschedulerService(
            database as unknown as DatabaseService,
            organisationService as unknown as OrganisationService,
        );
    });

    afterEach(() => {
        // Restore normal Kysely SQL execution.
        rawSqlSpy.mockRestore();
    });

    const move = () => service.reschedule(
        'simmtronic',
        '1',
        'entry-1',
        { scheduled_time: requestedTime },
    );

    // -----------------------------------------
    // SUCCESSFUL RESCHEDULING
    // -----------------------------------------

    it('should reschedule a booking on a free day', async () => {
        await expect(move()).resolves.toBeUndefined();

        expect(updateTable).toHaveBeenCalledTimes(1);
        expect(updateQuery.set).toHaveBeenCalledWith({
            scheduled_time: requestedTime,
        });
    });

    it('should ignore the source booking when checking conflicts', async () => {
        mockSqlResults([validOwner], [
            makeBooking({
                entry_id: 'entry-1',
                task_id: '1',
            }),
        ]);

        await expect(move()).resolves.toBeUndefined();

        expect(updateTable).toHaveBeenCalledTimes(1);
    });

    // -----------------------------------------
    // INVALID BOOKINGS
    // -----------------------------------------

    it('should reject a nonexistent booking', async () => {
        sourceQuery.executeTakeFirst.mockResolvedValue(undefined);

        await expect(move()).rejects.toThrow(NotFoundException);

        expect(updateTable).not.toHaveBeenCalled();
    });

    it('should reject a locked booking', async () => {
        sourceQuery.executeTakeFirst.mockResolvedValue({
            id: 'entry-1',
            status: 'Planned',
            is_locked: true,
        });

        await expect(move()).rejects.toThrow(
            'This booking cannot be moved.',
        );
    });

    it('should reject a completed booking', async () => {
        sourceQuery.executeTakeFirst.mockResolvedValue({
            id: 'entry-1',
            status: 'Completed',
            is_locked: false,
        });

        await expect(move()).rejects.toThrow(ConflictException);
    });

    // -----------------------------------------
    // ENGINEER ASSIGNMENT TESTS
    // -----------------------------------------

    it('should reject a task without an assigned engineer', async () => {
        mockSqlResults([]);

        await expect(move()).rejects.toThrow(
            'This scheduler requires one engineer per task.',
        );
    });

    it('should reject multiple assigned engineers', async () => {
        mockSqlResults([
            validOwner,
            {
                firebase_user_id: 'second-engineer',
                original_time: requestedTime,
            },
        ]);

        await expect(move()).rejects.toThrow(
            'This scheduler requires one engineer per task.',
        );
    });

    it('should reject a task without an original timestamp', async () => {
        mockSqlResults([
            { ...validOwner, original_time: null },
        ]);

        await expect(move()).rejects.toThrow(
            'This scheduler requires one engineer per task.',
        );
    });

    // -----------------------------------------
    // EXISTING BOOKING CONFLICTS
    // -----------------------------------------

    it('should reject a booking with multiple owners', async () => {
        mockSqlResults([validOwner], [
            makeBooking({ owner_count: 2 }),
        ]);

        await expect(move()).rejects.toThrow(
            'An existing booking cannot be automatically moved.',
        );
    });

    it('should reject a booking from another organisation', async () => {
        mockSqlResults([validOwner], [
            makeBooking({ in_organisation: false }),
        ]);

        await expect(move()).rejects.toThrow(
            'An existing booking cannot be automatically moved.',
        );
    });

    it('should reject a booking without an original timestamp', async () => {
        mockSqlResults([validOwner], [
            makeBooking({ original_time: null }),
        ]);

        await expect(move()).rejects.toThrow(
            'An existing booking cannot be automatically moved.',
        );
    });

    it('should allow multiple bookings within daily capacity', async () => {
        mockSqlResults(
            [validOwner],
            [
                makeBooking({
                    entry_id: 'entry-2',
                    task_id: '2',
                    estimated_minutes: 120,
                    scheduled_time: '1970-01-05T13:00:00.000Z',
                }),
                makeBooking({
                    entry_id: 'entry-3',
                    task_id: '3',
                    estimated_minutes: 120,
                    scheduled_time: '1970-01-05T15:00:00.000Z',
                }),
            ],
            240,
        );

        await expect(move()).resolves.toBeUndefined();

        expect(updateQuery.where)
            .toHaveBeenCalledWith('id', '=', 'entry-1');

        for (const [changes] of updateQuery.set.mock.calls) {
            expect(changes.scheduled_time).toContain('1970-01-05');
        }
    })

    // -----------------------------------------
    // PRIORITY AND RESCHEDULING
    // -----------------------------------------

    it('should push a newer booking forward', async () => {
        mockSqlResults([validOwner], [
            makeBooking({
                original_time: '1970-01-02T09:00:00.000Z',
            }),
        ]);

        await expect(move()).resolves.toBeUndefined();

        expect(updateTable).toHaveBeenCalledTimes(2);

        expect(updateQuery.set).toHaveBeenNthCalledWith(1, {
            scheduled_time: '1970-01-05T09:00:00.000Z',
        });

        expect(updateQuery.set).toHaveBeenNthCalledWith(2, {
            scheduled_time: '1970-01-06T09:00:00.000Z',
        });
    });

    it('should move the incoming task when an older booking exists', async () => {
        mockSqlResults([
            {
                ...validOwner,
                original_time: '1970-01-03T09:00:00.000Z',
            },
        ], [
            makeBooking({
                original_time: '1970-01-01T09:00:00.000Z',
            }),
        ]);

        await expect(move()).resolves.toBeUndefined();

        expect(updateTable).toHaveBeenCalledTimes(1);
        expect(updateQuery.set).toHaveBeenCalledWith({
            scheduled_time: '1970-01-06T09:00:00.000Z',
        });
    });

    it('should reject a failed database update', async () => {
        updateQuery.executeTakeFirst.mockResolvedValue(undefined);

        await expect(move()).rejects.toThrow(
            'Unable to update schedule entry entry-1',
        );
    });
});