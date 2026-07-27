import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../database/database.service';
import { OrganisationService } from '../organisations/organisations.service';
import { expectSqlQuery, queryResult } from '../common/tests/util';
describe('AggregationService', () => {

    const ORGANISATION = "Simtronics"

    const mockDatabaseService = {
        query: jest.fn(),
    }



    let service: OrganisationService;
    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [OrganisationService,
                {
                    provide: DatabaseService,
                    useValue: mockDatabaseService

                }
            ]
        }).compile();
        service = module.get<OrganisationService>(OrganisationService);
    });


    test('queryOrganisationMetadata', async () => {
        const mockQueryResult = {id:1, prefix:"SIM"};
        mockDatabaseService.query.mockResolvedValueOnce(queryResult([mockQueryResult]))
        const result = await service.queryOrganisationMetadata(ORGANISATION);
        const queryCommand = SQL['queryOrganisationMetadata']
        expectSqlQuery(
            mockDatabaseService,
            queryCommand,
            [ORGANISATION]
        )
        expect(result).toEqual(mockQueryResult);
    })


        test('createTableName', async () => {
            const result =  service.createTableName("sim", "device_identifier")
            expect(result).toEqual("sim_device_identifier");
            const result2 =  service.createTableName("_", "device_identifier")
            expect(result2).toEqual("__device_identifier");
            
    })

        test('create3PartTableName', async () => {
            const result =  service.create3PartTableName("sim", "aggregations","mts")
            expect(result).toEqual("sim_aggregations_mts");
            
    })
}

)
const SQL = {
    queryOrganisationMetadata: `
      SELECT id, prefix
      FROM organisations
      WHERE name = $1
      LIMIT 1
      `


}