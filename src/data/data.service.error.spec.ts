import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { DataService } from './data.service';
import { ConfigService } from '../config/config.service';

describe('DataService - Error Cases', () => {
  let service: DataService;
  let mockDataSource: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(null),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue(''),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DataService>(DataService);
  });

  it('should return empty array when repository not initialized', async () => {
    const result = await service.findAll();
    expect(result).toEqual([]);
  });

  it('should return null when repository not initialized for findOne', async () => {
    const result = await service.findOne(1);
    expect(result).toBeNull();
  });

  it('should throw error when repository not initialized for create', async () => {
    await expect(service.create({})).rejects.toThrow('Repository not initialized');
  });

  it('should throw error when repository not initialized for update', async () => {
    await expect(service.update(1, {})).rejects.toThrow('Repository not initialized');
  });

  it('should throw error when repository not initialized for delete', async () => {
    await expect(service.delete(1)).rejects.toThrow('Repository not initialized');
  });
});
