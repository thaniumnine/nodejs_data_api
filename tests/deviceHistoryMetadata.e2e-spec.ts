import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { AppModule } from '../src/app.module';

describe('History metadata E2E', () => {
  let app: NestFastifyApplication;

    const expectedHistoryData = {
        records: [
            {
                version: "1.4.2",
                timestamp: "1920-03-20T00:54:38.000Z",
                system: {
                    location: {
                        site: "GB-LON-9212",
                        section: "TENANT-ZONE-1",
                        room: "Plant-Room",
                        floor: "FIRST-FLOOR",
                        floor_seq: "1",
                        position: {
                            x: "2010658",
                            y: "-283739",
                            z: "3",
                        },
                    },
                    physical_tag: {
                        asset: {
                            guid: "guid://c5A_Of5Kcn2bUJSkAlfUS5",
                            site: "GB-LON-9212",
                            name: "QSE-00005",
                        },
                    },
                },
                pointset: {
                    points: {
                        humidity: {
                            tags: [
                                "point",
                                "sensor",
                                "air",
                                "humidity",
                            ],
                            unit: "%RH",
                        },
                        pressure: {
                            tags: [
                                "point",
                                "sensor",
                                "barometric",
                                "pressure",
                            ],
                            unit: "mbar",
                        },
                        co2_level: {
                            tags: [
                                "point",
                                "sensor",
                                "air",
                                "co2",
                                "concentration",
                            ],
                            unit: "ppm",
                        },
                        temperature: {
                            tags: [
                                "point",
                                "sensor",
                                "air",
                                "temp",
                            ],
                            unit: "°C",
                        },
                        air_quality_index: {
                            tags: [
                                "point",
                                "sensor",
                                "air",
                                "airQuality",
                            ],
                        },
                        illuminance_sensor: {
                            tags: [
                                "point",
                                "sensor",
                                "light",
                                "illuminance",
                            ],
                            unit: "lx",
                        },
                        minute_sound_level: {
                            tags: [
                                "point",
                                "sensor",
                                "soundLevel",
                            ],
                            unit: "db",
                        },
                        total_volatile_organic_compounds: {
                            tags: [
                                "point",
                                "sensor",
                                "air",
                                "tvoc",
                                "concentration",
                            ],
                            unit: "ppb",
                        },
                    },
                },
            },
        ],
    };
    const historyMetadata =  [{
    "version": "1.4.2",
    "timestamp": "1920-03-20T00:54:38+00:00",
    "system": {
        "location": {
            "site": "GB-LON-9212",
            "section": "TENANT-ZONE-1",
            "room": "Plant-Room",
            "floor": "FIRST-FLOOR",
            "floor_seq": 1,
            "position": {
                "x": 2010658.0,
                "y": -283739.5,
                "z": 3.5
            }
        },
        "physical_tag": {
            "asset": {
                "guid": "guid://c5A_Of5Kcn2bUJSkAlfUS5",
                "site": "GB-LON-9212",
                "name": "QSE-00005"
            }
        }
    },
    "pointset": {
        "points": {
            "co2_level": {
                "unit": "ppm",
                "tags": [
                    "point",
                    "sensor",
                    "air",
                    "co2",
                    "concentration"
                ]
            },
            "total_volatile_organic_compounds": {
                "unit": "ppb",
                "tags": [
                    "point",
                    "sensor",
                    "air",
                    "tvoc",
                    "concentration"
                ]
            },
            "air_quality_index": {
                "tags": [
                    "point",
                    "sensor",
                    "air",
                    "airQuality"
                ]
            },
            "temperature": {
                "unit": "°C",
                "tags": [
                    "point",
                    "sensor",
                    "air",
                    "temp"
                ]
            },
            "pressure": {
                "unit": "mbar",
                "tags": [
                    "point",
                    "sensor",
                    "barometric",
                    "pressure"
                ]
            },
            "humidity": {
                "unit": "%RH",
                "tags": [
                    "point",
                    "sensor",
                    "air",
                    "humidity"
                ]
            },
            "minute_sound_level": {
                "unit": "db",
                "tags": [
                    "point",
                    "sensor",
                    "soundLevel"
                ]
            },
            "illuminance_sensor": {
                "unit": "lx",
                "tags": [
                    "point",
                    "sensor",
                    "light",
                    "illuminance"
                ]
            }
        }
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
  it('POST /device_metadata/data', async () => {
    const result = await app.inject({
      method: 'POST',
      url: '/device_metadata/data',
      payload:     {"items":historyMetadata}
    });
    expect(result.statusCode).toEqual(201);
  });


  it('GET /device_metadata/data', async () => {
    const result = await app.inject({
      method: 'GET',
      url: '/device_metadata/data?from=1920-03-20T00:00:00.000Z&to=1920-03-22T00:00:00.000Z',
    });

    expect(result.statusCode).toEqual(200);
    const body = JSON.parse(result.payload);

  
    expect(body.records).toEqual(expectedHistoryData.records)
    expect(body.count).toBe(1);
  });



  it('DELETE /device_metadata/data/:id', async () => {
    const result = await app.inject({
      method: 'DELETE',
      url: '/device_metadata/data',
      payload: {
        "ids": ["QSE-00005"]
      }

    });
    expect(result.statusCode).toEqual(204);
  })
});