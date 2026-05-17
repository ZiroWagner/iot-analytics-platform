import { testData } from '@test/utils/test-data';
import { configuration, validationSchema } from '@/config/configuration';

describe('Configuration', () => {
  describe('configuration', () => {
    it('should return default port when PORT not set', () => {
      delete process.env.PORT;
      const config = configuration();
      expect(config.PORT).toBe(3001);
    });

    it('should return custom port from env', () => {
      process.env.PORT = '4000';
      const config = configuration();
      expect(config.PORT).toBe(4000);
      delete process.env.PORT;
    });

    it('should return default database port', () => {
      delete process.env.DB_PORT;
      const config = configuration();
      expect(config.DB_PORT).toBe(5432);
    });

    it('should return custom database port from env', () => {
      process.env.DB_PORT = '5433';
      const config = configuration();
      expect(config.DB_PORT).toBe(5433);
      delete process.env.DB_PORT;
    });

    it('should return default redis host', () => {
      delete process.env.REDIS_HOST;
      const config = configuration();
      expect(config.REDIS_HOST).toBe('localhost');
    });

    it('should return custom redis host from env', () => {
      process.env.REDIS_HOST = 'redis.example.com';
      const config = configuration();
      expect(config.REDIS_HOST).toBe('redis.example.com');
      delete process.env.REDIS_HOST;
    });

    it('should return default redis port', () => {
      delete process.env.REDIS_PORT;
      const config = configuration();
      expect(config.REDIS_PORT).toBe(6379);
    });

    it('should return default frontend URL', () => {
      delete process.env.FRONTEND_URL;
      const config = configuration();
      expect(config.FRONTEND_URL).toBe('http://localhost:3000');
    });

    it('should return custom frontend URL from env', () => {
      process.env.FRONTEND_URL = 'https://app.example.com';
      const config = configuration();
      expect(config.FRONTEND_URL).toBe('https://app.example.com');
      delete process.env.FRONTEND_URL;
    });

    it('should return default JWT expires in', () => {
      delete process.env.JWT_EXPIRES_IN;
      const config = configuration();
      expect(config.JWT_EXPIRES_IN).toBe('7d');
    });

    it('should return custom JWT expires in from env', () => {
      process.env.JWT_EXPIRES_IN = '24h';
      const config = configuration();
      expect(config.JWT_EXPIRES_IN).toBe('24h');
      delete process.env.JWT_EXPIRES_IN;
    });

    it('should return default node env', () => {
      delete process.env.NODE_ENV;
      const config = configuration();
      expect(config.NODE_ENV).toBe('development');
    });

    it('should return environment variables', () => {
      process.env.DB_HOST = testData.url();
      process.env.DB_USER = testData.username();
      process.env.DB_PASSWORD = testData.alpha(10);
      process.env.DB_NAME = testData.alpha(5);
      process.env.DATABASE_URL = testData.url();
      process.env.JWT_SECRET = testData.alpha(20);
      process.env.GOOGLE_CLIENT_ID = testData.alpha(10);
      process.env.GOOGLE_CLIENT_SECRET = testData.alpha(10);
      process.env.GOOGLE_CALLBACK_URL = testData.url();
      process.env.GITHUB_CLIENT_ID = testData.alpha(10);
      process.env.GITHUB_CLIENT_SECRET = testData.alpha(10);
      process.env.GITHUB_CALLBACK_URL = testData.url();

      const config = configuration();

      expect(config.DB_HOST).toBe(process.env.DB_HOST);
      expect(config.DB_USER).toBe(process.env.DB_USER);
      expect(config.DB_PASSWORD).toBe(process.env.DB_PASSWORD);
      expect(config.DB_NAME).toBe(process.env.DB_NAME);
      expect(config.DATABASE_URL).toBe(process.env.DATABASE_URL);
      expect(config.JWT_SECRET).toBe(process.env.JWT_SECRET);
      expect(config.GOOGLE_CLIENT_ID).toBe(process.env.GOOGLE_CLIENT_ID);
      expect(config.GOOGLE_CLIENT_SECRET).toBe(
        process.env.GOOGLE_CLIENT_SECRET,
      );
      expect(config.GOOGLE_CALLBACK_URL).toBe(process.env.GOOGLE_CALLBACK_URL);
      expect(config.GITHUB_CLIENT_ID).toBe(process.env.GITHUB_CLIENT_ID);
      expect(config.GITHUB_CLIENT_SECRET).toBe(
        process.env.GITHUB_CLIENT_SECRET,
      );
      expect(config.GITHUB_CALLBACK_URL).toBe(process.env.GITHUB_CALLBACK_URL);

      delete process.env.DB_HOST;
      delete process.env.DB_USER;
      delete process.env.DB_PASSWORD;
      delete process.env.DB_NAME;
      delete process.env.DATABASE_URL;
      delete process.env.JWT_SECRET;
      delete process.env.GOOGLE_CLIENT_ID;
      delete process.env.GOOGLE_CLIENT_SECRET;
      delete process.env.GOOGLE_CALLBACK_URL;
      delete process.env.GITHUB_CLIENT_ID;
      delete process.env.GITHUB_CLIENT_SECRET;
      delete process.env.GITHUB_CALLBACK_URL;
    });
  });

  describe('validationSchema', () => {
    it('should validate valid config', () => {
      const validConfig = {
        DATABASE_URL: testData.url(),
        JWT_SECRET: testData.alpha(20),
        GOOGLE_CLIENT_ID: testData.alpha(10),
        GOOGLE_CLIENT_SECRET: testData.alpha(10),
        GOOGLE_CALLBACK_URL: testData.url(),
        GITHUB_CLIENT_ID: testData.alpha(10),
        GITHUB_CLIENT_SECRET: testData.alpha(10),
        GITHUB_CALLBACK_URL: testData.url(),
      };
      const result = validationSchema.validate(validConfig);
      expect(result.error).toBeUndefined();
    });

    it('should fail when DATABASE_URL is missing', () => {
      const config = {
        JWT_SECRET: testData.alpha(20),
        GOOGLE_CLIENT_ID: testData.alpha(10),
        GOOGLE_CLIENT_SECRET: testData.alpha(10),
        GOOGLE_CALLBACK_URL: testData.url(),
        GITHUB_CLIENT_ID: testData.alpha(10),
        GITHUB_CLIENT_SECRET: testData.alpha(10),
        GITHUB_CALLBACK_URL: testData.url(),
      };
      const result = validationSchema.validate(config);
      expect(result.error).toBeDefined();
    });

    it('should fail when JWT_SECRET is missing', () => {
      const config = {
        DATABASE_URL: testData.url(),
        GOOGLE_CLIENT_ID: testData.alpha(10),
        GOOGLE_CLIENT_SECRET: testData.alpha(10),
        GOOGLE_CALLBACK_URL: testData.url(),
        GITHUB_CLIENT_ID: testData.alpha(10),
        GITHUB_CLIENT_SECRET: testData.alpha(10),
        GITHUB_CALLBACK_URL: testData.url(),
      };
      const result = validationSchema.validate(config);
      expect(result.error).toBeDefined();
    });

    it('should apply defaults for optional fields', () => {
      const minimalConfig = {
        DATABASE_URL: testData.url(),
        JWT_SECRET: testData.alpha(20),
        GOOGLE_CLIENT_ID: testData.alpha(10),
        GOOGLE_CLIENT_SECRET: testData.alpha(10),
        GOOGLE_CALLBACK_URL: testData.url(),
        GITHUB_CLIENT_ID: testData.alpha(10),
        GITHUB_CLIENT_SECRET: testData.alpha(10),
        GITHUB_CALLBACK_URL: testData.url(),
      };
      const result = validationSchema.validate(minimalConfig);
      expect(result.value.PORT).toBe(3001);
      expect(result.value.JWT_EXPIRES_IN).toBe('7d');
      expect(result.value.FRONTEND_URL).toBe('http://localhost:3000');
      expect(result.value.REDIS_HOST).toBe('localhost');
      expect(result.value.REDIS_PORT).toBe(6379);
      expect(result.value.NODE_ENV).toBe('development');
    });

    it('should reject invalid NODE_ENV', () => {
      const config = {
        DATABASE_URL: testData.url(),
        JWT_SECRET: testData.alpha(20),
        GOOGLE_CLIENT_ID: testData.alpha(10),
        GOOGLE_CLIENT_SECRET: testData.alpha(10),
        GOOGLE_CALLBACK_URL: testData.url(),
        GITHUB_CLIENT_ID: testData.alpha(10),
        GITHUB_CLIENT_SECRET: testData.alpha(10),
        GITHUB_CALLBACK_URL: testData.url(),
        NODE_ENV: 'invalid',
      };
      const result = validationSchema.validate(config);
      expect(result.error).toBeDefined();
    });

    it('should accept valid NODE_ENV values', () => {
      const validEnvs = ['development', 'production', 'test'];
      for (const env of validEnvs) {
        const config = {
          DATABASE_URL: testData.url(),
          JWT_SECRET: testData.alpha(20),
          GOOGLE_CLIENT_ID: testData.alpha(10),
          GOOGLE_CLIENT_SECRET: testData.alpha(10),
          GOOGLE_CALLBACK_URL: testData.url(),
          GITHUB_CLIENT_ID: testData.alpha(10),
          GITHUB_CLIENT_SECRET: testData.alpha(10),
          GITHUB_CALLBACK_URL: testData.url(),
          NODE_ENV: env,
        };
        const result = validationSchema.validate(config);
        expect(result.error).toBeUndefined();
      }
    });
  });
});
