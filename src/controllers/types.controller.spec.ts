import { Test, TestingModule } from '@nestjs/testing';
import { TypesController } from './types.controller';
import { ConfigService } from '../config/config.service';
import * as fs from 'fs';

jest.mock('fs');

describe('TypesController', () => {
  let controller: TypesController;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'dbType': return 'sqlite';
          case 'datasourceString': return './data/test.sqlite';
          case 'dbTable': return 'locations';
          case 'defaultGeomColumn': return 'geom';
          case 'defaultSrid': return 4326;
          default: return null;
        }
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TypesController],
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<TypesController>(TypesController);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return schema from dist when it exists', () => {
    // First check returns true (file exists in primary location)
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('dist content');

    const result = controller.getTypes();

    expect(result).toEqual({ schema: 'dist content' });
  });

  it('should return schema from src when dist is missing but src exists', () => {
    // First check returns false (primary missing), second check returns true (fallback exists)
    (fs.existsSync as jest.Mock)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    (fs.readFileSync as jest.Mock).mockReturnValue('src content');

    const result = controller.getTypes();

    expect(result).toEqual({ schema: 'src content' });
  });

  it('should return fallback when interface file does not exist in dist or src', () => {
    // Both checks return false
    (fs.existsSync as jest.Mock).mockReturnValue(false);

    const result = controller.getTypes();

    expect(result).toHaveProperty('schema');
    expect(result.schema).toBe('Interface available in source code');
    expect(result).toHaveProperty('path');
  });
});