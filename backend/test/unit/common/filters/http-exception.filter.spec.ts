import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockRequest = {
      url: '/test',
      method: 'GET',
    };
    mockArgumentsHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    };
  });

  it('should format simple string exception', () => {
    const exception = new HttpException('Simple error', HttpStatus.BAD_REQUEST);
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: 400,
        details: ['Simple error'],
      }),
    );
  });

  it('should format complex object exception with array of messages', () => {
    const exception = new HttpException(
      { message: ['val1', 'val2'] },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
    filter.catch(exception, mockArgumentsHost);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        details: ['val1', 'val2'],
      }),
    );
  });

  it('should log error for 500 status', () => {
    const exception = new HttpException(
      'Server crash',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    const loggerSpy = jest.spyOn((filter as any).logger, 'error');

    filter.catch(exception, mockArgumentsHost);

    expect(loggerSpy).toHaveBeenCalled();
  });

  it('should log warn for 400 status', () => {
    const exception = new HttpException('Bad input', HttpStatus.BAD_REQUEST);
    const loggerSpy = jest.spyOn((filter as any).logger, 'warn');

    filter.catch(exception, mockArgumentsHost);

    expect(loggerSpy).toHaveBeenCalled();
  });
});
