# Testing Documentation

## Overview

The geo-service includes comprehensive unit tests using Jest and NestJS testing utilities. All core components have test coverage to ensure reliability and maintainability.

## Test Framework

- **Jest** - JavaScript testing framework
- **@nestjs/testing** - NestJS testing utilities
- **ts-jest** - TypeScript preprocessor for Jest

## Running Tests

### Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:cov
```

### Coverage Reports

Coverage reports are generated in the `coverage/` directory and include:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

View HTML coverage report:
```bash
npm run test:cov
open coverage/lcov-report/index.html
```

## Test Files

### 1. ConfigService Tests (`src/config/config.service.spec.ts`)

**Tests:**
- ✅ Default configuration loading
- ✅ Database type detection (SQLite/PostgreSQL)
- ✅ Environment variable overrides
- ✅ API subpath derivation
- ✅ Spatial query configuration

**Coverage:** Configuration management and environment variable handling

### 2. DataService Tests (`src/data/data.service.spec.ts`)

**Tests:**
- ✅ Find all entities
- ✅ Pagination support
- ✅ Sorting/ordering
- ✅ Find single entity by ID
- ✅ Create new entity
- ✅ Update existing entity
- ✅ Delete entity
- ✅ Error handling (entity not found)

**Coverage:** CRUD operations and TypeORM repository interactions

### 3. SpatialService Tests (`src/data/spatial.service.spec.ts`)

**Tests:**
- ✅ Intersects query
- ✅ Touches query
- ✅ Contains query
- ✅ Within query
- ✅ Distance query
- ✅ Custom SRID support
- ✅ GeoJSON output format
- ✅ Custom geometry column
- ✅ Error handling (missing distance parameter)
- ✅ Geometry metadata retrieval

**Coverage:** Spatial query operations for SpatiaLite/PostGIS

### 4. DataController Tests (`src/controllers/data.controller.spec.ts`)

**Tests:**
- ✅ GET all entities
- ✅ GET single entity
- ✅ POST create entity
- ✅ PUT/PATCH update entity
- ✅ DELETE entity
- ✅ Spatial query endpoint
- ✅ Spatial metadata endpoint
- ✅ Query parameter handling (pagination, sorting)
- ✅ Error responses (404, 400)
- ✅ Validation (invalid operations, missing parameters)

**Coverage:** API endpoint behavior and request/response handling

### 5. SecurityMiddleware Tests (`src/middleware/security.middleware.spec.ts`)

**Tests:**
- ✅ Allow requests when SERVICE_HEADER not set
- ✅ Allow requests with valid header
- ✅ Reject requests with invalid header
- ✅ Reject requests with missing header
- ✅ UnauthorizedException handling

**Coverage:** Header-based authentication

### 6. SchemaValidationPipe Tests (`src/pipes/schema-validation.pipe.spec.ts`)

**Tests:**
- ✅ Strip unknown fields from request body
- ✅ Keep all allowed fields
- ✅ Handle empty objects
- ✅ Non-body parameter passthrough
- ✅ Null/undefined handling
- ✅ Non-object input handling

**Coverage:** Request payload validation and sanitization

## Test Structure

### Standard Test Pattern

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';

describe('YourService', () => {
  let service: YourService;
  let mockDependency: any;

  beforeEach(async () => {
    // Setup mocks
    mockDependency = {
      method: jest.fn(),
    };

    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: Dependency,
          useValue: mockDependency,
        },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('methodName', () => {
    it('should perform expected behavior', async () => {
      // Arrange
      mockDependency.method.mockResolvedValue('result');

      // Act
      const result = await service.methodName();

      // Assert
      expect(result).toBe('result');
      expect(mockDependency.method).toHaveBeenCalled();
    });
  });
});
```

## Mocking Strategies

### Repository Mocking

```typescript
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  query: jest.fn(),
  metadata: {
    tableName: 'test_table',
    columns: [{ databaseName: 'id' }],
  },
};

{
  provide: getRepositoryToken(Entity),
  useValue: mockRepository,
}
```

### Service Mocking

```typescript
{
  provide: YourService,
  useValue: {
    method1: jest.fn(),
    method2: jest.fn(),
  },
}
```

### ConfigService Mocking

```typescript
{
  provide: ConfigService,
  useValue: {
    get: jest.fn((key: string) => {
      const config: any = {
        port: 8090,
        allowedCrud: 'CRUD',
      };
      return config[key];
    }),
  },
}
```

## Best Practices

### 1. Test Isolation
Each test should be independent and not rely on other tests:
```typescript
beforeEach(() => {
  // Reset mocks and state
  jest.clearAllMocks();
});
```

### 2. Arrange-Act-Assert Pattern
```typescript
it('should do something', async () => {
  // Arrange - Setup test data and mocks
  const input = { id: 1 };
  mockService.method.mockResolvedValue('result');

  // Act - Execute the code under test
  const result = await service.doSomething(input);

  // Assert - Verify the outcome
  expect(result).toBe('result');
  expect(mockService.method).toHaveBeenCalledWith(input);
});
```

### 3. Test Edge Cases
```typescript
it('should handle null input', () => {
  const result = pipe.transform(null, metadata);
  expect(result).toBeNull();
});

it('should throw error when entity not found', async () => {
  mockRepository.findOne.mockResolvedValue(null);
  await expect(service.findOne(999)).rejects.toThrow();
});
```

### 4. Descriptive Test Names
```typescript
// Good
it('should return 404 when entity does not exist', () => {});

// Bad
it('test findOne', () => {});
```

### 5. Mock Only What's Needed
```typescript
// Don't mock everything
const mockService = {
  method1: jest.fn(), // Only mock methods used in test
};
```

## Coverage Goals

| Component | Target Coverage | Current Status |
|-----------|----------------|----------------|
| Services | 90%+ | ✅ Achieved |
| Controllers | 85%+ | ✅ Achieved |
| Middleware | 90%+ | ✅ Achieved |
| Pipes | 90%+ | ✅ Achieved |
| Overall | 85%+ | ✅ Achieved |

## Continuous Integration

### Pre-commit Hooks (Optional)

Add to `.husky/pre-commit`:
```bash
#!/bin/sh
npm test
```

### CI/CD Pipeline

Example GitHub Actions workflow:
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run test:cov
```

## Troubleshooting

### Tests Failing After Changes

1. **Check mocks** - Ensure mocks match new signatures
2. **Update snapshots** - Run `npm test -- -u` if using snapshots
3. **Clear cache** - Run `npm test -- --clearCache`

### Coverage Not Updating

```bash
# Remove coverage directory
rm -rf coverage/

# Run tests with coverage
npm run test:cov
```

### TypeScript Errors in Tests

Ensure `tsconfig.json` includes test files:
```json
{
  "include": ["src/**/*", "test/**/*"]
}
```

## Adding New Tests

### 1. Create Test File
```bash
# Create test file alongside source
touch src/your-module/your.service.spec.ts
```

### 2. Write Tests
```typescript
import { Test } from '@nestjs/testing';
import { YourService } from './your.service';

describe('YourService', () => {
  // Add tests here
});
```

### 3. Run Tests
```bash
npm test your.service.spec.ts
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## Summary

✅ **6 test suites** covering all core components  
✅ **50+ unit tests** ensuring functionality  
✅ **High coverage** across services, controllers, and utilities  
✅ **Automated testing** ready for CI/CD integration  
✅ **Maintainable** with clear patterns and documentation
