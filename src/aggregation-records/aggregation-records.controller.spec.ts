import { Test, TestingModule } from '@nestjs/testing';
import { AggregationRecordsService } from './aggregation-records.service';
import { AggregationRecordsController } from './aggregation-records.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('History Controller', () => {
    let controller: AggregationRecordsController;
    let mockAggregationService = {
        queryAggregationRecords: jest.fn(),
        createAggregationDataEvent: jest.fn()
    }

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AggregationRecordsController],
              providers:  [{
                    provide: AggregationRecordsService,
                    useValue: mockAggregationService

                }
            ]
        }).overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: jest.fn(() => true),
            }).compile();

        controller = module.get<AggregationRecordsController>(AggregationRecordsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    test('queryAggregationData', async () => {
        const mockAggregationQueryResults = { "records": [
        {
            "payload": {
                "illuminance_sensor": null,
                "last_week_total_occupancy": null,
                "motion_event": null,
                "this_week_cumulative_occupancy": null
            },
            "device_id": "MTS-00001",
            "event_timestamp": "2026-05-12T00:00:00.000Z"
        }]
    }   

        const query =  {
                from: '2026-06-08T00:00:00.000Z',
                to: '2026-06-09T00:00:00.000Z',
                aggType: 'mean'
            }
               let deviceType = "mts";

        mockAggregationService.queryAggregationRecords.mockResolvedValue(mockAggregationQueryResults);
        const result = await controller.queryAggregationData(deviceType,  query);

        expect(mockAggregationService.queryAggregationRecords).toHaveBeenCalledWith(deviceType, query);

        expect(result).toEqual( mockAggregationQueryResults )

    })

    test('createAggregationData', async () => {


        const CreateMockCreateQueryResult = [{
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
        let deviceType = "mts";

        mockAggregationService.createAggregationDataEvent.mockResolvedValue(CreateMockCreateQueryResult);
        const result = await controller.createAggregationData(deviceType,CreateMockCreateQueryResult);

        expect(mockAggregationService.createAggregationDataEvent).toHaveBeenCalledWith(deviceType,CreateMockCreateQueryResult);
        expect(result).toEqual(CreateMockCreateQueryResult)

    });

});

