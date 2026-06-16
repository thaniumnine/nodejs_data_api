import { Test, TestingModule } from '@nestjs/testing';
import { HistoryService } from './history.service';
import { DatabaseService } from '../database/database.service';
describe('HistoryService', () => {

  const mockCreateQueryResult = 
   [{
        "id": "3",
        "device_id": "QSE-999998",
        "timestamp": "2026-03-25T16:16:31.000Z",
        "json_type": "pointset",
        "version": "1.4.2",
        "points": {
          "co2_level": {
            "present_value": 551
          },
          "total_volatile_organic_compounds": {
            "present_value": 31
          }
        },
        "created_at": "2026-06-08T12:18:16.847Z"
      }
    ]
  
  const normalizeSql = (sql: string) => (
        sql.replace(/\s+/g, ' ').trim()
    )

  let service: HistoryService;
  const mockDatabaseService = {
    query: jest.fn(),
    db: {
      insertInto: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          execute: jest.fn().mockResolvedValue(mockCreateQueryResult),
          onConflict: jest.fn().mockReturnValue({
            returning: jest.fn().mockReturnValue({
              executeTakeFirst: jest.fn().mockResolvedValue({ id: 1 })
            })
          })
        })
      }),
      selectFrom: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                executeTakeFirstOrThrow: jest.fn().mockResolvedValue({ id: 1 })

              })
            })

          })

        })
       })

    }

  }


  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [HistoryService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService

        }
      ]
    }).compile();

    service = module.get<HistoryService>(HistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('queryDeviceHistory', async () => {

    const mockQueryResult = {
      "rows": [
        {
          "points": {
            "humidity": {
              "present_value": 32
            },
            "pressure": {
              "present_value": 1009
            }
          }
        }
      ],
      "rowCount": 1
    }
    mockDatabaseService.query.mockResolvedValue(mockQueryResult)

    const result = await service.queryDeviceHistory({
      from: '2026-06-08T00:00:00.000Z',
      to: '2026-06-09T00:00:00.000Z',
    },
    "GB-LON-9212",
    "level-01",
    "acu-999999"
  );

    const queryCommand =      `SELECT dh.points, dh.timestamp
    FROM device_history dh JOIN device_identifier di 
      ON dh.device_ref_id = di.id
    WHERE dh.timestamp >= $1
      AND dh.timestamp < $2
      AND di.building = $3
      AND di.level = $4
      AND di.device_id = $5
    ORDER BY device_id ASC, timestamp ASC`;

        const [querySql, querySqlParams] = mockDatabaseService.query.mock.calls[0]
        expect(normalizeSql(querySql)).toEqual(normalizeSql(queryCommand))
        expect(querySqlParams).toEqual(['2026-06-08T00:00:00.000Z', '2026-06-09T00:00:00.000Z', "GB-LON-9212",
    "level-01",
    "acu-999999"])


    expect(result).toEqual({
      "records": [
        {
          "points": {
            "humidity": {
              "present_value": 32
            },
            "pressure": {
              "present_value": 1009
            }
          }
        }
      ],
      "count": 1
    })

  })

  test('createDeviceHistoryDataEvent', async () => {


    const historyDataMock = {
      "items": [{
        "version": "1.4.2",
        "timestamp": "2026-03-25T16:16:31+00:00",
        "points": {
          "co2_level": {
            "present_value": 551
          },
          "total_volatile_organic_compounds": {
            "present_value": 31
          }
        }
      }
      ]
    }
      const result = await service.createDeviceHistoryDataEvent(historyDataMock,  "GB-LON-9212","level-01","acu-999999");
      expect(mockDatabaseService.db.insertInto).toHaveBeenCalledWith("device_history")
      let input = historyDataMock.items[0]
      expect(
        (mockDatabaseService.db.insertInto as jest.Mock).mock.results[0].value.values,
      ).toHaveBeenCalledWith([
      {
          device_ref_id: 1,
          timestamp: new Date(input.timestamp),
          json_type:"pointset",
          version:input.version,
          points:input.points
        }
      ])



    expect(result).toBeUndefined();

  });



  test('deleteDeviceHistoryDataEvent', async () => {
    const idsToDelete = ['QSE-9999'];
    let mockQueryData = {
      from: '2026-06-08T00:00:00.000Z',
      to: '2026-06-09T00:00:00.000Z',
    }
    mockDatabaseService.query.mockResolvedValue({
      rowCount: 1,
      rows: [],
    });
    

    const result = await service.deleteDeviceHistoryDataEvent(idsToDelete,mockQueryData);

    expect(mockDatabaseService.query).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM device_history dh'),
      [idsToDelete,mockQueryData.from,mockQueryData.to],
    );

    expect(result).toBeUndefined();
  });
})

