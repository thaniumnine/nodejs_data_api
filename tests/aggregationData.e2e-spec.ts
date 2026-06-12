import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { HistoryModule } from '../src/historyController/history.module'
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { AppModule } from '../src/app.module';

//todo - do one for each device type

describe('aggregation E2E', () => {
  let app: NestFastifyApplication;
  

  const aggregationData = [
    {
      "device_id": "MTS-9999999",
      "event_timestamp": "1920-04-24T12:34:00.000Z",
      "agg_type": "max",
      "payload": {
        "illuminance_sensor": 23,
        "last_week_total_occupancy": 301,
        "motion_event": 201,
        "this_week_cumulative_occupancy": 211
      }
    }]


  
  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('POST /aggregation/mts/data', async () => {
    const result = await app.inject({
      method: 'POST',
      url: '/aggregation/mts/data',
      payload:     {"items":aggregationData},
    
    });
    expect(result.statusCode).toEqual(201);
  });


  it('GET /aggregation/mts/data', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/aggregation/mts/data?from=1920-04-24T00:00:00.000Z&to=1920-04-25T00:00:00.000Z&aggType=max',
    });

    expect(result.statusCode).toEqual(200);
    const body = JSON.parse(result.payload);
    const { agg_type, ...ExpectedaggregationData } = aggregationData[0]
    expect(body?.records[0]).toEqual(ExpectedaggregationData)

  });

  

  it('DELETE /aggregation/mts/data', async () => {
    const result = await app.inject({
      method: 'DELETE',
      url: '/aggregation/mts/data',
      payload: {
        "ids": ["MTS-9999999"]
      }

    });
    expect(result.statusCode).toEqual(204);
  })
});



