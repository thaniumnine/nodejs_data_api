import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { AppModule } from '../src/app.module';

  const aggregationTypedata = {

      "device_type": "ZXY",
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

    const aggregationTypedataResult = {

      "device_type": "ZXY",
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


describe('aggregation metadata E2E', () => {
  let app: NestFastifyApplication;
  
  
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

  it('POST /aggregation/organisations/:organisation/device_types/', async () => {
    const result = await app.inject({
      method: 'POST',
      url: '/aggregation/organisations/simmtronic/device_types',
      payload:    {items: aggregationTypedata},
    
    });
    expect(result.statusCode).toEqual(201);
  });


  it('GET aggregation/organisations/:organisation/device_types/:device_type', async () => {
    const result = await app.inject({
      method: 'GET',
      url: 'aggregation/organisations/simmtronic/device_types/ZXY',
    });

    expect(result.statusCode).toEqual(200);
    const body = JSON.parse(result.payload);
    expect(body).toEqual(aggregationTypedataResult)

  });

  

  it('DELETE aggregation/organisations/:organisation/device_types', async () => {
    const result = await app.inject({
      method: 'DELETE',
      url: 'aggregation/organisations/simmtronic/device_types',
      payload: {
        "ids": ["ZXY"]
      }

    });
    expect(result.statusCode).toEqual(204);
  })
});



