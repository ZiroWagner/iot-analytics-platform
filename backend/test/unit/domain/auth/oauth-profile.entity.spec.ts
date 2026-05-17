import { testData } from '@test/utils/test-data';
import { OAuthProfile } from '@/auth/domain/entities/oauth-profile.entity';

describe('OAuthProfile', () => {
  describe('create', () => {
    it('should create an OAuthProfile with all required fields', () => {
      const provider = 'google';
      const providerAccountId = testData.uuid();
      const email = testData.email();
      const name = testData.name();
      const image = testData.avatar();

      const profile = OAuthProfile.create({
        provider,
        providerAccountId,
        email,
        name,
        image,
      });

      expect(profile.provider).toBe(provider);
      expect(profile.providerAccountId).toBe(providerAccountId);
      expect(profile.email).toBe(email);
      expect(profile.name).toBe(name);
      expect(profile.image).toBe(image);
      expect(profile.accessToken).toBeNull();
      expect(profile.refreshToken).toBeNull();
    });

    it('should create an OAuthProfile with all optional fields', () => {
      const accessToken = testData.alphanumeric(40);
      const refreshToken = testData.alphanumeric(40);

      const profile = OAuthProfile.create({
        provider: 'github',
        providerAccountId: testData.uuid(),
        email: testData.email(),
        name: testData.name(),
        image: testData.avatar(),
        accessToken,
        refreshToken,
      });

      expect(profile.accessToken).toBe(accessToken);
      expect(profile.refreshToken).toBe(refreshToken);
    });

    it('should set email to null when not provided', () => {
      const profile = OAuthProfile.create({
        provider: 'google',
        providerAccountId: testData.uuid(),
      });

      expect(profile.email).toBeNull();
    });

    it('should set name to null when not provided', () => {
      const profile = OAuthProfile.create({
        provider: 'google',
        providerAccountId: testData.uuid(),
      });

      expect(profile.name).toBeNull();
    });

    it('should set image to null when not provided', () => {
      const profile = OAuthProfile.create({
        provider: 'google',
        providerAccountId: testData.uuid(),
      });

      expect(profile.image).toBeNull();
    });

    it('should handle empty string as null for email', () => {
      const profile = OAuthProfile.create({
        provider: 'google',
        providerAccountId: testData.uuid(),
        email: '',
      });

      expect(profile.email).toBeNull();
    });

    it('should handle empty string as null for name', () => {
      const profile = OAuthProfile.create({
        provider: 'google',
        providerAccountId: testData.uuid(),
        name: '',
      });

      expect(profile.name).toBeNull();
    });

    it('should handle empty string as null for image', () => {
      const profile = OAuthProfile.create({
        provider: 'google',
        providerAccountId: testData.uuid(),
        image: '',
      });

      expect(profile.image).toBeNull();
    });

    it('should handle empty string as null for accessToken', () => {
      const profile = OAuthProfile.create({
        provider: 'google',
        providerAccountId: testData.uuid(),
        accessToken: '',
      });

      expect(profile.accessToken).toBeNull();
    });

    it('should handle empty string as null for refreshToken', () => {
      const profile = OAuthProfile.create({
        provider: 'google',
        providerAccountId: testData.uuid(),
        refreshToken: '',
      });

      expect(profile.refreshToken).toBeNull();
    });

    it('should create profile for github provider', () => {
      const profile = OAuthProfile.create({
        provider: 'github',
        providerAccountId: testData.uuid(),
        email: testData.email(),
        name: testData.name(),
      });

      expect(profile.provider).toBe('github');
    });

    it('should create profile for google provider', () => {
      const profile = OAuthProfile.create({
        provider: 'google',
        providerAccountId: testData.uuid(),
        email: testData.email(),
        name: testData.name(),
      });

      expect(profile.provider).toBe('google');
    });
  });

  describe('constructor', () => {
    it('should create OAuthProfile with direct constructor', () => {
      const profile = new OAuthProfile(
        'google',
        testData.uuid(),
        testData.email(),
        testData.name(),
        testData.avatar(),
        testData.alphanumeric(40),
        testData.alphanumeric(40),
      );

      expect(profile.provider).toBe('google');
      expect(profile.email).not.toBeNull();
      expect(profile.name).not.toBeNull();
      expect(profile.accessToken).not.toBeNull();
      expect(profile.refreshToken).not.toBeNull();
    });
  });
});
