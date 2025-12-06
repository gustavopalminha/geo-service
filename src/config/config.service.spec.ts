import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let configService: ConfigService;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {};
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should load default configuration', () => {
    configService = new ConfigService();
    
    expect(configService.get('host')).toBe('localhost');
    expect(configService.get('port')).toBe(8090);
    expect(configService.get('apiRoot')).toBe('/geo');
    expect(configService.get('allowedCrud')).toBe('R');
    expect(configService.get('defaultSrid')).toBe(4326);
    expect(configService.get('allowSpatialQueries')).toBe(true);
  });

  it('should detect SQLite database type', () => {
    process.env.DATASOURCE_STRING = './data/test.sqlite';
    configService = new ConfigService();
    
    expect(configService.get('dbType')).toBe('sqlite');
  });

  it('should detect PostgreSQL database type', () => {
    process.env.DATASOURCE_STRING = 'postgresql://user:pass@localhost:5432/db';
    configService = new ConfigService();
    
    expect(configService.get('dbType')).toBe('postgres');
  });

  it('should override with environment variables', () => {
    process.env.PORT = '9000';
    process.env.ALLOWED_CRUD = 'CRUD';
    process.env.DEFAULT_SRID = '3857';
    
    configService = new ConfigService();
    
    expect(configService.get('port')).toBe(9000);
    expect(configService.get('allowedCrud')).toBe('CRUD');
    expect(configService.get('defaultSrid')).toBe(3857);
  });

  it('should derive API subpath from datasource', () => {
    process.env = {};
    process.env.DATASOURCE_STRING = './data/counties.sqlite';
    configService = new ConfigService();
    
    expect(configService.get('apiSubpath')).toBe('/counties');
  });

  it('should disable spatial queries when set to false', () => {
    process.env.ALLOW_SPATIAL_QUERIES = 'false';
    configService = new ConfigService();
    
    expect(configService.get('allowSpatialQueries')).toBe(false);
  });

  describe('table name derivation', () => {
    it('should derive table name from SQLite filename', () => {
      process.env.DATASOURCE_STRING = './data/locations.sqlite';
      process.env.DB_TYPE = 'sqlite';
      delete process.env.DB_TABLE;
      
      configService = new ConfigService();
      
      expect(configService.get('dbTable')).toBe('locations');
    });

    it('should use default for PostgreSQL when no table specified', () => {
      process.env.DATASOURCE_STRING = 'postgresql://user:pass@localhost/db';
      process.env.DB_TYPE = 'postgres';
      delete process.env.DB_TABLE;
      
      configService = new ConfigService();
      
      expect(configService.get('dbTable')).toBe('locations');
    });

    it('should use explicit DB_TABLE when provided', () => {
      process.env.DATASOURCE_STRING = './data/test.sqlite';
      process.env.DB_TABLE = 'custom_table';
      
      configService = new ConfigService();
      
      expect(configService.get('dbTable')).toBe('custom_table');
    });

    it('should handle complex SQLite paths', () => {
      process.env.DATASOURCE_STRING = '/path/to/my-database.sqlite';
      process.env.DB_TYPE = 'sqlite';
      delete process.env.DB_TABLE;
      
      configService = new ConfigService();
      
      expect(configService.get('dbTable')).toBe('my-database');
    });
  });
});
