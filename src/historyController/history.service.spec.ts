import { Test, TestingModule } from '@nestjs/testing';
import { HistoryService } from './history.service';
import { DatabaseService } from '../database/database.service';
import { EXPECTED_RESULTS, RESULT, SQL } from './history.test-fixtures';
import { createHistoryDatabaseServiceMock } from './history.test-mocks';



describe('HistoryService', () => {
  const ORGANISATION = "Simtronics"
  const BUILDING = 'GB-LON-9212'
  const LEVEL= 'Level-01'
  const ACU_DEVICE = 'acu-999999'
  const FROM=  '2026-06-08T00:00:00.000Z'
  const TO ='2026-06-09T00:00:00.000Z'



  let service: HistoryService;
  const databaseMock = createHistoryDatabaseServiceMock();
  const mockDatabaseService = databaseMock.service;

  databaseMock.mocks.executeMock.mockResolvedValue(
    RESULT.createDeviceHistoryDataEvent,
  );
  databaseMock.mocks.executeTakeFirstMock.mockResolvedValue({ id: 1 });

  databaseMock.mocks.executeTakeFirstOrThrowMock.mockResolvedValue({
    id: 1,
  });

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
    jest
      .spyOn(service, "queryOrganisationMetadata")
      .mockResolvedValue({
        id: 1,
        name: ORGANISATION,
        prefix: "SIM",
        created_at: new Date(),
      });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  test('queryDeviceHistory', async () => {

    const mockQueryResult = queryResult(RESULT['queryDeviceHistory'])

    mockDatabaseService.query.mockResolvedValueOnce(mockQueryResult)



    const result = await service.queryDeviceHistory(
      ORGANISATION, BUILDING, LEVEL, ACU_DEVICE, {
      from: FROM,
      to: TO,
    },
    );

    const queryCommand = SQL['queryDeviceHistory']
    expectSqlQuery(
      queryCommand,
      [FROM, TO, BUILDING, LEVEL, ACU_DEVICE]
    )

    expect(result).toEqual(serviceResult(EXPECTED_RESULTS['queryDeviceHistory']))

  })


  test('queryDeviceHistoryPrefix', async () => {

    const mockQueryResult = queryResult(RESULT['queryDeviceHistoryPrefix'])

    mockDatabaseService.query.mockResolvedValueOnce(mockQueryResult)

    const result = await service.queryDeviceHistoryWithPrefix(
      ORGANISATION,
      BUILDING,
      LEVEL,
      {
        from: FROM,
        to: TO,
        devicePrefix: ACU_DEVICE
      },
    );

    const queryCommand = SQL['queryDeviceHistoryPrefix']
    expectSqlQuery(
      queryCommand,
      [FROM, TO, BUILDING, LEVEL, `${ACU_DEVICE}%`]
    )

    expect(result).toEqual(serviceResult(EXPECTED_RESULTS['queryDeviceHistoryPrefix']))

  })

  test('getDeviceNames', async () => {

    const mockQueryResult = queryResult(RESULT['getDeviceNames'])
    mockDatabaseService.query.mockResolvedValueOnce(mockQueryResult)

    const result = await service.getDeviceNames(
      ORGANISATION,
      BUILDING,
      LEVEL,
      "MTS-"
    );
    const queryCommand = SQL['getDeviceNames']

    expectSqlQuery(queryCommand, [BUILDING, LEVEL, "MTS-%"])

    expect(result).toEqual(serviceResult(EXPECTED_RESULTS['getDeviceNames']))
  })


  test('createDeviceHistoryDataEvent', async () => {

    const historyDataMock = EXPECTED_RESULTS['createDeviceHistoryDataEvent']
    const result = await service.createDeviceHistoryDataEvent(historyDataMock, ORGANISATION,BUILDING, LEVEL, ACU_DEVICE);
    expect(mockDatabaseService.db.insertInto).toHaveBeenCalledWith("sim_device_history")
    const input = historyDataMock.items[0]
    expect(databaseMock.mocks.valuesMock).toHaveBeenCalledWith([
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

    const result = await service.deleteDeviceHistoryDataEvent(ORGANISATION,BUILDING, LEVEL, idsToDelete, mockQueryData);

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
