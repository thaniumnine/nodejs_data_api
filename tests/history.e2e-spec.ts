import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { HistoryModule } from '../src/historyController/history.module'
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { AppModule } from '../src/app.module';

describe('History E2E', () => {
  let app: NestFastifyApplication;
  

  const historyData =  [{
      "version": "1.4.2",
      "timestamp": "1923-03-25T16:16:31.000Z",
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
  it('POST buildings/:building/levels/:level/devices/history', async () => {
    const result = await app.inject({
      method: 'POST',
      url: `/buildings/GB-LON-9212/levels/level-01/devices/QSE-999996/history`,
      payload:     {"items":historyData}
    });
    expect(result.statusCode).toEqual(201);
  });


  it('GET buildings/:building/levels/:level/devices/history', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/buildings/GB-LON-9212/levels/level-01/devices/QSE-999996/history?from=1923-03-25T00:00:00.000Z&to=1923-03-26T00:00:00.000Z',
    });

    expect(result.statusCode).toEqual(200);
    const body = JSON.parse(result.payload);
    const { version, ...expectdHistoryData } = historyData[0];
    expect(body.records[0]).toEqual(expectdHistoryData)
    expect(body.count).toBe(1);
  });



  it('DELETE buildings/:building/levels/:level/devices/:device_id/history', async () => {
    const result = await app.inject({
      method: 'DELETE',
      url: '/buildings/GB-LON-9212/levels/level-01/history?from=1920-03-25T16:16:31.000Z&to=1923-03-26T00:00:00.000Z',
      payload: {
        "ids": ["QSE-999996"]
      }

    });
    expect(result.statusCode).toEqual(204);
  })
});