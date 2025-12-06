import { SchemaValidationPipe } from './schema-validation.pipe';

describe('SchemaValidationPipe', () => {
  let pipe: SchemaValidationPipe;
  let mockDataSource: any;
  let mockConfigService: any;

  beforeEach(() => {
    pipe = new SchemaValidationPipe();
  });

  describe('without DataSource', () => {

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should allow all fields when no schema is configured', () => {
    const input = {
      id: 1,
      name: 'Test',
      latitude: 10.5,
      unknownField: 'should be kept',
      anotherUnknown: 123,
    };

    const result = pipe.transform(input, { type: 'body', metatype: Object });

    expect(result).toEqual(input);
  });

  it('should keep all allowed fields', () => {
    const input = {
      id: 1,
      name: 'Test',
      latitude: 10.5,
      longitude: 20.3,
      description: 'A test location',
    };

    const result = pipe.transform(input, { type: 'body', metatype: Object });

    expect(result).toEqual(input);
  });

  it('should allow unknown fields when no schema is configured', () => {
    const input = {
      unknown1: 'value1',
      unknown2: 'value2',
    };

    const result = pipe.transform(input, { type: 'body', metatype: Object });

    expect(result).toEqual(input);
  });

  it('should not process non-body parameters', () => {
    const input = { unknownField: 'value' };

    const result = pipe.transform(input, { type: 'param', metatype: Object });

    expect(result).toEqual(input);
  });

  it('should handle null input', () => {
    const result = pipe.transform(null, { type: 'body', metatype: Object });

    expect(result).toBeNull();
  });

  it('should handle non-object input', () => {
    const result = pipe.transform('string', { type: 'body', metatype: String });

    expect(result).toBe('string');
  });
  });

  describe('with DataSource and ConfigService', () => {
    beforeEach(() => {


      mockDataSource = {
        getMetadata: jest.fn().mockImplementation(() => {
          throw new Error('Metadata not found');
        }),
        createQueryRunner: jest.fn().mockReturnValue({
          getTable: jest.fn().mockResolvedValue({
            columns: [{ name: 'id' }, { name: 'name' }, { name: 'latitude' }]
          }),
          release: jest.fn()
        })
      };

      mockConfigService = {
        get: jest.fn().mockImplementation((key: string) => {
          if (key === 'dbTable') return 'test_table';
          return null;
        })
      };

      pipe = new SchemaValidationPipe(mockDataSource, mockConfigService);
    });

    it('should be defined with dependencies', () => {
      expect(pipe).toBeDefined();
    });

    it('should handle metadata initialization', async () => {
      const input = { id: 1, name: 'test', unknownField: 'remove' };
      
      // Allow time for async initialization
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const result = pipe.transform(input, { type: 'body', metatype: Object });
      
      expect(result).toBeDefined();
    });

    it('should handle missing table name', () => {
      mockConfigService.get.mockReturnValue('');
      const pipeWithoutTable = new SchemaValidationPipe(mockDataSource, mockConfigService);
      
      const input = { test: 'value' };
      const result = pipeWithoutTable.transform(input, { type: 'body', metatype: Object });
      
      expect(result).toEqual(input);
    });
  });
});
