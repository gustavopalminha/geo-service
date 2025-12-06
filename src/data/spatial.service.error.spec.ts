import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { SpatialService } from './spatial.service';
import { ConfigService } from '../config/config.service';

describe('SpatialService - Error Cases', () => {
  let service: SpatialService;
  let mockRepository: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockRepository = {
      query: jest.fn(),
      metadata: {
        tableName: 'places',
        columns: [{ databaseName: 'id' }],
      },
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        const config: any = {
          defaultSrid: 4326,
          defaultGeomColumn: 'geom',
          dbType: 'postgres',
          dbTable: 'places',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SpatialService,
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

    service = module.get<SpatialService>(SpatialService);
  });

  it('should throw error when no geometry column detected', async () => {
    const dto = {
      operation: 'intersects' as const,
      geometry: 'POINT(10 20)',
    };
    
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'defaultGeomColumn') return '';
      if (key === 'defaultSrid') return 4326;
      if (key === 'dbType') return 'postgres';
      return '';
    });
    
    // Override the geometry metadata to have no default column
    (service as any).geometryMetadata = { geometryColumns: [], defaultGeomColumn: null };

    await expect(service.spatialQuery(dto)).rejects.toThrow('No geometry column specified or detected');
  });

  it('should throw error for unsupported operation', async () => {
    const dto = {
      operation: 'unsupported' as any,
      geometry: 'POINT(10 20)',
      geometryColumn: 'geom',
    };
    mockRepository.query.mockRejectedValue(new Error('Unsupported spatial operation'));

    await expect(service.spatialQuery(dto)).rejects.toThrow();
  });

  it('should use postgres functions', async () => {
    const dto = {
      operation: 'intersects' as const,
      geometry: 'POINT(10 20)',
      geometryColumn: 'geom',
    };
    mockRepository.query.mockResolvedValue([]);

    await service.spatialQuery(dto);

    const query = mockRepository.query.mock.calls[0][0];
    expect(query).toContain('ST_');
  });
});
