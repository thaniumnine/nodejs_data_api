import { Test, TestingModule } from '@nestjs/testing';
import { AggregationService } from './aggregation.service';
import { AggregationController } from './aggregation.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('History Controller', () => {

    const ORGANISATION = "Simtronics"  

    let controller: AggregationController;
    let mockAggregationService = {
        createDeviceType: jest.fn(),
        list:jest.fn(),
        getRequiredType:jest.fn(),
        deleteAggregationMetadataEvent:jest.fn()
    }

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            controllers: [AggregationController],
            providers:[
                {
                    provide: AggregationService,
                    useValue: mockAggregationService

                }
            ]
        }).overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: jest.fn(() => true),
            }).compile();

        controller = module.get<AggregationController>(AggregationController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    test('createAggregationDeviceType', async () => {

        const CreateMockCreateQueryResult = {
            "device_type": "qse",
            "columns": [
                {
                    "name": "co2_level",
                    "type": "numeric"
                },
                {
                    "name": "humidity",
                    "type": "numeric"
                }
            ]
        }
        mockAggregationService.createDeviceType.mockResolvedValue(CreateMockCreateQueryResult);
        const result = await controller.createAggregationDeviceType(ORGANISATION,CreateMockCreateQueryResult);

        expect(mockAggregationService.createDeviceType).toHaveBeenCalledWith(ORGANISATION,CreateMockCreateQueryResult);
        expect(result).toEqual( CreateMockCreateQueryResult )

    })

    test('getAllDeviceTypes', async () => {

        const getAllDeviceTypesQueryResult = [
            {
                "id": "54a1b2f2-0e74-45cb-a164-c24dc302b5e5",
                "device_type": "acu",
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
            }]
        mockAggregationService.list.mockResolvedValue(getAllDeviceTypesQueryResult);
        const result = await controller.getAllDeviceTypes(ORGANISATION);

        expect(mockAggregationService.list).toHaveBeenCalled();
        expect(result).toEqual(getAllDeviceTypesQueryResult)

    })


    test('getDeviceType', async () => {

        const getAllDeviceTypesQueryResult = 
            {
                "id": "54a1b2f2-0e74-45cb-a164-c24dc302b5e5",
                "device_type": "acu",
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
       let deviceType = "acu";
        mockAggregationService.getRequiredType.mockResolvedValue(getAllDeviceTypesQueryResult);
        const result = await controller.getDeviceType(ORGANISATION,deviceType);

        expect(mockAggregationService.getRequiredType).toHaveBeenCalledWith(ORGANISATION,deviceType);
        expect(result).toEqual(getAllDeviceTypesQueryResult)

    })


    
    test('deleteDeviceHistoryDataEvent', async () => {
        const idsToDelete = ['QSE-9999'];
        const result = await controller.deleteAggregationData(ORGANISATION,idsToDelete);
        expect(mockAggregationService.deleteAggregationMetadataEvent).toHaveBeenCalledWith(ORGANISATION,idsToDelete);
        expect(result).toBeUndefined();

    })

    

});

