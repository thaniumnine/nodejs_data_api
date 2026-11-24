import { NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../src/database/database.service';
import { OrganisationService } from '../src/organisations/organisations.service';
import { FddAssignmentService } from '../src/fddAssignment/fdd-assignment.service';

describe('FDD Assignment Service - mocked tests', () => {
    let service: FddAssignmentService;
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
                id: '20',
                fdd_history_id: '10',
                firebase_user_id: 'engineer-1',
            }),
        };

        database = {
            query: jest.fn().mockResolvedValue({ rows: [{ id: '10' }], rowCount: 1 }),
            db: { insertInto: jest.fn(() => insertQuery) },
        };

        const organisationService = {
            queryOrganisationMetadata: jest.fn().mockResolvedValue({ id: 7 }),
        };

        service = new FddAssignmentService(
            database as unknown as DatabaseService,
            organisationService as unknown as OrganisationService,
        );
    });

    it('creates an assignment when the FDD finding belongs to the organisation', async () => {
        const result = await service.createAssignment('simmtronic', '10', 'engineer-1');

        expect(database.query).toHaveBeenCalledWith(
            expect.stringContaining('di.org_ref_id = $2'),
            ['10', 7],
        );
        expect(database.db.insertInto).toHaveBeenCalledWith('sim_fdd_assignment');
        expect(insertQuery.values).toHaveBeenCalledWith({
            fdd_history_id: '10',
            firebase_user_id: 'engineer-1',
        });
        expect(result).toEqual(expect.objectContaining({ id: '20', fdd_history_id: '10' }));
    });

    it('rejects assignment creation for a missing or foreign FDD finding', async () => {
        database.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

        await expect(service.createAssignment('simmtronic', '999', 'engineer-1'))
            .rejects.toThrow(NotFoundException);

        expect(database.db.insertInto).not.toHaveBeenCalled();
    });

    it('lists assignments newest first for a valid FDD finding', async () => {
        const records = [
            { id: '21', fdd_history_id: '10', firebase_user_id: 'engineer-2' },
            { id: '20', fdd_history_id: '10', firebase_user_id: 'engineer-1' },
        ];
        database.query
            .mockResolvedValueOnce({ rows: [{ id: '10' }], rowCount: 1 })
            .mockResolvedValueOnce({ rows: records, rowCount: 2 });

        const result = await service.listAssignments('simmtronic', '10');

        expect(result).toEqual({ records, count: 2 });
        expect(database.query).toHaveBeenLastCalledWith(
            expect.stringContaining('ORDER BY timestamp DESC, id DESC'),
            ['10'],
        );
    });

    it('rejects listing assignments for an unknown FDD finding', async () => {
        database.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

        await expect(service.listAssignments('simmtronic', '999'))
            .rejects.toThrow("FDD record '999' not found");
        expect(database.query).toHaveBeenCalledTimes(1);
    });

    it('returns unscheduled assignments for one engineer and organisation', async () => {
        const records = [{
            fdd_history_id: '10',
            assignment_id: '20',
            firebase_user_id: 'engineer-1',
            rule_id: 'RULE_A',
            room: 'Plant Room',
            building: 'GB-LON-TEST',
            level: 'level-01',
            device_id: 'QSE-TEST',
        }];
        database.query.mockResolvedValueOnce({ rows: records, rowCount: 1 });

        const result = await service.listUnscheduledAssignments('simmtronic', 'engineer-1');

        expect(result).toEqual({ records, count: 1 });
        expect(database.query).toHaveBeenCalledWith(
            expect.stringContaining("s.status != 'Cancelled'"),
            [7, 'engineer-1'],
        );
    });

    it('returns an empty list when no unscheduled assignments exist', async () => {
        database.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

        const result = await service.listUnscheduledAssignments('simmtronic', 'engineer-1');

        expect(result).toEqual({ records: [], count: 0 });
    });
});
