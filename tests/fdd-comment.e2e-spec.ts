import { NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../src/database/database.service';
import { OrganisationService } from '../src/organisations/organisations.service';
import { FddCommentService } from '../src/fddComment/fdd-comment.service';

describe('FDD Comment Service - mocked tests', () => {
    let service: FddCommentService;
    let database: {
        query: jest.Mock;
        db: { insertInto: jest.Mock };
    };
    let insertQuery: {
        values: jest.Mock;
        returning: jest.Mock;
        executeTakeFirstOrThrow: jest.Mock;
    };

    beforeEach(() => {
        insertQuery = {
            values: jest.fn().mockReturnThis(),
            returning: jest.fn().mockReturnThis(),
            executeTakeFirstOrThrow: jest.fn().mockResolvedValue({
                id: '30',
                fdd_assignment_id: '20',
                comment: 'Checked the meter',
                firebase_user_id: 'engineer-1',
                remaining_minutes: 45,
                minutes_worked: 15,
            }),
        };

        database = {
            query: jest.fn().mockResolvedValue({ rows: [{ id: '20' }], rowCount: 1 }),
            db: { insertInto: jest.fn(() => insertQuery) },
        };

        const organisationService = {
            queryOrganisationMetadata: jest.fn().mockResolvedValue({ id: 7 }),
        };

        service = new FddCommentService(
            database as unknown as DatabaseService,
            organisationService as unknown as OrganisationService,
        );
    });

    it('creates a comment with remaining and worked minutes', async () => {
        const result = await service.createComment(
            'simmtronic', '20', 'Checked the meter', 'engineer-1', 45, 15,
        );

        expect(database.query).toHaveBeenCalledWith(
            expect.stringContaining('di.org_ref_id = $2'),
            ['20', 7],
        );
        expect(database.db.insertInto).toHaveBeenCalledWith('sim_fdd_comment');
        expect(insertQuery.values).toHaveBeenCalledWith({
            fdd_assignment_id: '20',
            comment: 'Checked the meter',
            firebase_user_id: 'engineer-1',
            remaining_minutes: 45,
            minutes_worked: 15,
        });
        expect(result).toEqual(expect.objectContaining({ id: '30', minutes_worked: 15 }));
    });

    it('stores null for optional minute fields when omitted', async () => {
        await service.createComment('simmtronic', '20', 'No estimate yet', 'engineer-1');

        expect(insertQuery.values).toHaveBeenCalledWith(expect.objectContaining({
            remaining_minutes: null,
            minutes_worked: null,
        }));
    });

    it('rejects a comment when its assignment is not in the organisation', async () => {
        database.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

        await expect(
            service.createComment('simmtronic', '999', 'Comment', 'engineer-1'),
        ).rejects.toThrow(NotFoundException);

        expect(database.db.insertInto).not.toHaveBeenCalled();
    });

    it('lists comments for an assignment in timestamp order', async () => {
        const records = [
            { id: '30', fdd_assignment_id: '20', comment: 'First' },
            { id: '31', fdd_assignment_id: '20', comment: 'Second' },
        ];
        database.query
            .mockResolvedValueOnce({ rows: [{ id: '20' }], rowCount: 1 })
            .mockResolvedValueOnce({ rows: records, rowCount: 2 });

        const result = await service.listComments('simmtronic', '20');

        expect(result).toEqual({ records, count: 2 });
        expect(database.query).toHaveBeenLastCalledWith(
            expect.stringContaining('ORDER BY timestamp ASC, id ASC'),
            ['20'],
        );
    });

    it('rejects listing comments for an unknown assignment', async () => {
        database.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

        await expect(service.listComments('simmtronic', '999'))
            .rejects.toThrow("Assignment '999' not found");

        expect(database.query).toHaveBeenCalledTimes(1);
    });
});
