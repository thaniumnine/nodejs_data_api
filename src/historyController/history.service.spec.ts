import { Test, TestingModule } from '@nestjs/testing';
import { HistoryService } from './history.service';
import { DatabaseService } from '../database/database.service';
describe('HistoryService', () => {

  const BUILDING = 'GB-LON-9212'
  const LEVEL= 'Level-01'
  const ACU_DEVICE = 'acu-999999'
  const FROM=  '2026-06-08T00:00:00.000Z'
  const TO ='2026-06-09T00:00:00.000Z'

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
          execute: jest.fn().mockResolvedValueOnce(mockCreateQueryResult),
          onConflict: jest.fn().mockReturnValue({
            returning: jest.fn().mockReturnValue({
              executeTakeFirst: jest.fn().mockResolvedValueOnce({ id: 1 })
            })
          })
        })
      }),
      selectFrom: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                executeTakeFirstOrThrow: jest.fn().mockResolvedValueOnce({ id: 1 })

              })
            })

          })

        })
       })

    }

  }

  const expectSqlQuery = (sql: string, params: unknown[]) => {
    expect(mockDatabaseService.query).toHaveBeenCalledTimes(1);
    const [actualSql, actualParams] =
      mockDatabaseService.query.mock.calls[0];

    expect(normalizeSql(actualSql)).toBe(normalizeSql(sql));
    expect(actualParams).toEqual(params);
  };


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

    const mockQueryResult = queryResult(RESULT['queryDeviceHistory'])

    mockDatabaseService.query.mockResolvedValueOnce(mockQueryResult)

    const result = await service.queryDeviceHistory({
      from: FROM,
      to: TO,
    },
      BUILDING, LEVEL, ACU_DEVICE
    );

    const queryCommand = SQL['queryDeviceHistory']
    expectSqlQuery(
      queryCommand,
      [FROM, TO, BUILDING, LEVEL, ACU_DEVICE]
    )

    expect(result).toEqual(serviceResult(RESULT['queryDeviceHistory']))

  })





  test('queryDeviceHistoryPrefix', async () => {

    const mockQueryResult = queryResult(RESULT['queryDeviceHistoryPrefix'])

    mockDatabaseService.query.mockResolvedValueOnce(mockQueryResult)

    const result = await service.queryDeviceHistoryWithPrefix({
      from: FROM,
      to: TO,
      devicePrefix: ACU_DEVICE
    },
      BUILDING,
      LEVEL,
    );

    const queryCommand = SQL['queryDeviceHistoryPrefix']
    expectSqlQuery(
      queryCommand,
      [FROM, TO, BUILDING, LEVEL, `${ACU_DEVICE}%`]
    )

    expect(result).toEqual(serviceResult(RESULT['queryDeviceHistoryPrefix']))

  })



  test('getDeviceNames', async () => {

    const mockQueryResult = queryResult([
      { device_id: "MTS-001" },
      { device_id: "MTS-002" }
    ]
    )
    mockDatabaseService.query.mockResolvedValueOnce(mockQueryResult)

    const result = await service.getDeviceNames(
      BUILDING,
      LEVEL,
      "MTS-"
    );
    const queryCommand = SQL['getDeviceNames']

    expectSqlQuery(queryCommand, [BUILDING, LEVEL, "MTS-%"])

    expect(result).toEqual(serviceResult(
      ["MTS-001",
        "MTS-002"]))
  })


  test('createDeviceHistoryDataEvent', async () => {

    const historyDataMock = RESULT['createDeviceHistoryDataEvent']
    const result = await service.createDeviceHistoryDataEvent(historyDataMock, BUILDING, LEVEL, ACU_DEVICE);
    expect(mockDatabaseService.db.insertInto).toHaveBeenCalledWith("device_history")
    const input = historyDataMock.items[0]
    expect(
      (mockDatabaseService.db.insertInto as jest.Mock).mock.results[0].value.values,
    ).toHaveBeenCalledWith([
      {
        device_ref_id: 1,
        timestamp: new Date(input.timestamp),
        json_type: "pointset",
        version: input.version,
        points: input.points
      }
    ])
    expect(result).toBeUndefined();

  });



  test('deleteDeviceHistoryDataEvent', async () => {
    const idsToDelete = ['QSE-9999'];
    const mockQueryData = {
      from: FROM,
      to: TO,
    }
    mockDatabaseService.query.mockResolvedValueOnce(queryResult([]));

    const result = await service.deleteDeviceHistoryDataEvent(BUILDING, LEVEL, idsToDelete, mockQueryData);

    const queryCommand = SQL['deleteDeviceHistoryDataEvent']
    expectSqlQuery(queryCommand, [idsToDelete, mockQueryData.from, mockQueryData.to, BUILDING, LEVEL])

    expect(result).toBeUndefined();
  });
})


function queryResult<T>(rows:T[]){
    return {
      rows,
      rowCount:rows.length,
    }
}

function serviceResult<T>(records: T[]) {
  return {
    records,
    count: records.length,
  };
}


const normalizeSql = (sql: string) => (
      sql.replace(/\s+/g, ' ').trim()
  )


const RESULT = {
  queryDeviceHistory: [{
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
  queryDeviceHistoryPrefix: [{
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
  createDeviceHistoryDataEvent:{
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

}

const SQL = {
queryDeviceHistoryPrefix:`SELECT di.device_id, dh.points, dh.timestamp, dh.version
    FROM device_history dh JOIN device_identifier di
    ON dh.device_ref_id = di.id
      WHERE dh.timestamp >= $1
      AND dh.timestamp < $2
      AND di.building = $3
      AND di.level = $4
      AND di.device_id LIKE $5
      ORDER BY device_id ASC, timestamp ASC`,

queryDeviceHistory:`SELECT dh.points, dh.timestamp
    FROM device_history dh JOIN device_identifier di 
      ON dh.device_ref_id = di.id
    WHERE dh.timestamp >= $1
      AND dh.timestamp < $2
      AND di.building = $3
      AND di.level = $4
      AND di.device_id = $5
    ORDER BY device_id ASC, timestamp ASC`,

  getDeviceNames:`  SELECT DISTINCT device_id
        FROM device_identifier
        where building = $1
        and level = $2
        and device_id LIKE $3`,


    deleteDeviceHistoryDataEvent:    `
    DELETE FROM device_history dh
    USING device_identifier di
    WHERE dh.device_ref_id = di.id
      AND di.device_id = ANY($1)
      AND dh.timestamp >= $2
      AND dh.timestamp < $3
      AND di.building = $4 
      AND di.level = $5
      
    `
    

}

