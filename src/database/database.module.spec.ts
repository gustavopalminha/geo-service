import { DatabaseModule } from './database.module';
import { ConfigService } from '../config/config.service';

describe('DatabaseModule', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'dbType': return 'sqlite';
          case 'datasourceString': return './test.db';
          case 'dbTable': return 'test_table';
          default: return null;
        }
      }),
    } as any;
  });

  it('should create dynamic module for SQLite', () => {
    const module = DatabaseModule.forRoot(configService);

    expect(module).toBeDefined();
    expect(module.module).toBe(DatabaseModule);
    expect(module.imports).toBeDefined();
  });

  it('should create dynamic module for PostgreSQL', () => {
    (configService.get as jest.Mock).mockImplementation((key: string) => {
      switch (key) {
        case 'dbType': return 'postgres';
        case 'datasourceString': return 'postgresql://user:pass@localhost/db';
        case 'dbTable': return 'test_table';
        default: return null;
      }
    });

    const module = DatabaseModule.forRoot(configService);

    expect(module).toBeDefined();
    expect(module.module).toBe(DatabaseModule);
  });

  it('should handle missing table name', () => {
    (configService.get as jest.Mock).mockImplementation((key: string) => {
      switch (key) {
        case 'dbType': return 'sqlite';
        case 'datasourceString': return './test.db';
        case 'dbTable': return '';
        default: return null;
      }
    });

    const module = DatabaseModule.forRoot(configService);

    expect(module).toBeDefined();
  });
});