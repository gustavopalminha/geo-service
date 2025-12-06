import { Test, TestingModule } from '@nestjs/testing';
import { createDataController } from './dynamic-data.controller';
import { DataService } from '../data/data.service';
import { SpatialService } from '../data/spatial.service';
import { ConfigService } from '../config/config.service';

describe('DynamicDataController - Edge Cases', () => {
  let controller: any;
  let dataService: jest.Mocked<DataService>;


  beforeEach(async () => {
    const mockDataService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockSpatialService = {
      spatialQuery: jest.fn(),
      getGeometryMetadata: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'allowedCrud': return 'CRUD';
          case 'allowSpatialQueries': return true;
          case 'apiSubpath': return '/test';
          default: return null;
        }
      }),
    };

    const DynamicController = createDataController(mockConfigService as any);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [DynamicController],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: SpatialService, useValue: mockSpatialService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get(DynamicController);
    dataService = module.get(DataService);

  });

  it('should handle findAll with only skip parameter', async () => {
    dataService.findAll.mockResolvedValue([]);

    await controller.findAll('5');

    expect(dataService.findAll).toHaveBeenCalledWith(undefined, 5, undefined, undefined);
  });

  it('should handle findAll with only take parameter', async () => {
    dataService.findAll.mockResolvedValue([]);

    await controller.findAll(undefined, '10');

    expect(dataService.findAll).toHaveBeenCalledWith(undefined, undefined, 10, undefined);
  });

  it('should handle findAll with only orderBy parameter', async () => {
    dataService.findAll.mockResolvedValue([]);

    await controller.findAll(undefined, undefined, 'name');

    expect(dataService.findAll).toHaveBeenCalledWith(undefined, undefined, undefined, { name: 'ASC' });
  });
});
