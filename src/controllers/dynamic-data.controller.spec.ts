import { Test, TestingModule } from '@nestjs/testing';
import { createDataController } from './dynamic-data.controller';
import { DataService } from '../data/data.service';
import { SpatialService } from '../data/spatial.service';
import { ConfigService } from '../config/config.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('DynamicDataController', () => {
  let controller: any;
  let dataService: jest.Mocked<DataService>;
  let spatialService: jest.Mocked<SpatialService>;


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
    spatialService = module.get(SpatialService);

  });

  describe('findAll', () => {
    it('should return all entities', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      dataService.findAll.mockResolvedValue(mockData);

      const result = await controller.findAll();

      expect(result).toEqual(mockData);
      expect(dataService.findAll).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
    });

    it('should apply pagination and ordering', async () => {
      dataService.findAll.mockResolvedValue([]);

      await controller.findAll('10', '20', 'name', 'DESC');

      expect(dataService.findAll).toHaveBeenCalledWith(undefined, 10, 20, { name: 'DESC' });
    });

    it('should throw NotFoundException when read not allowed', async () => {
      // Create new controller instance with different config
      const restrictedConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          switch (key) {
            case 'allowedCrud': return 'CUD';
            case 'allowSpatialQueries': return true;
            case 'apiSubpath': return '/test';
            default: return null;
          }
        }),
      };
      
      const RestrictedController = createDataController(restrictedConfigService as any);
      const restrictedModule = await Test.createTestingModule({
        controllers: [RestrictedController],
        providers: [
          { provide: DataService, useValue: dataService },
          { provide: SpatialService, useValue: spatialService },
          { provide: ConfigService, useValue: restrictedConfigService },
        ],
      }).compile();
      
      const restrictedController = restrictedModule.get(RestrictedController);
      await expect(restrictedController.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return single entity', async () => {
      const mockData = { id: 1, name: 'Test' };
      dataService.findOne.mockResolvedValue(mockData);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockData);
      expect(dataService.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when entity not found', async () => {
      dataService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create new entity', async () => {
      const newData = { name: 'New' };
      const savedData = { id: 1, ...newData };
      dataService.create.mockResolvedValue(savedData);

      const result = await controller.create(newData);

      expect(result).toEqual(savedData);
      expect(dataService.create).toHaveBeenCalledWith(newData);
    });

    it('should throw NotFoundException when create not allowed', async () => {
      const restrictedConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          switch (key) {
            case 'allowedCrud': return 'RUD';
            case 'allowSpatialQueries': return true;
            case 'apiSubpath': return '/test';
            default: return null;
          }
        }),
      };
      
      const RestrictedController = createDataController(restrictedConfigService as any);
      const restrictedModule = await Test.createTestingModule({
        controllers: [RestrictedController],
        providers: [
          { provide: DataService, useValue: dataService },
          { provide: SpatialService, useValue: spatialService },
          { provide: ConfigService, useValue: restrictedConfigService },
        ],
      }).compile();
      
      const restrictedController = restrictedModule.get(RestrictedController);
      await expect(restrictedController.create({})).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update entity with PUT', async () => {
      const updateData = { name: 'Updated' };
      const updated = { id: 1, ...updateData };
      dataService.update.mockResolvedValue(updated);

      const result = await controller.updatePut('1', updateData);

      expect(result).toEqual(updated);
      expect(dataService.update).toHaveBeenCalledWith('1', updateData);
    });

    it('should update entity with PATCH', async () => {
      const updateData = { name: 'Patched' };
      const updated = { id: 1, ...updateData };
      dataService.update.mockResolvedValue(updated);

      const result = await controller.updatePatch('1', updateData);

      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when update not allowed', async () => {
      const restrictedConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          switch (key) {
            case 'allowedCrud': return 'CRD';
            case 'allowSpatialQueries': return true;
            case 'apiSubpath': return '/test';
            default: return null;
          }
        }),
      };
      
      const RestrictedController = createDataController(restrictedConfigService as any);
      const restrictedModule = await Test.createTestingModule({
        controllers: [RestrictedController],
        providers: [
          { provide: DataService, useValue: dataService },
          { provide: SpatialService, useValue: spatialService },
          { provide: ConfigService, useValue: restrictedConfigService },
        ],
      }).compile();
      
      const restrictedController = restrictedModule.get(RestrictedController);
      await expect(restrictedController.updatePut('1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete entity', async () => {
      dataService.delete.mockResolvedValue(undefined);

      const result = await controller.delete('1');

      expect(result).toEqual({ message: 'Entity deleted successfully' });
      expect(dataService.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when delete not allowed', async () => {
      const restrictedConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          switch (key) {
            case 'allowedCrud': return 'CRU';
            case 'allowSpatialQueries': return true;
            case 'apiSubpath': return '/test';
            default: return null;
          }
        }),
      };
      
      const RestrictedController = createDataController(restrictedConfigService as any);
      const restrictedModule = await Test.createTestingModule({
        controllers: [RestrictedController],
        providers: [
          { provide: DataService, useValue: dataService },
          { provide: SpatialService, useValue: spatialService },
          { provide: ConfigService, useValue: restrictedConfigService },
        ],
      }).compile();
      
      const restrictedController = restrictedModule.get(RestrictedController);
      await expect(restrictedController.delete('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('spatialQuery', () => {
    it('should execute spatial query', async () => {
      const queryDto = { operation: 'intersects', geometry: 'POINT(0 0)' };
      const mockResult = [{ id: 1 }];
      spatialService.spatialQuery.mockResolvedValue(mockResult);

      const result = await controller.spatialQuery(queryDto);

      expect(result).toEqual(mockResult);
      expect(spatialService.spatialQuery).toHaveBeenCalledWith(queryDto);
    });

    it('should throw BadRequestException for invalid operation', async () => {
      const queryDto = { operation: 'invalid', geometry: 'POINT(0 0)' };

      await expect(controller.spatialQuery(queryDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when geometry missing', async () => {
      const queryDto = { operation: 'intersects', geometry: '' };

      await expect(controller.spatialQuery(queryDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for distance without distance param', async () => {
      const queryDto = { operation: 'distance', geometry: 'POINT(0 0)' };

      await expect(controller.spatialQuery(queryDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when spatial queries disabled', async () => {
      const restrictedConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          switch (key) {
            case 'allowedCrud': return 'CRUD';
            case 'allowSpatialQueries': return false;
            case 'apiSubpath': return '/test';
            default: return null;
          }
        }),
      };
      
      const RestrictedController = createDataController(restrictedConfigService as any);
      const restrictedModule = await Test.createTestingModule({
        controllers: [RestrictedController],
        providers: [
          { provide: DataService, useValue: dataService },
          { provide: SpatialService, useValue: spatialService },
          { provide: ConfigService, useValue: restrictedConfigService },
        ],
      }).compile();
      
      const restrictedController = restrictedModule.get(RestrictedController);
      await expect(restrictedController.spatialQuery({ operation: 'intersects', geometry: 'POINT(0 0)' }))
        .rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when read not allowed', async () => {
      const restrictedConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          switch (key) {
            case 'allowedCrud': return 'CUD';
            case 'allowSpatialQueries': return true;
            case 'apiSubpath': return '/test';
            default: return null;
          }
        }),
      };
      
      const RestrictedController = createDataController(restrictedConfigService as any);
      const restrictedModule = await Test.createTestingModule({
        controllers: [RestrictedController],
        providers: [
          { provide: DataService, useValue: dataService },
          { provide: SpatialService, useValue: spatialService },
          { provide: ConfigService, useValue: restrictedConfigService },
        ],
      }).compile();
      
      const restrictedController = restrictedModule.get(RestrictedController);
      await expect(restrictedController.spatialQuery({ operation: 'intersects', geometry: 'POINT(0 0)' }))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getSpatialMetadata', () => {
    it('should return spatial metadata', async () => {
      const metadata = { tableName: 'test', geometryColumns: [] };
      spatialService.getGeometryMetadata.mockReturnValue(metadata);

      const result = await controller.getSpatialMetadata();

      expect(result).toEqual(metadata);
    });

    it('should throw NotFoundException when spatial queries disabled', async () => {
      const restrictedConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          switch (key) {
            case 'allowedCrud': return 'CRUD';
            case 'allowSpatialQueries': return false;
            case 'apiSubpath': return '/test';
            default: return null;
          }
        }),
      };
      
      const RestrictedController = createDataController(restrictedConfigService as any);
      const restrictedModule = await Test.createTestingModule({
        controllers: [RestrictedController],
        providers: [
          { provide: DataService, useValue: dataService },
          { provide: SpatialService, useValue: spatialService },
          { provide: ConfigService, useValue: restrictedConfigService },
        ],
      }).compile();
      
      const restrictedController = restrictedModule.get(RestrictedController);
      await expect(restrictedController.getSpatialMetadata()).rejects.toThrow(NotFoundException);
    });
  });
});