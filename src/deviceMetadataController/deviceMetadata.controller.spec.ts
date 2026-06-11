import { Test, TestingModule } from '@nestjs/testing';
import { DeviceMetadataService } from './deviceMetadata.service';
import { DeviceMetadataController } from './deviceMetadata.controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('History Controller', () => {
    let controller: DeviceMetadataController;
    let mockHistoryService = {
        queryDeviceMetadata: jest.fn(),
        createDeviceMetadataDataEvent: jest.fn()
    }

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [DeviceMetadataController,
                {
                    provide: DeviceMetadataService,
                    useValue: mockHistoryService

                }
            ]
        }).overrideGuard(JwtAuthGuard)
            .useValue({
                canActivate: jest.fn(() => true),
            }).compile();

        controller = module.get<DeviceMetadataController>(DeviceMetadataController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    test('QueryHistoryMetadata', async () => {
        mockHistoryService.queryDeviceMetadata.mockResolvedValue({ records: [], count: 0 });
        let mockQueryData = {
            from: '2026-06-08T00:00:00.000Z',
            to: '2026-06-09T00:00:00.000Z'
        }
        const result = await controller.queryHistoryMetadata(mockQueryData);

        expect(mockHistoryService.queryDeviceMetadata).toHaveBeenCalledWith(mockQueryData);
        expect(result).toEqual({ records: [], count: 0 })

    })

    
    test('createHistoryMetadata', async () => {

        let mockPostData ={items:[{
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
        mockHistoryService.createDeviceMetadataDataEvent.mockResolvedValue({ event: { mockPostData } });

        const result = await controller.createHistoryMetadata(mockPostData);

        expect(mockHistoryService.createDeviceMetadataDataEvent).toHaveBeenCalledWith(mockPostData);
        expect(result).toEqual({ event: { mockPostData } })

    });

    
});

