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
  
  let service: HistoryService;
  const mockDatabaseService = {
    query: jest.fn(),
    db: {
      insertInto: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({
          returningAll: jest.fn().mockReturnValue({
            execute: jest.fn().mockResolvedValue(mockCreateQueryResult)
          })

        })
      }

      )

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
          "device_id": "acu-999999",
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
      to: '2026-06-09T00:00:00.000Z'
    });

    const queryCommand = `SELECT *
    FROM device_history
    WHERE timestamp >= $1
      AND timestamp < $2
    ORDER BY device_id ASC, timestamp ASC`;


    expect(mockDatabaseService.query).toHaveBeenCalledWith(queryCommand, ['2026-06-08T00:00:00.000Z', '2026-06-09T00:00:00.000Z'])
    expect(result).toEqual({
      "records": [
        {
          "device_id": "acu-999999",
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


    const historyDataMock = {items:[{
      "version": "1.4.2",
      "timestamp": "2026-03-25T16:16:31+00:00",
      "device_id": "QSE-999999",
      "points": {
        "co2_level": {
          "present_value": 551
        },
        "total_volatile_organic_compounds": {
          "present_value": 31
        }
      }
    }]
  }

    const result = await service.createDeviceHistoryDataEvent(historyDataMock);
    expect(result).toEqual({event:mockCreateQueryResult});

  });



})

