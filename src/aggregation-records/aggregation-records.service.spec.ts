import { Test, TestingModule } from '@nestjs/testing';
import { AggregationRecordsService } from './aggregation-records.service';
import { DatabaseService } from '../database/database.service';
import { AggregationService } from '../aggregationController/aggregation.service';
import { OnConflictBuilder } from 'kysely';
describe('AggregationRecordsService', () => {

    const normalizeSql = (sql: string) => (
        sql.replace(/\s+/g, ' ').trim()
    )
    const mockCreateQueryResult = [{
        "device_id": "MTS-99997",
        "event_timestamp": "2026-04-24T12:34:00Z",
        "agg_type": "max",
        "payload": {
            "illuminance_sensor": 23,
            "last_week_total_occupancy": 301,
            "motion_event": 201,
            "this_week_cumulative_occupancy": 211
        }
    }]

    let service: AggregationRecordsService;
    const mockDatabaseService = {
        query: jest.fn(),
        db: {
            insertInto: jest.fn().mockReturnValue({
                values: jest.fn().mockReturnValue({
                    onConflict: jest.fn().mockReturnValue({
                        returningAll: jest.fn().mockReturnValue({
                            execute: jest.fn().mockResolvedValue(mockCreateQueryResult)
                        })
                    })


                })
            }

            )

        }

    }

    const mockAggregationService = {
        getRequiredByName: jest.fn()
    }

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [AggregationRecordsService,
                {
                    provide: DatabaseService,
                    useValue: mockDatabaseService
                }, {
                    provide: AggregationService,
                    useValue: mockAggregationService

                }
            ]
        }).compile();

        service = module.get<AggregationRecordsService>(AggregationRecordsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });


    test('queryDeviceHistory', async () => {

        const mockQueryResult = {
            "rows": [
                {

                    "illuminance_sensor": null,
                    "last_week_total_occupancy": null,
                    "motion_event": null,
                    "this_week_cumulative_occupancy": null,

                    "device_id": "MTS-00001",
                    "event_timestamp": "2026-05-12T00:00:00.000Z"
                }
            ]
        }

        mockDatabaseService.query.mockResolvedValue(mockQueryResult)

        const mockDeviceMetadata = {
            "id": "54a1b2f2-0e74-45cb-a164-c24dc302b5e5",
            "device_type": "acu",
            "table_name": "device_simmtronics_acu_agg_events",
            "columns": [
                {
                    "name": "room_temperature",
                    "type": "numeric"
                },
                {
                    "name": "room_temperature_setpoint",
                    "type": "numeric"
                }
            ],
            "created_at": "2026-06-03T15:06:39.847Z"
        }
        mockAggregationService.getRequiredByName.mockResolvedValue(mockDeviceMetadata)

        let deviceType = "acu"
        const result = await service.queryAggregationRecords(deviceType,
            {
                from: '2026-06-08T00:00:00.000Z',
                to: '2026-06-09T00:00:00.000Z',
                aggType: 'mean'
            });


        const queryCommand = `SELECT
            device_id,
            event_timestamp,
            room_temperature::double precision AS room_temperature, room_temperature_setpoint::double precision AS room_temperature_setpoint
            FROM device_simmtronics_acu_agg_events
            WHERE event_timestamp >= $1
            AND event_timestamp < $2
            and agg_type = $3
            ORDER BY device_id ASC,event_timestamp ASC
                `;

        const [querySql, querySqlParams] = mockDatabaseService.query.mock.calls[0]
        expect(normalizeSql(querySql)).toEqual(normalizeSql(queryCommand))
        expect(querySqlParams).toEqual(['2026-06-08T00:00:00.000Z', '2026-06-09T00:00:00.000Z', 'mean'])

        expect(result).toEqual({
            "records": [
                {
                    "payload": {
                        "illuminance_sensor": null,
                        "last_week_total_occupancy": null,
                        "motion_event": null,
                        "this_week_cumulative_occupancy": null
                    },
                    "device_id": "MTS-00001",
                    "event_timestamp": "2026-05-12T00:00:00.000Z"
                }
            ]

        })



    })



    test('createAggregationDataEvent', async () => {
        const deviceType = "acu"
        const getAllDeviceTypesQueryResult =
        {
            "id": "54a1b2f2-0e74-45cb-a164-c24dc302b5e5",
            "device_type": "acu",
            "table_name": "device_simmtronics_acu_agg_events",
            "columns": [
                {
                    "name": "room_temperature",
                    "type": "numeric"
                },
                {
                    "name": "room_temperature_setpoint",
                    "type": "numeric"
                }
            ],
            "created_at": "2026-06-03T15:06:39.847Z"
        }
        mockAggregationService.getRequiredByName.mockResolvedValue(getAllDeviceTypesQueryResult);
        const result = await service.createAggregationDataEvent(deviceType, mockCreateQueryResult);
        expect(mockDatabaseService.db.insertInto).toHaveBeenCalledWith("device_simmtronics_acu_agg_events")
        const insertIntoResults = (mockDatabaseService.db.insertInto as jest.Mock).mock.results[0].value
        expect(insertIntoResults.values).toHaveBeenCalledWith([
            {
                device_id: "MTS-99997",
                agg_type: "max",
                event_timestamp: new Date("2026-04-24T12:34:00Z"),
                room_temperature: null,
                room_temperature_setpoint: null,
            }
        ])
        expect(result).toEqual({ event: mockCreateQueryResult });

    });

})

