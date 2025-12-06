import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { DataService } from './data.service';
import { ConfigService } from '../config/config.service';

describe('DataService', () => {
  let service: DataService;
  let mockRepository: any;
  let mockDataSource: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      metadata: {
        primaryColumns: [{ propertyName: 'id' }],
        columns: [
          { propertyName: 'id' },
          { propertyName: 'name' },
          { propertyName: 'geometry' },
        ],
      },
    };

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'dbTable') return 'test_table';
        return null;
      }),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all entities', async () => {
      const mockData = [{ id: 1, name: 'Test' }];
      mockRepository.find.mockResolvedValue(mockData);

      const result = await service.findAll();

      expect(result).toEqual(mockData);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should apply pagination', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.findAll(undefined, 10, 20);

      expect(mockRepository.find).toHaveBeenCalledWith({
        select: ['id', 'name'],
        where: undefined,
        skip: 10,
        take: 20,
        order: undefined,
      });
    });

    it('should apply ordering', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.findAll(undefined, undefined, undefined, { name: 'ASC' });

      expect(mockRepository.find).toHaveBeenCalledWith({
        select: ['id', 'name'],
        where: undefined,
        skip: undefined,
        take: undefined,
        order: { name: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single entity', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockRepository.findOne.mockResolvedValue(mockData);

      const result = await service.findOne(1);

      expect(result).toEqual(mockData);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        select: ['id', 'name'],
        where: { id: 1 },
      });
    });

    it('should return null if not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });

    it('should use correct primary column from metadata', async () => {
      mockRepository.metadata.primaryColumns = [{ propertyName: 'pkuid' }];
      const mockData = { pkuid: 1, name: 'Test' };
      mockRepository.findOne.mockResolvedValue(mockData);

      await service.findOne(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        select: ['id', 'name'],
        where: { pkuid: 1 },
      });
    });
  });

  describe('create', () => {
    it('should create a new entity', async () => {
      const newData = { name: 'New Location' };
      const savedData = { id: 1, ...newData };

      mockRepository.create.mockReturnValue(newData);
      mockRepository.save.mockResolvedValue(savedData);

      const result = await service.create(newData);

      expect(result).toEqual(savedData);
      expect(mockRepository.create).toHaveBeenCalledWith(newData);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update an entity', async () => {
      const updateData = { name: 'Updated' };
      const updatedEntity = { id: 1, ...updateData };

      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(updatedEntity);

      const result = await service.update(1, updateData);

      expect(result).toEqual(updatedEntity);
      expect(mockRepository.update).toHaveBeenCalledWith({ id: 1 }, updateData);
    });

    it('should throw error if entity not found', async () => {
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, {})).rejects.toThrow('Entity not found');
    });

    it('should use correct primary column for update', async () => {
      mockRepository.metadata.primaryColumns = [{ propertyName: 'pkuid' }];
      mockRepository.update.mockResolvedValue({ affected: 1 });
      mockRepository.findOne.mockResolvedValue({ pkuid: 1 });

      await service.update(1, {});

      expect(mockRepository.update).toHaveBeenCalledWith({ pkuid: 1 }, {});
    });
  });

  describe('delete', () => {
    it('should delete an entity', async () => {
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(1);

      expect(mockRepository.delete).toHaveBeenCalledWith({ id: 1 });
    });

    it('should use correct primary column for delete', async () => {
      mockRepository.metadata.primaryColumns = [{ propertyName: 'pkuid' }];
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(1);

      expect(mockRepository.delete).toHaveBeenCalledWith({ pkuid: 1 });
    });
  });
});
