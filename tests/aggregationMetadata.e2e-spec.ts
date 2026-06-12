import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { HistoryModule } from '../src/historyController/history.module'
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { AppModule } from '../src/app.module';

describe('History E2E', () => {
  let app: NestFastifyApplication;
  

  const aggregationTypedata = {

      "device_type": "ZXY",
      "table_name": "device_simmtronics_zxy_agg_events",
      "columns": [
        {
          "name": "room_temperature",
          "type": "numeric"
        },
        {
          "name": "room_temperature_setpoint",
          "type": "numeric"
        }
      ]
  
  }

  
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

  it('POST /aggregation/', async () => {
    const result = await app.inject({
      method: 'POST',
      url: '/aggregation',
      payload:     aggregationTypedata,
    
    });
    expect(result.statusCode).toEqual(201);
  });


  it('GET /aggregation/', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/aggregation/ZXY',
    });

    expect(result.statusCode).toEqual(200);
    const body = JSON.parse(result.payload);
    expect(body).toEqual(aggregationTypedata)

  });

  

  it('DELETE /aggregation/', async () => {
    const result = await app.inject({
      method: 'DELETE',
      url: '/aggregation',
      payload: {
        "ids": ["ZXY"]
      }

    });
    expect(result.statusCode).toEqual(204);
  })
});



