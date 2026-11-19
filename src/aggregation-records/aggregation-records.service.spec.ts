import { Test, TestingModule } from '@nestjs/testing';
import { AggregationRecordsService } from './aggregation-records.service';
import { DatabaseService } from '../database/database.service';
import { AggregationService } from '../aggregation-type/aggregation.service';
import { AGGREGATION_SERVICE_RETURNED_RESULTS, DB_SERVICE_RETURNED_RESULTS ,EXPECTED_RESULTS} from './aggregation-records.test-fixtures';
import { OrganisationService } from '../organisations/organisations.service';

describe('AggregationRecordsService', () => {

    const normalizeSql = (sql: string) => (
        sql.replace(/\s+/g, ' ').trim()
    )


    const FROM = '2026-06-08T00:00:00.000Z'
    const TO = '2026-06-09T00:00:00.000Z'
    const AGG_TYPE = 'mean'
    const ORGANISATION = "Simtronics"
    
    let service: AggregationRecordsService;
    let organisationService:OrganisationService;
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
            providers: [AggregationRecordsService, OrganisationService,
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
        jest.spyOn(organisationService, 'queryOrganisationMetadata').mockResolvedValue({
            id: 1,
            name: ORGANISATION,
            prefix: "SIM",
            created_at: new Date(),
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
        const result = await service.queryAggregationRecords(ORGANISATION,deviceType,
            {
                from:FROM,
                to: TO,
                aggType: AGG_TYPE
            });


        const [querySql, querySqlParams] = mockDatabaseService.query.mock.calls[0]
    
        expect(querySqlParams).toEqual([FROM,TO, AGG_TYPE])

        expect(result).toEqual(EXPECTED_RESULTS["queryAggregationRecords"])


    
    })



    test('createAggregationDataEvent', async () => {
        const deviceType = "acu"
        mockAggregationService.getRequiredByName.mockResolvedValue(AGGREGATION_SERVICE_RETURNED_RESULTS["getRequiredByName"]);
        const result = await service.createAggregationDataEvent(ORGANISATION,deviceType, DB_SERVICE_RETURNED_RESULTS["createAggregationDataEvent"]);
        expect(mockDatabaseService.db.insertInto).toHaveBeenCalledWith("sim_aggregations_acu")
        const insertIntoResults = (mockDatabaseService.db.insertInto as jest.Mock).mock.results[0].value
        expect(insertIntoResults.values).toHaveBeenCalledWith([
            {
                device_id: "MTS-99997",
                agg_type: "max",
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

            const result = await service.deleteAggregationDataEvent(ORGANISATION,"acu", idsToDelete);

            expect(mockDatabaseService.query).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM '),
                [idsToDelete],
            );

            expect(result).toBeUndefined();
        });

})

