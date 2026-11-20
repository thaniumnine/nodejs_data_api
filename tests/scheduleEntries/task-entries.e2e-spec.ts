import {
    BadRequestException,
    ConflictException,
    NotFoundException,
} from '@nestjs/common';
import { sql } from 'kysely';

import { DatabaseService } from '../../src/database/database.service';
import { OrganisationService } from '../../src/organisations/organisations.service';
import { TaskEntriesService } from '../../src/task-entries/task-entries.service';

describe('Task Entries - mocked tests', () => {
    let service: TaskEntriesService;
    let sqlExecute: jest.SpyInstance;
    let insertQuery: {
        values: jest.Mock;
        execute: jest.Mock;
        onConflict: jest.Mock;
        returning: jest.Mock;
        executeTakeFirst: jest.Mock;
    };
    let trx: { insertInto: jest.Mock };

    beforeEach(() => {
        // Mock INSERT queries.
        insertQuery = {
            values: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue(undefined),
            onConflict: jest.fn().mockReturnThis(),
            returning: jest.fn().mockReturnThis(),
            executeTakeFirst: jest.fn().mockResolvedValue({
                task_id: '50',
            }),
        };

        trx = {
            insertInto: jest.fn(() => insertQuery),
        };

        // Mock transaction execution.
        const database = {
            db: {
                transaction: jest.fn(() => ({
                    execute: jest.fn(async (callback) => callback(trx)),
                })),
            },
        };

        const organisationService = {
            queryOrganisationMetadata: jest.fn()
                .mockResolvedValue({ id: 1 }),
        };

        service = new TaskEntriesService(
            database as unknown as DatabaseService,
            organisationService as unknown as OrganisationService,
        );

        // Prevent raw SQL queries reaching PostgreSQL.
        const rawBuilderPrototype = Object.getPrototypeOf(
            sql`SELECT 1`,
        );

        sqlExecute = jest
            .spyOn(rawBuilderPrototype, 'execute')
            .mockResolvedValue({ rows: [] });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    // -----------------------------------------
    // CREATE TASK TESTS
    // -----------------------------------------

    it('POST - reject empty assignment list', async () => {
        await expect(
            service.createTask('simmtronic', []),
        ).rejects.toThrow(BadRequestException);
    });

    it('POST - reject duplicate assignment IDs', async () => {
        await expect(
            service.createTask('simmtronic', ['10', '10']),
        ).rejects.toThrow('Provide unique, valid assignment IDs.');
    });

    it('POST - reject invalid assignment ID', async () => {
        await expect(
            service.createTask('simmtronic', ['invalid']),
        ).rejects.toThrow(BadRequestException);
    });

    it('POST - create a task with two assignments', async () => {
        // Both assignments belong to the organisation.
        sqlExecute
            .mockResolvedValueOnce({
                rows: [{ id: '10' }, { id: '11' }],
            })
            .mockResolvedValueOnce({
                rows: [{ task_id: '50' }],
            });

        const result = await service.createTask(
            'simmtronic',
            ['10', '11'],
        );

        expect(result).toEqual({
            task_id: '50',
            assignment_ids: ['10', '11'],
        });

        expect(trx.insertInto)
            .toHaveBeenCalledWith('task_entries');

        expect(insertQuery.values).toHaveBeenCalledWith([
            { task_id: '50', assignment_id: '10' },
            { task_id: '50', assignment_id: '11' },
        ]);

        expect(insertQuery.execute).toHaveBeenCalledTimes(1);
    });

    it('POST - reject assignments outside the organisation', async () => {
        // Only assignment 10 was found.
        sqlExecute.mockResolvedValueOnce({
            rows: [{ id: '10' }],
        });

        await expect(
            service.createTask('simmtronic', ['10', '11']),
        ).rejects.toThrow(NotFoundException);

        expect(trx.insertInto).not.toHaveBeenCalled();
    });

    // -----------------------------------------
    // GET TASK TESTS
    // -----------------------------------------

    it('GET - list organisation tasks', async () => {
        const tasks = [
            { task_id: '50', assignment_ids: ['10', '11'] },
            { task_id: '49', assignment_ids: ['12'] },
        ];

        sqlExecute.mockResolvedValueOnce({
            rows: tasks,
        });

        const result = await service.listTasks('simmtronic');

        expect(result.records).toEqual(tasks);
        expect(result.count).toBe(2);
    });

    it('GET - reject invalid task ID', async () => {
        await expect(
            service.getTask('simmtronic', 'invalid'),
        ).rejects.toThrow(BadRequestException);
    });

    it('GET - retrieve an existing task', async () => {
        const task = {
            task_id: '50',
            assignment_ids: ['10', '11'],
        };

        sqlExecute.mockResolvedValueOnce({
            rows: [task],
        });

        const result = await service.getTask('simmtronic', '50');

        expect(result).toEqual(task);
    });

    it('GET - reject nonexistent task', async () => {
        sqlExecute.mockResolvedValueOnce({
            rows: [],
        });

        await expect(
            service.getTask('simmtronic', '999'),
        ).rejects.toThrow(NotFoundException);
    });

    // -----------------------------------------
    // ADD ASSIGNMENT TESTS
    // -----------------------------------------

    it('PATCH - reject task from another organisation', async () => {
        sqlExecute.mockResolvedValueOnce({
            rows: [{ org_id: '2' }],
        });

        await expect(
            service.addAssignmentToTask('simmtronic', '50', '12'),
        ).rejects.toThrow(NotFoundException);

        expect(trx.insertInto).not.toHaveBeenCalled();
    });

    it('PATCH - reject duplicate assignment link', async () => {
        sqlExecute
            .mockResolvedValueOnce({
                rows: [{ org_id: '1' }],
            })
            .mockResolvedValueOnce({
                rows: [{ id: '12' }],
            });

        // Simulate ON CONFLICT DO NOTHING.
        insertQuery.executeTakeFirst.mockResolvedValueOnce(undefined);

        await expect(
            service.addAssignmentToTask('simmtronic', '50', '12'),
        ).rejects.toThrow(ConflictException);
    });

    it('PATCH - add assignment to existing task', async () => {
        sqlExecute
            .mockResolvedValueOnce({
                rows: [{ org_id: '1' }],
            })
            .mockResolvedValueOnce({
                rows: [{ id: '12' }],
            })
            .mockResolvedValueOnce({
                rows: [{
                    task_id: '50',
                    assignment_ids: ['10', '12'],
                }],
            });

        const result = await service.addAssignmentToTask(
            'simmtronic',
            '50',
            '12',
        );

        expect(insertQuery.values).toHaveBeenCalledWith({
            task_id: '50',
            assignment_id: '12',
        });

        expect(insertQuery.onConflict).toHaveBeenCalled();

        expect(result).toEqual({
            task_id: '50',
            assignment_ids: ['10', '12'],
        });
    });
});
