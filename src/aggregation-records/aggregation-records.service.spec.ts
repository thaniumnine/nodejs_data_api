import { Test, TestingModule } from '@nestjs/testing';
import { AggregationRecordsService } from './aggregation-records.service';
import { DatabaseService } from '../database/database.service';
import { AggregationService } from '../aggregation-type/aggregation.service';
import { AGGREGATION_SERVICE_RETURNED_RESULTS, DB_SERVICE_RETURNED_RESULTS ,EXPECTED_RESULTS} from './aggregation-records.test-fixtures';
import { OrganisationService } from '../organisations/organisations.service';
import { DeviceIdentifierService } from '../deviceIdentifier/device-identifier.service';

describe('AggregationRecordsService', () => {

    const normalizeSql = (sql: string) => (
        sql.replace(/\s+/g, ' ').trim()
    )


    const FROM = '2026-06-08T00:00:00.000Z'
    const TO = '2026-06-09T00:00:00.000Z'
    const AGG_TYPE = 'mean'
    const ORGANISATION = "Simtronics"
    const BUILDING = "Waterside"
    const LEVEL = "level-00"
    
    let service: AggregationRecordsService;
    let organisationService:OrganisationService;
    let deviceIdentifierService:DeviceIdentifierService;

    const mockDatabaseService = {
        query: jest.fn(),
        db: {
            insertInto: jest.fn().mockReturnValue({
                values: jest.fn().mockReturnValue({
                    onConflict: jest.fn().mockReturnValue({
                            execute: jest.fn().mockResolvedValue(DB_SERVICE_RETURNED_RESULTS["createAggregationDataEvent"])
                    })


                })
            }

            )

        }

    }

    const mockAggregationService = {
        getRequiredByName: jest.fn(),
             getRequiredType:jest.fn().mockResolvedValue({
                device_type:"acu",
                columns: [{name:'room_temperature'},{name:'room_temperature_setpoint'}]
             })
    }

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [AggregationRecordsService, OrganisationService,DeviceIdentifierService,
                {
                    provide: DatabaseService,
                    useValue: mockDatabaseService
                }, {
                    provide: AggregationService,
                    useValue: mockAggregationService

                }
            ]
        }).compile();

        service = module.get<AggregationRecordsService>(AggregationRecordsService);
        organisationService = module.get<OrganisationService>(OrganisationService);
        deviceIdentifierService = module.get(DeviceIdentifierService);
        jest.spyOn(organisationService, 'queryOrganisationMetadata').mockResolvedValue({
            id: 1,
            name: ORGANISATION,
            prefix: "SIM",
            created_at: new Date(),
        });
        jest.spyOn(deviceIdentifierService, 'findDeviceIdentifier').mockResolvedValue({
            id: 1,

        });
        jest.spyOn(deviceIdentifierService, 'createDeviceIdentifier').mockResolvedValue({
            id: 1,

        });


    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });


    test('queryAggregationRecords', async () => {

        const mockQueryResult = DB_SERVICE_RETURNED_RESULTS['queryAggregationRecords']

        mockDatabaseService.query.mockResolvedValue(mockQueryResult)

      
        mockAggregationService.getRequiredByName.mockResolvedValue(AGGREGATION_SERVICE_RETURNED_RESULTS["getRequiredByName"])

        let deviceType = "acu"
        const result = await service.queryAggregationRecords(ORGANISATION,BUILDING,LEVEL,deviceType,
            {
                from:FROM,
                to: TO,
                aggType: AGG_TYPE
            });


        const [querySql, querySqlParams] = mockDatabaseService.query.mock.calls[0]
    
        expect(querySqlParams).toEqual([FROM,TO, AGG_TYPE,BUILDING,LEVEL])

        expect(result).toEqual(EXPECTED_RESULTS["queryAggregationRecords"])


    
    })



    test('createAggregationDataEvent', async () => {
        const deviceType = "acu"
        mockAggregationService.getRequiredByName.mockResolvedValue(AGGREGATION_SERVICE_RETURNED_RESULTS["getRequiredByName"]);
        const result = await service.createAggregationDataEvent(ORGANISATION,BUILDING,LEVEL,deviceType, DB_SERVICE_RETURNED_RESULTS["createAggregationDataEvent"]);
        expect(mockDatabaseService.db.insertInto).toHaveBeenCalledWith("sim_aggregations_acu")
        const insertIntoResults = (mockDatabaseService.db.insertInto as jest.Mock).mock.results[0].value
        expect(insertIntoResults.values).toHaveBeenCalledWith([
            {
                device_id: "MTS-99997",
                agg_type: "max",
                device_ref_id: 1,
                event_timestamp: new Date("2026-04-24T12:34:00Z"),
                room_temperature: null,
                room_temperature_setpoint: null
            }
        ])
        expect(result).toBeUndefined();

    });



    test('deleteDeviceHistoryDataEvent', async () => {
            const idsToDelete = ['ACU'];

            mockDatabaseService.query.mockResolvedValue({
                rowCount: 1,
                rows: [],
            });

            const result = await service.deleteAggregationDataEvent(ORGANISATION,BUILDING,LEVEL,"acu", idsToDelete);

            expect(mockDatabaseService.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM '),
                [idsToDelete,BUILDING,LEVEL],
            );

            expect(result).toBeUndefined();
        });

})

