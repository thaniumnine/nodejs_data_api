import { Test, TestingModule } from '@nestjs/testing';
import { HistoryService } from './history.service';
import { DatabaseService } from '../database/database.service';
describe('HistoryService', () => {
  let service: HistoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HistoryService,
      {
        provide:DatabaseService,
        useValue:DatabaseService

      }
    ]
    }).compile();

    service = module.get<HistoryService>(HistoryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});