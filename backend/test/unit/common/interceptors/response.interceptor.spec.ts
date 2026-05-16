import { ResponseInterceptor } from '@/common/interceptores/response.interceptor';
import { of } from 'rxjs';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  it('should wrap response in standard format', (done) => {
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ url: '/test', method: 'GET' }),
        getResponse: () => ({ statusCode: 200 }),
      }),
    } as any;

    const mockHandler = {
      handle: () => of({ foo: 'bar' }),
    } as any;

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ foo: 'bar' });
      expect(result.path).toBe('/test');
      done();
    });
  });
});
