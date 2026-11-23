import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { AppModule } from '../src/app.module';


type AggregationPayload = {
  device_id: string;
  event_timestamp: string;
  agg_type: string;
  payload: Record<string, number>;
  level:string;
};

  const aggregationMtsData:AggregationPayload[]  = [
    {
      "device_id": "MTS-9999999",
      "event_timestamp": "1970-04-24T12:34:00.000Z",
      "agg_type": "max",
             "level": "Level-00",
      "payload": {
        "illuminance_sensor": 23,
        "last_week_total_occupancy": 301,
        "motion_event": 201,
        "this_week_cumulative_occupancy": 211
      }
    }]

  const aggregationQseData:AggregationPayload[] = [{
    "device_id": "QSE-9999999",
    "event_timestamp": "1970-04-24T12:34:00.000Z",
    "agg_type": "max",
           "level": "Level-00",
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

  const aggregationLtData :AggregationPayload[] = [{
    "device_id": "LT-9999999",
    "event_timestamp": "1970-04-24T12:34:00.000Z",
    "agg_type": "max",
           "level": "Level-00",
    "payload": {
      "brightness_percentage_command": 88,
      "electrical_power_sensor": 202,
      "full_power_output": 303,
      "run_time_accumulator": 100
    }
  }]

  const aggregationAcuData :AggregationPayload[] = [{
    "device_id": "acu-9999999",
    "event_timestamp": "1920-04-24T12:34:00.000Z",
    "agg_type": "max",
    "level": "Level-00",
    "payload": {
      "room_temperature": 88,
      "room_temperature_setpoint": 202,
    }
  }]


  


const makeBaseUrl = (prefix: string) => `/organisations/simmtronic/buildings/Waterside/levels/Level-00/devices/types/${prefix}/aggregations`;
const makeBaseUrl2 = (prefix: string) => `/organisations/simmtronic/buildings/Waterside/devices/types/${prefix}/aggregations`;
const extraGetUrlParameters = '?from=1920-04-24T00:00:00.000Z&to=1920-04-25T00:00:00.000Z&aggType=max'

describe('aggregation E2E', () => {
  let app: NestFastifyApplication;
 
  const testCases = [
    { type: "mts", data: aggregationMtsData},
    { type: "lt", data: aggregationLtData},
    { type: "qse", data: aggregationQseData},
    { type: "acu", data: aggregationAcuData}
  ];

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


  it.each(testCases)(
    'POST $type aggregation record to database successfully',
    async ({ type, data }) => {
      const result = await app.inject({
        method: 'POST',
        url: makeBaseUrl(type),
        payload: { items: data },
      });

      expect(result.statusCode).toEqual(201);
    }
  );

  // it.each(testCases)(
  //   `GET $type aggregation record from database`,
  //   async ({ type, data }) => {
  //     const result = await app.inject({
  //       method: 'GET',
  //       url: `${makeBaseUrl(type)}${extraGetUrlParameters}`,
  //     });

  //     expect(result.statusCode).toEqual(200);
  //     const body = JSON.parse(result.payload);
  //     const { agg_type, ...ExpectedaggregationData } = data[0]
  //     expect(body?.records[0]).toEqual(ExpectedaggregationData)

  //   });


  it.each(testCases)(
    `GET $type aggregation record from database`,
    async ({ type, data }) => {
      const result = await app.inject({
        method: 'GET',
        url: `${makeBaseUrl2(type)}${extraGetUrlParameters}`,
      });

      expect(result.statusCode).toEqual(200);
      const body = JSON.parse(result.payload);
      const { agg_type, ...ExpectedaggregationData } = data[0]
      expect(body?.records[0]).toEqual(ExpectedaggregationData)

    });


  it.each(testCases)(
    'DELETE $type  aggregation record of type $type from database',
    async ({ type,data }) => {
      const result = await app.inject({
        method: 'DELETE',
        url: makeBaseUrl(type),
        payload: {
          "ids": [data[0].device_id]
        }
      });
      expect(result.statusCode).toEqual(204);
    })
});



