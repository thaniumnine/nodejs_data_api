import { Test, TestingModule } from '@nestjs/testing';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('History Controller', () => {
    const ORGANISATION = "Simtronics"
    const LEVEL = "Level-01"
    const BUILDING = "GB-LON-9212"
    const DEVICE = "acu-999999"
    const FROM = '2026-06-08T00:00:00.000Z';
    const TO = '2026-06-09T00:00:00.000Z';
        

    let controller: HistoryController;
    let mockHistoryService = {
        queryDeviceHistory: jest.fn(),
        createDeviceHistoryDataEvent: jest.fn(),
        deleteDeviceHistoryDataEvent:jest.fn(),
        queryDeviceHistoryWithPrefix:jest.fn(),
        getDeviceNames:jest.fn()
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
            from: FROM,
            to: TO,
        }
        const result = await controller.queryHistoryData(ORGANISATION, BUILDING,LEVEL,DEVICE,mockQueryData);

        expect(mockHistoryService.queryDeviceHistory).toHaveBeenCalledWith(
            ORGANISATION,
            BUILDING,
            LEVEL,
            DEVICE,
    mockQueryData
        );
        expect(result).toEqual({ records: [], count: 0 })

    })

       test('queryHistoryDataPrefix', async () => {
        mockHistoryService.queryDeviceHistoryWithPrefix.mockResolvedValue({ records: [], count: 0 });
        let mockQueryData = {
            from: FROM,
            to: TO,
            devicePrefix: DEVICE
        }
        const result = await controller.queryHistoryDataPrefix(ORGANISATION,BUILDING,LEVEL,mockQueryData);

        expect(mockHistoryService.queryDeviceHistoryWithPrefix).toHaveBeenCalledWith(
            ORGANISATION,
            BUILDING,
            LEVEL,
            mockQueryData,
        );
        expect(result).toEqual({ records: [], count: 0 })

    })


    
       test('getDeviceNames', async () => {
        mockHistoryService.getDeviceNames.mockResolvedValue({ records: [], count: 0 });
        const result = await controller.getDeviceNames(ORGANISATION,BUILDING, LEVEL,DEVICE);

           expect(mockHistoryService.getDeviceNames).toHaveBeenCalledWith(
               ORGANISATION,
               BUILDING,
               LEVEL,
               DEVICE
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

        const result = await controller.createHistoryData(ORGANISATION,BUILDING,LEVEL,DEVICE,mockPostData,);

        expect(mockHistoryService.createDeviceHistoryDataEvent).toHaveBeenCalledWith(
            mockPostData,
            ORGANISATION,
            BUILDING,
            LEVEL,
            DEVICE
        );
        expect(result).toEqual({ event: { mockPostData } })

    });



    

    test('deleteDeviceHistoryDataEvent', async () => {
        const idsToDelete = ['QSE-9999'];
           let mockQueryData = {
            from: FROM,
            to: TO,
        }

        const result = await controller.deleteHistoryData(ORGANISATION,BUILDING,LEVEL,idsToDelete,mockQueryData);
        expect(mockHistoryService.deleteDeviceHistoryDataEvent).toHaveBeenCalledWith(
            ORGANISATION,BUILDING,LEVEL,idsToDelete,mockQueryData
        );
        expect(result).toBeUndefined();

    })

});

