import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { HistoryModule } from '../src/historyController/history.module'
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { AppModule } from '../src/app.module';

describe('History E2E', () => {
  let app: NestFastifyApplication;


  const historyData =  [{
      "version": "1.4.2",
      "timestamp": "1923-03-25T16:16:31+00:00",
      "device_id": "QSE-999996",
      "points": {
        "co2_level": {
          "present_value": 551
        },
        "total_volatile_organic_compounds": {
          "present_value": 31
        },
        "air_quality_index": {
          "present_value": "Excellent"
        },
        "temperature": {
          "present_value": 21.8
        },
        "pressure": {
          "present_value": 1009
        },
        "humidity": {
          "present_value": 32
        },
        "minute_sound_level": {
          "present_value": 48
        },
        "illuminance_sensor": {
          "present_value": 10
        }
      }
    }
    ]

  
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
  it('POST /history/data', async () => {
    const result = await app.inject({
      method: 'POST',
      url: '/history/data',
      payload:     {"items":historyData}
    });
    expect(result.statusCode).toEqual(201);
  });


  it('GET /history/data', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/history/data?from=1923-03-25T00:00:00.000Z&to=1923-03-26T00:00:00.000Z',
    });

    expect(result.statusCode).toEqual(200);
    const body = JSON.parse(result.payload);
    const { version, ...expectdHistoryData } = historyData[0];
    expect(body.records[0]).toEqual(expectdHistoryData)
    expect(body.count).toBe(1);
  });
});