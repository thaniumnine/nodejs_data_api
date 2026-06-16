import { Test, TestingModule } from '@nestjs/testing';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('History Controller', () => {
    let controller: HistoryController;
    let mockHistoryService = {
        queryDeviceHistory: jest.fn(),
        createDeviceHistoryDataEvent: jest.fn(),
        deleteDeviceHistoryDataEvent:jest.fn()
    }

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            controllers: [HistoryController],
            providers: [
                {
                    provide: HistoryService,
                    useValue: mockHistoryService,
                },
            ]
        }).overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: jest.fn(() => true),
            }).compile();

        controller = module.get<HistoryController>(HistoryController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    test('queryHistoryData', async () => {
        mockHistoryService.queryDeviceHistory.mockResolvedValue({ records: [], count: 0 });
        let mockQueryData = {
            from: '2026-06-08T00:00:00.000Z',
            to: '2026-06-09T00:00:00.000Z',
        }
        const result = await controller.queryHistoryData( "GB-LON-9212", "level-01", "acu-999999",mockQueryData);

        expect(mockHistoryService.queryDeviceHistory).toHaveBeenCalledWith(
            mockQueryData,
            'GB-LON-9212',
            'level-01',
            'acu-999999',
        );
        expect(result).toEqual({ records: [], count: 0 })

    })

    test('createHistoryData', async () => {

        let mockPostData ={items: [{
            "version": "1.4.2",
            "timestamp": "2026-03-25T16:16:31+00:00",
            "points": {
                "co2_level": {
                    "present_value": 551
                },
                "total_volatile_organic_compounds": {
                    "present_value": 31
                }
            }
        }]
    }
        mockHistoryService.createDeviceHistoryDataEvent.mockResolvedValue({ event: { mockPostData } });

        const result = await controller.createHistoryData("GB-LON-9212", "level-01", "acu-999999",mockPostData,);

        expect(mockHistoryService.createDeviceHistoryDataEvent).toHaveBeenCalledWith(
            mockPostData,
            'GB-LON-9212',
            'level-01',
            'acu-999999',
        );
        expect(result).toEqual({ event: { mockPostData } })

    });


    test('deleteDeviceHistoryDataEvent', async () => {
        const idsToDelete = ['QSE-9999'];
           let mockQueryData = {
            from: '2026-06-08T00:00:00.000Z',
            to: '2026-06-09T00:00:00.000Z',
        }
        const result = await controller.deleteHistoryData(idsToDelete,mockQueryData);
        expect(mockHistoryService.deleteDeviceHistoryDataEvent).toHaveBeenCalledWith(idsToDelete,mockQueryData);
        expect(result).toBeUndefined();

    })

});

