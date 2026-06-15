import { Test, TestingModule } from '@nestjs/testing';
import { DeviceMetadataService } from './deviceMetadata.service';
import { DatabaseService } from '../database/database.service';
describe('HistoryService', () => {

    const mockCreateQueryResult = {
        "event": [
            {
                "id": "2",
                "device_id": "QSE-00005",
                "version": "1.4.2",
                "timestamp": "2026-03-20T00:54:38.000Z",
                "system.location.site": "GB-LON-9212",
                "system.location.section": "TENANT-ZONE-1",
                "system.location.room": "Plant-Room",
                "system.location.floor": "FIRST-FLOOR",
                "system.location.floor_seq": 1,
                "system.location.position.x": 2010658,
                "system.location.position.y": -283739,
                "system.location.position.z": 3,
                "system.physical_tag.asset.guid": "guid://c5A_Of5Kcn2bUJSkAlfUS5",
                "system.physical_tag.asset.site": "GB-LON-9212",
                "system.physical_tag.asset.name": "QSE-00005",
                "gateway.gateway_id": null,
                "pointset": {
                    "points": {
                        "humidity": {
                            "tags": [
                                "point",
                                "sensor",
                                "air",
                                "humidity"
                            ],
                            "unit": "%RH"
                        },
                        "pressure": {
                            "tags": [
                                "point",
                                "sensor",
                                "barometric",
                                "pressure"
                            ],
                            "unit": "mbar"
                        }
                    }
                }
            }
        ]
    }
      
  const normalizeSql = (sql: string) => (
        sql.replace(/\s+/g, ' ').trim()
    )

    let service: DeviceMetadataService;

    const mockDatabaseService = {
        query: jest.fn(),
        db: {
            insertInto: jest.fn().mockReturnValue({
                values: jest.fn().mockReturnValue({
                    execute: jest.fn().mockResolvedValue(mockCreateQueryResult)

                })
            }

            )

        }

    }


    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [DeviceMetadataService,
                {
                    provide: DatabaseService,
                    useValue: mockDatabaseService

                }
            ]
        }).compile();

        service = module.get<DeviceMetadataService>(DeviceMetadataService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    test('queryDeviceHistory', async () => {

        const mockQueryResult = {
            "rows": [
                {
                    "id": "1",
                    "device_id": "QSE-00005",
                    "version": "1.4.2",
                    "timestamp": "2026-03-20T00:54:38.000Z",
                    "system.location.site": "GB-LON-9212",
                    "system.location.section": "TENANT-ZONE-1",
                    "system.location.room": "Plant-Room",
                    "system.location.floor": "FIRST-FLOOR",
                    "system.location.floor_seq": 1,
                    "system.location.position.x": 2010658,
                    "system.location.position.y": -283739,
                    "system.location.position.z": 3,
                    "system.physical_tag.asset.guid": "guid://c5A_Of5Kcn2bUJSkAlfUS5",
                    "system.physical_tag.asset.site": "GB-LON-9212",
                    "system.physical_tag.asset.name": "QSE-00005",
                    "gateway.gateway_id": null,
                    "pointset": {
                        "points": {
                            "humidity": {
                                "tags": [
                                    "point",
                                    "sensor",
                                    "air",
                                    "humidity"
                                ],
                                "unit": "%RH"
                            },
                            "pressure": {
                                "tags": [
                                    "point",
                                    "sensor",
                                    "barometric",
                                    "pressure"
                                ],
                                "unit": "mbar"
                            }
                        }
                    }
                }

            ],
            "rowCount": 1
        }
        mockDatabaseService.query.mockResolvedValue(mockQueryResult)

        const result = await service.queryDeviceMetadata({
            from: '2026-06-08T00:00:00.000Z',
            to: '2026-06-09T00:00:00.000Z'
        });

        const queryCommand = ` SELECT
          device_id,
          version,
          timestamp,
          \"system.location.site\",
          \"system.location.section\",
          \"system.location.room\",
          \"system.location.floor\",
          \"system.location.floor_seq\",
          \"system.location.position.x\",
          \"system.location.position.y\",
          \"system.location.position.z\",
          \"system.physical_tag.asset.guid\",
          \"system.physical_tag.asset.site\",
          \"system.physical_tag.asset.name\",
          \"gateway.gateway_id\",
          pointset
        FROM device_metadata
        WHERE timestamp >= $1
          AND timestamp < $2
        ORDER BY device_id ASC, timestamp ASC`;




        const [querySql, querySqlParams] = mockDatabaseService.query.mock.calls[0]
        expect(normalizeSql(querySql)).toEqual(normalizeSql(queryCommand))
        expect(querySqlParams).toEqual(['2026-06-08T00:00:00.000Z', '2026-06-09T00:00:00.000Z'])

        expect(result).toEqual(
            {
                "records": [
                    {
                        "version": "1.4.2",
                        "timestamp": "2026-03-20T00:54:38.000Z",
                        "system": {
                            "location": {
                                "site": "GB-LON-9212",
                                "section": "TENANT-ZONE-1",
                                "room": "Plant-Room",
                                "floor": "FIRST-FLOOR",
                                "floor_seq": "1",
                                "position": {
                                    "x": "2010658",
                                    "y": "-283739",
                                    "z": "3"
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
                                "humidity": {
                                    "tags": ["point", "sensor", "air", "humidity"],
                                    "unit": "%RH"
                                },
                                "pressure": {
                                    "tags": ["point", "sensor", "barometric", "pressure"],
                                    "unit": "mbar"
                                }
                            }
                        }
                    }
                ],
                "count": 1
            }

        )

    })

    test('createDeviceHistoryDataEvent', async () => {


        const DevicehistoryMetdataMock = {items:[{
            "version": "1.4.2",
            "timestamp": "2026-03-20T00:54:38+00:00",
            "system": {
                "location": {
                    "site": "GB-LON-9212",
                    "section": "TENANT-ZONE-1",
                    "room": "Plant-Room",
                    "floor": "FIRST-FLOOR",
                    "floor_seq": "1",
                    "position": {
                        "x": "2010658.0",
                        "y": "-283739.5",
                        "z": "3.5"
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
                    }
                }
            }
        }]
    }

        const result = await service.createDeviceMetadataDataEvent(DevicehistoryMetdataMock);
        
        expect(mockDatabaseService.db.insertInto).toHaveBeenCalledWith("device_metadata")
        let input = DevicehistoryMetdataMock.items[0]
        expect(
            (mockDatabaseService.db.insertInto as jest.Mock).mock.results[0].value.values,
        ).toHaveBeenCalledWith([
            {

                device_id:  "QSE-00005", // should it repeat
                version: input.version,
                timestamp: new Date(input.timestamp),
                "system.location.site": input.system.location.site,
                "system.location.section": input.system.location.section,
                "system.location.room": input.system.location.room,
                "system.location.floor": input.system.location.floor,
                "system.location.floor_seq": parseInt(input.system.location.floor_seq, 10),

                "system.location.position.x": parseInt(input.system.location.position.x, 10),
                "system.location.position.y": parseInt(input.system.location.position.y, 10),
                "system.location.position.z": parseInt(input.system.location.position.z, 10),

                "system.physical_tag.asset.guid": input.system.physical_tag.asset.guid,
                "system.physical_tag.asset.site": input.system.physical_tag.asset.site,
                "system.physical_tag.asset.name": input.system.physical_tag.asset.name,

                // "gateway.gateway_id": input.gateway.gateway_id,
                pointset: input.pointset


            }
        ])

        expect(result).toBeUndefined();

    });


    test('deleteDeviceHistoryDataEvent', async () => {
        const idsToDelete = ['QSE-9999'];

        mockDatabaseService.query.mockResolvedValue({
            rowCount: 1,
            rows: [],
        });

        const result = await service.deleteDeviceHistoryMetadataEvent(idsToDelete);

        expect(mockDatabaseService.query).toHaveBeenCalledWith(
            expect.stringContaining('DELETE FROM device_metadata'),
            [idsToDelete],
        );

        expect(result).toBeUndefined();
    });


})

