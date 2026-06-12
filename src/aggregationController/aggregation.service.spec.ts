import { Test, TestingModule } from '@nestjs/testing';
import { AggregationService } from './aggregation.service';
import { DatabaseService } from '../database/database.service';
describe('AggregationService', () => {
  const ListMockcQueryResult = [
    {
      "id": "54a1b2f2-0e74-45cb-a164-c24dc302b5e5",
      "device_type": "acu",
      "table_name": "device_simmtronics_acu_agg_events",
      "columns": [
        {
          "name": "room_temperature",
          "type": "numeric"
        },
        {
          "name": "room_temperature_setpoint",
          "type": "numeric"
        }
      ],
      "created_at": "2026-06-03T15:06:39.847Z"
    }]
  const CreateMockCreateQueryResult = {
    "device_type": "qse",
    "table_name": "device_simmtronics_qse_agg_events",
    "columns": [
      {
        "name": "co2_level",
        "type": "numeric"
      },
      {
        "name": "humidity",
        "type": "numeric"
      }
    ]
  }


  const getdByNameMockQueryResult = {
    "id": "e0a73079-0845-4ad4-80f4-dd977ae22ede",
    "device_type": "qse",
    "table_name": "device_simmtronics_qse_agg_events",
    "columns": [
      {
        "name": "co2_level",
        "type": "numeric"
      },
      {
        "name": "humidity",
        "type": "numeric"
      },
      {
        "name": "illuminance_sensor",
        "type": "numeric"
      },
      {
        "name": "minute_sound_level",
        "type": "numeric"
      },
      {
        "name": "pressure",
        "type": "numeric"
      },
      {
        "name": "temperature",
        "type": "numeric"
      },
      {
        "name": "total_volatile_organic_compounds",
        "type": "numeric"
      }
    ],
    "created_at": "2026-05-08T11:40:05.215Z"
  }

  let service: AggregationService;
  const mockDatabaseService = {
    query: jest.fn(),
    db: {
      insertInto: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returningAll: jest.fn().mockReturnValue({
            executeTakeFirstOrThrow: jest.fn().mockResolvedValue(CreateMockCreateQueryResult)
          })

        })
      }

      ),
      selectFrom: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            execute: jest.fn().mockResolvedValue(ListMockcQueryResult)
          }),
          where: jest.fn().mockReturnValue({
            executeTakeFirst: jest.fn().mockResolvedValue(getdByNameMockQueryResult)
          })
        })
      }

      )
    }

  }


  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AggregationService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService

        }
      ]
    }).compile();

    service = module.get<AggregationService>(AggregationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('list', async () => {
    const result = await service.list();
    expect(mockDatabaseService.db.selectFrom).toHaveBeenCalledWith("aggregation")
    const selectFromResults = (mockDatabaseService.db.selectFrom as jest.Mock).mock.results[0].value
    const selectResults = selectFromResults.select.mock.results[0].value
    expect(selectResults.orderBy).toHaveBeenCalledWith('device_type', 'asc'  )
    expect(result).toEqual(ListMockcQueryResult)

  })

  test('createDeviceType', async () => {


    const result = await service.createDeviceType(CreateMockCreateQueryResult);

    expect((mockDatabaseService.db.insertInto as jest.Mock).mock.results[0].value.values).toHaveBeenCalledWith({
      device_type: "qse",
      table_name: "device_simmtronics_qse_agg_events",
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
    expect(result).toEqual({ event: CreateMockCreateQueryResult })
  });


  test('getRequiredByName', async () => {
    const deviceName = "lt"
    const result = await service.getRequiredByName(deviceName);
    expect(mockDatabaseService.db.selectFrom).toHaveBeenCalledWith("aggregation")
    const selectFromResults = (mockDatabaseService.db.selectFrom as jest.Mock).mock.results[0].value
    const selectResults = selectFromResults.select.mock.results[0].value
    expect(selectResults.where).toHaveBeenCalledWith('device_type', '=', deviceName)
    expect(result).toEqual(getdByNameMockQueryResult)


  });


test('deleteDeviceHistoryDataEvent', async () => {
    const idsToDelete = ['ACU'];

    mockDatabaseService.query.mockResolvedValue({
      rowCount: 1,
      rows: [],
    });

    const result = await service.deleteAggregationMetadataEvent(idsToDelete);

    expect(mockDatabaseService.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM aggregation'),
      [idsToDelete],
    );

    expect(result).toBeUndefined();
  });

})

