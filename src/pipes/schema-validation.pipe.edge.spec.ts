import { SchemaValidationPipe } from './schema-validation.pipe';

describe('SchemaValidationPipe - Edge Cases', () => {
  let pipe: SchemaValidationPipe;


  beforeEach(() => {
    let mockDataSource: any;
    let mockConfigService: any;
    const mockMetadata = {
      columns: [
        { propertyName: 'id' },
        { propertyName: 'name' },
        { propertyName: 'value' },
      ],
    };

    mockDataSource = {
      getMetadata: jest.fn().mockReturnValue(mockMetadata),
    };

    mockConfigService = {
      get: jest.fn().mockReturnValue('test_table'),
    };

    pipe = new SchemaValidationPipe(mockDataSource, mockConfigService);
  });

  it('should strip unknown fields with metadata', async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const input = {
      id: 1,
      name: 'test',
      value: 100,
      unknown: 'remove',
    };

    const result = pipe.transform(input, { type: 'body', metatype: Object });

    expect(result).toEqual({ id: 1, name: 'test', value: 100 });
    expect(result).not.toHaveProperty('unknown');
  });

  it('should handle empty object', async () => {
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const result = pipe.transform({}, { type: 'body', metatype: Object });

    expect(result).toEqual({});
  });
});
