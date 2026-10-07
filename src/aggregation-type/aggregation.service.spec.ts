import { Test, TestingModule } from '@nestjs/testing';
import { AggregationService } from './aggregation.service';
import { DatabaseService } from '../database/database.service';
import { DB_SERVICE_RETURNED_RESULTS, EXPECTED_RESULTS } from './aggregation-type.test-fixtures';
import { OrganisationService } from '../organisations/organisations.service';
describe('AggregationService', () => {

  const ORGANISATION = "Simtronics"

  let service: AggregationService;
  const mockDatabaseService = {
    query: jest.fn(),
    db: {
      insertInto: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
            executeTakeFirstOrThrow: jest.fn().mockResolvedValue(DB_SERVICE_RETURNED_RESULTS['createDeviceType'])

        })
      }

      ),
      selectFrom: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            execute: jest.fn().mockResolvedValue(DB_SERVICE_RETURNED_RESULTS['list'])
          }),
          where: jest.fn().mockReturnValue({
            executeTakeFirst: jest.fn().mockResolvedValue(DB_SERVICE_RETURNED_RESULTS['getRequiredType'])
          })
        })
      }

      )
    }

  }
  const mockOrganisationService = {
    queryOrganisationMetadata: jest.fn().mockResolvedValue({
      id: 1,
      name: ORGANISATION,
      prefix: "SIM",
      created_at: new Date(),
    }),
    createTableName: jest.fn().mockResolvedValue("sim_device_type_aggregation")
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AggregationService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService

        } ,{
      provide: OrganisationService,
      useValue: mockOrganisationService,
    },
      ]
    }).compile();

    service = module.get<AggregationService>(AggregationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('list', async () => {
    const result = await service.list(ORGANISATION);
    expect(mockDatabaseService.db.selectFrom).toHaveBeenCalledWith("sim_device_type_aggregation")
    const selectFromResults = (mockDatabaseService.db.selectFrom as jest.Mock).mock.results[0].value
    const selectResults = selectFromResults.select.mock.results[0].value
    expect(selectResults.orderBy).toHaveBeenCalledWith('device_type', 'asc'  )
    expect(result).toEqual(EXPECTED_RESULTS["list"])

  })

  test('createDeviceType', async () => {


    const result = await service.createDeviceType(ORGANISATION,DB_SERVICE_RETURNED_RESULTS['createDeviceType']);

    expect((mockDatabaseService.db.insertInto as jest.Mock).mock.results[0].value.values).toHaveBeenCalledWith({
      device_type: "qse",
      table_name: "",
      columns: JSON.stringify([
        {
          "name": "co2_level",
          "type": "numeric"
        },
        {
          "name": "humidity",
          "type": "numeric"
        }
      ])
    })
    expect(result).toBeUndefined();
  });


  test('getRequiredType', async () => {
    const deviceName = "lt"
    const result = await service.getRequiredType(ORGANISATION,deviceName);
    expect(mockDatabaseService.db.selectFrom).toHaveBeenCalledWith("sim_device_type_aggregation")
    const selectFromResults = (mockDatabaseService.db.selectFrom as jest.Mock).mock.results[0].value
    const selectResults = selectFromResults.select.mock.results[0].value
    expect(selectResults.where).toHaveBeenCalledWith('device_type', '=', deviceName)
    expect(result).toEqual(EXPECTED_RESULTS['getRequiredType'])


  });


test('deleteDeviceHistoryDataEvent', async () => {
    const idsToDelete = ['ACU'];

    mockDatabaseService.query.mockResolvedValue({
      rowCount: 1,
      rows: [],
    });

    const result = await service.deleteAggregationMetadataEvent(ORGANISATION,idsToDelete);

    expect(mockDatabaseService.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM sim_device_type_aggregation'),
      [idsToDelete],
    );

  
  });

})

