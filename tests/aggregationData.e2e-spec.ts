import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { AppModule } from '../src/app.module';

//todo - do one for each device type

describe('aggregation E2E', () => {
  let app: NestFastifyApplication;
  

  const aggregationMtsData = [
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

  const aggregationQseData = [{
    "device_id": "QSE-9999999",
    "event_timestamp": "1920-04-24T12:34:00.000Z",
    "agg_type": "max",
    "payload": {
      "co2_level": 300,
      "humidity": 400,
      "illuminance_sensor": 101,
      "minute_sound_level": 301,
      "pressure": 101,
      "temperature": 391,
      "total_volatile_organic_compounds": 101
    }
  }]

  const aggregationLtData = [{
    "device_id": "LT-9999999",
    "event_timestamp": "1920-04-24T12:34:00.000Z",
    "agg_type": "max",
    "payload": {
      "brightness_percentage_command": 88,
      "electrical_power_sensor": 202,
      "full_power_output": 303,
      "run_time_accumulator": 100
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

  it('POST /aggregation/organisations/:organisation/device_types/mts/records', async () => {
    const result = await app.inject({
      method: 'POST',
      url: ' /aggregation/organisations/Simtronics2/device_types/mts/records',
      payload:     {"items":aggregationMtsData},
    
    });
    expect(result.statusCode).toEqual(201);
  });


  it('GET  /aggregation/organisations/:organisation/device_types/mts/records', async () => {
    const result = await app.inject({
      method: 'GET',
      url: ' /aggregation/organisations/Simtronics2/device_types/mts/records?from=1920-04-24T00:00:00.000Z&to=1920-04-25T00:00:00.000Z&aggType=max',
    });

    expect(result.statusCode).toEqual(200);
    const body = JSON.parse(result.payload);
    const { agg_type, ...ExpectedaggregationData } = aggregationMtsData[0]
    expect(body?.records[0]).toEqual(ExpectedaggregationData)

  });

  

  it('DELETE  /aggregation/organisations/:organisation/device_types/mts/records', async () => {
    const result = await app.inject({
      method: 'DELETE',
      url: ' /aggregation/organisations/Simtronics2/device_types/mts/records',
      payload: {
        "ids": ["MTS-9999999"]
      }

    });
    expect(result.statusCode).toEqual(204);
  })



   it('POST /aggregation/organisations/:organisation/device_types/lt/records', async () => {
    const result = await app.inject({
      method: 'POST',
      url: '/aggregation/organisations/Simtronics2/device_types/lt/records',
      payload:     {"items":aggregationLtData},
    
    });
    expect(result.statusCode).toEqual(201);
  });


  it('GET /aggregation/organisations/:organisation/device_types/lt/records', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/aggregation/organisations/Simtronics2/device_types/lt/records?from=1920-04-24T00:00:00.000Z&to=1920-04-25T00:00:00.000Z&aggType=max',
    });

    expect(result.statusCode).toEqual(200);
    const body = JSON.parse(result.payload);
    const { agg_type, ...ExpectedaggregationData } = aggregationLtData[0]
    expect(body?.records[0]).toEqual(ExpectedaggregationData)

  });

  

  it('DELETE /aggregation/organisations/:organisation/device_types/lt/records', async () => {
    const result = await app.inject({
      method: 'DELETE',
      url: '/aggregation/organisations/Simtronics2/device_types/lt/records',
      payload: {
        "ids": ["LT-9999999"]
      }

    });
    expect(result.statusCode).toEqual(204);
  })



     it('POST /aggregation/organisations/:organisation/device_types/qse/records', async () => {
    const result = await app.inject({
      method: 'POST',
      url: '/aggregation/organisations/Simtronics2/device_types/qse/records',
      payload:     {"items":aggregationQseData},
    
    });
    expect(result.statusCode).toEqual(201);
  });


  it('GET /aggregation/organisations/:organisations/device_types/qse/records', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/aggregation/organisations/Simtronics2/device_types/qse/records?from=1920-04-24T00:00:00.000Z&to=1920-04-25T00:00:00.000Z&aggType=max',
    });

    expect(result.statusCode).toEqual(200);
    const body = JSON.parse(result.payload);
    const { agg_type, ...ExpectedaggregationData } = aggregationQseData[0]
    expect(body?.records[0]).toEqual(ExpectedaggregationData)

  });

  

  it('DELETE /aggregation/organisations/:organisation/device_types/qse/records', async () => {
    const result = await app.inject({
      method: 'DELETE',
      url: '/aggregation/organisations/Simtronics2/device_types/qse/records',
      payload: {
        "ids": ["QSE-9999999"]
      }

    });
    expect(result.statusCode).toEqual(204);
  })









});



