import { DatabaseService } from '../src/database/database.service';
import { OrganisationService } from '../src/organisations/organisations.service';
import { DeviceIdentifierService } from '../src/deviceIdentifier/device-identifier.service';
import { FddHistoryService } from '../src/fddHistory/fdd-history.service';

describe('FDD History Service - mocked tests', () => {
    let service: FddHistoryService;
    let database: {
        query: jest.Mock;
        db: { insertInto: jest.Mock };
    };
    let organisationService: { queryOrganisationMetadata: jest.Mock };
    let identifierService: {
        createDeviceIdentifier: jest.Mock;
        findDeviceIdentifier: jest.Mock;
    };
    let insertQuery: { values: jest.Mock; execute: jest.Mock };

    beforeEach(() => {
        insertQuery = {
            values: jest.fn().mockReturnThis(),
            execute: jest.fn().mockResolvedValue(undefined),
        };

        database = {
            query: jest.fn(),
            db: { insertInto: jest.fn(() => insertQuery) },
        };

        organisationService = {
            queryOrganisationMetadata: jest.fn().mockResolvedValue({ id: 7 }),
        };

        identifierService = {
            createDeviceIdentifier: jest.fn().mockResolvedValue({ id: '101' }),
            findDeviceIdentifier: jest.fn().mockResolvedValue(null),
        };

        service = new FddHistoryService(
            database as unknown as DatabaseService,
            organisationService as unknown as OrganisationService,
            identifierService as unknown as DeviceIdentifierService,
        );
    });

    it('creates multiple FDD history records for a device', async () => {
        await service.createFddHistoryData(
            {
                items: [
                    { timestamp: '1970-01-01T09:00:00.000Z', room: 'Plant Room', ruleId: 'RULE_A' },
                    { timestamp: '1970-01-02T09:00:00.000Z', room: 'Plant Room', ruleId: 'RULE_B' },
                ],
            },
            'simmtronic',
            'GB-LON-TEST',
            'level-01',
            'QSE-TEST',
        );

        expect(organisationService.queryOrganisationMetadata).toHaveBeenCalledWith('simmtronic');
        expect(identifierService.createDeviceIdentifier).toHaveBeenCalledWith(
            'simmtronic', 'GB-LON-TEST', 'level-01', 'QSE-TEST',
        );
        expect(database.db.insertInto).toHaveBeenCalledWith('sim_fdd_history');
        expect(insertQuery.values).toHaveBeenCalledWith([
            {
                device_ref_id: '101',
                timestamp: new Date('1970-01-01T09:00:00.000Z'),
                closed: false,
                room: 'Plant Room',
                rule_id: 'RULE_A',
            },
            {
                device_ref_id: '101',
                timestamp: new Date('1970-01-02T09:00:00.000Z'),
                closed: false,
                room: 'Plant Room',
                rule_id: 'RULE_B',
            },
        ]);
        expect(insertQuery.execute).toHaveBeenCalledTimes(1);
    });

    it('uses an existing identifier when creation returns nothing', async () => {
        identifierService.createDeviceIdentifier.mockResolvedValueOnce(null);
        identifierService.findDeviceIdentifier.mockResolvedValueOnce({ id: '202' });

        await service.createFddHistoryData(
            { items: [{ timestamp: '1970-01-01T09:00:00.000Z', room: 'Room 2', ruleId: 'RULE_C' }] },
            'simmtronic', 'GB-LON-TEST', 'level-01', 'QSE-TEST',
        );

        expect(identifierService.findDeviceIdentifier).toHaveBeenCalledWith(
            'simmtronic', 'GB-LON-TEST', 'level-01', 'QSE-TEST',
        );
        expect(insertQuery.values).toHaveBeenCalledWith([
            expect.objectContaining({ device_ref_id: '202', rule_id: 'RULE_C' }),
        ]);
    });

    it('does not insert history when the identifier cannot be found', async () => {
        identifierService.createDeviceIdentifier.mockResolvedValueOnce(null);
        identifierService.findDeviceIdentifier.mockResolvedValueOnce(null);

        await service.createFddHistoryData(
            { items: [{ timestamp: '1970-01-01T09:00:00.000Z', room: 'Room 1', ruleId: 'RULE_A' }] },
            'simmtronic', 'GB-LON-TEST', 'level-01', 'QSE-TEST',
        );

        expect(database.db.insertInto).not.toHaveBeenCalled();
    });

    it('does not insert records for an empty list', async () => {
        await service.createFddHistoryData(
            { items: [] }, 'simmtronic', 'GB-LON-TEST', 'level-01', 'QSE-TEST',
        );

        expect(database.db.insertInto).not.toHaveBeenCalled();
    });

    it('lists FDD history scoped to the organisation', async () => {
        const records = [{ fdd_history_id: '15', rule_id: 'RULE_A', device_id: 'QSE-TEST' }];
        database.query.mockResolvedValueOnce({ rows: records, rowCount: 1 });

        const result = await service.queryAllFddHistoryData('simmtronic');

        expect(result).toEqual({ records, count: 1 });
        expect(database.query).toHaveBeenCalledWith(
            expect.stringContaining('di.org_ref_id = $1'),
            [7],
        );
    });
});
