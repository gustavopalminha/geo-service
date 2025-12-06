import { UnauthorizedException } from '@nestjs/common';
import { SecurityMiddleware } from './security.middleware';

describe('SecurityMiddleware', () => {
  let middleware: SecurityMiddleware;
  let mockConfigService: any;
  let mockRequest: any;
  let mockResponse: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn(),
    };
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  it('should allow request when SERVICE_HEADER is not set', () => {
    mockConfigService.get.mockReturnValue('');
    middleware = new SecurityMiddleware(mockConfigService);

    middleware.use(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should allow request with valid header', () => {
    mockConfigService.get.mockReturnValue('secret-key');
    mockRequest.headers['x-geo-call'] = 'secret-key';
    middleware = new SecurityMiddleware(mockConfigService);

    middleware.use(mockRequest, mockResponse, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException with invalid header', () => {
    mockConfigService.get.mockReturnValue('secret-key');
    mockRequest.headers['x-geo-call'] = 'wrong-key';
    middleware = new SecurityMiddleware(mockConfigService);

    expect(() => {
      middleware.use(mockRequest, mockResponse, mockNext);
    }).toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when header is missing', () => {
    mockConfigService.get.mockReturnValue('secret-key');
    middleware = new SecurityMiddleware(mockConfigService);

    expect(() => {
      middleware.use(mockRequest, mockResponse, mockNext);
    }).toThrow(UnauthorizedException);
  });
});
