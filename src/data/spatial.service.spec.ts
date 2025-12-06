import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { SpatialService } from './spatial.service';
import { ConfigService } from '../config/config.service';

describe('SpatialService', () => {
  let service: SpatialService;
  let mockRepository: any;
  let mockConfigService: any;

  beforeEach(async () => {
    mockRepository = {
      query: jest.fn(),
      metadata: {
        tableName: 'places',
        columns: [
          { databaseName: 'id' },
          { databaseName: 'name' },
          { databaseName: 'geom' },
        ],
      },
      manager: {
        connection: {
          driver: {
            options: {
              type: 'better-sqlite3',
            },
            databaseConnection: {
              loadExtension: jest.fn(),
            },
          },
        },
      },
    };

    const mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepository),
      query: jest.fn().mockResolvedValue([{ 'spatialite_version()': '5.0.1' }]),
    };

    mockConfigService = {
      get: jest.fn((key: string) => {
        const config: any = {
          defaultSrid: 4326,
          defaultGeomColumn: 'geom',
          dbType: 'sqlite',
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('spatialQuery', () => {
    it('should execute intersects query', async () => {
      const dto = {
        operation: 'intersects' as const,
        geometry: 'POINT(10 20)',
      };
      mockRepository.query.mockResolvedValue([{ id: 1, name: 'Test' }]);

      const result = await service.spatialQuery(dto);

      expect(result).toBeDefined();
      expect(mockRepository.query).toHaveBeenCalled();
      const query = mockRepository.query.mock.calls[0][0];
      expect(query).toContain('Intersects');
      expect(query).toContain('POINT(10 20)');
    });

    it('should use SQLite function names for SQLite', async () => {
      const dto = {
        operation: 'intersects' as const,
        geometry: 'POINT(10 20)',
      };
      mockRepository.query.mockResolvedValue([]);

      await service.spatialQuery(dto);

      const query = mockRepository.query.mock.calls[0][0];
      expect(query).toContain('Intersects');
      expect(query).not.toContain('ST_Intersects');
      expect(query).toContain('GeomFromText');
      expect(query).not.toContain('ST_GeomFromText');
    });

    it('should use PostGIS function names for Postgres', async () => {
      // Mock config to return postgres
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'dbType') return 'postgres';
        if (key === 'defaultSrid') return 4326;
        if (key === 'defaultGeomColumn') return 'geom';
        return null;
      });

      // Re-initialize service to pick up new config if needed, 
      // but here we just need spatialQuery to read the config.
      // However, spatialQuery reads configService.get('dbType') every time.

      const dto = {
        operation: 'intersects' as const,
        geometry: 'POINT(10 20)',
      };
      mockRepository.query.mockResolvedValue([]);

      await service.spatialQuery(dto);

      const query = mockRepository.query.mock.calls[0][0];
      expect(query).toContain('ST_Intersects');
      expect(query).toContain('ST_GeomFromText');
    });

    it('should execute touches query', async () => {
      const dto = {
        operation: 'touches' as const,
        geometry: 'LINESTRING(0 0, 10 10)',
      };
      mockRepository.query.mockResolvedValue([]);

      await service.spatialQuery(dto);

      const query = mockRepository.query.mock.calls[0][0];
      // Default mock is sqlite
      expect(query).toContain('Touches');
    });

    it('should execute contains query', async () => {
      const dto = {
        operation: 'contains' as const,
        geometry: 'POINT(5 5)',
      };
      mockRepository.query.mockResolvedValue([]);

      await service.spatialQuery(dto);

      const query = mockRepository.query.mock.calls[0][0];
      expect(query).toContain('Contains');
    });

    it('should execute within query', async () => {
      const dto = {
        operation: 'within' as const,
        geometry: 'POLYGON((0 0, 10 0, 10 10, 0 10, 0 0))',
      };
      mockRepository.query.mockResolvedValue([]);

      await service.spatialQuery(dto);

      const query = mockRepository.query.mock.calls[0][0];
      expect(query).toContain('Within');
    });

    it('should execute distance query', async () => {
      const dto = {
        operation: 'distance' as const,
        geometry: 'POINT(10 20)',
        distance: 1000,
      };
      mockRepository.query.mockResolvedValue([]);

      await service.spatialQuery(dto);

      const query = mockRepository.query.mock.calls[0][0];
      expect(query).toContain('Distance');
      expect(query).toContain('1000');
    });

    it('should throw error for distance query without distance parameter', async () => {
      const dto = {
        operation: 'distance' as const,
        geometry: 'POINT(10 20)',
      };

      await expect(service.spatialQuery(dto)).rejects.toThrow(
        'Distance parameter required for distance operation'
      );
    });

    it('should use custom SRID', async () => {
      const dto = {
        operation: 'intersects' as const,
        geometry: 'POINT(10 20)',
        srid: 3857,
      };
      mockRepository.query.mockResolvedValue([]);

      await service.spatialQuery(dto);

      const query = mockRepository.query.mock.calls[0][0];
      expect(query).toContain('3857');
    });

    it('should output as GeoJSON when specified', async () => {
      const dto = {
        operation: 'intersects' as const,
        geometry: 'POINT(10 20)',
        outputFormat: 'geojson' as const,
        geometryColumn: 'geom',
      };
      mockRepository.query.mockResolvedValue([]);

      await service.spatialQuery(dto);

      const query = mockRepository.query.mock.calls[0][0];
      expect(query).toContain('AsGeoJSON');
    });

    it('should use custom geometry column', async () => {
      const dto = {
        operation: 'intersects' as const,
        geometry: 'POINT(10 20)',
        geometryColumn: 'shape',
      };
      mockRepository.query.mockResolvedValue([]);

      await service.spatialQuery(dto);

      const query = mockRepository.query.mock.calls[0][0];
      expect(query).toContain('shape');
    });
  });

  describe('getGeometryMetadata', () => {
    it('should return geometry metadata', () => {
      const metadata = service.getGeometryMetadata();
      expect(metadata).toBeDefined();
    });
  });
});
